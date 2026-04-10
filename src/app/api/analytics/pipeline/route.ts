// app/api/analytics/pipeline/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_CALLS_PER_PAGE = 100
const SUPABASE_IN_BATCH = 200 // Supabase .in() safe limit

function isValidUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

function maskPhone(phone: string | null): string {
  if (!phone) return ''
  if (phone.length > 7) return `***${phone.slice(-4)}`
  return phone
}

/**
 * GET /api/analytics/pipeline?agent_id=&from=&to=&page=&limit=
 *
 * Returns pipeline latency analytics:
 * - Aggregate KPIs (avg latency, P95, STT/LLM/TTS/EOU averages)
 * - Daily call volumes
 * - Hourly latency trend
 * - Per-call latency breakdown for the call log table (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(
      MAX_CALLS_PER_PAGE,
      Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50)
    )

    if (!agentId || !isValidUUID(agentId)) {
      return NextResponse.json(
        { error: 'A valid agent_id (UUID) is required' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateTo = to && DATE_RE.test(to) ? to : new Date().toISOString().split('T')[0]
    const dateFrom =
      from && DATE_RE.test(from)
        ? from
        : new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

    const supabase = getSupabaseAdmin()

    // 1. Fetch all call logs for the period (for aggregate KPIs + charts)
    const { data: callLogs, error: callError } = await supabase
      .from('soundflare_call_logs')
      .select(
        'id, avg_latency, duration_seconds, call_ended_reason, call_started_at, customer_number'
      )
      .eq('agent_id', agentId)
      .gte('call_started_at', `${dateFrom} 00:00:00`)
      .lte('call_started_at', `${dateTo} 23:59:59.999`)
      .order('call_started_at', { ascending: false })

    if (callError) throw callError

    const logs = callLogs || []
    const totalCalls = logs.length

    // 2. Paginate calls for the table
    const offset = (page - 1) * limit
    const paginatedCalls = logs.slice(offset, offset + limit)
    const paginatedIds = paginatedCalls.map((c) => c.id)

    // 3. Fetch turn-level metrics only for the current page (batched .in())
    let metricsLogs: any[] = []
    if (paginatedIds.length > 0) {
      for (let i = 0; i < paginatedIds.length; i += SUPABASE_IN_BATCH) {
        const batch = paginatedIds.slice(i, i + SUPABASE_IN_BATCH)
        const { data: ml, error: mlError } = await supabase
          .from('soundflare_metrics_logs')
          .select(
            'session_id, turn_id, stt_metrics, llm_metrics, tts_metrics, eou_metrics, user_transcript, agent_response, created_at'
          )
          .in('session_id', batch)
          .order('created_at', { ascending: true })

        if (mlError) throw mlError
        if (ml) metricsLogs.push(...ml)
      }
    }

    // 4. Also fetch turn metrics for ALL calls (summary-only fields)
    //    but only the numeric columns needed for averages
    let allTurnMetrics: any[] = []
    const allCallIds = logs.map((c) => c.id)
    for (let i = 0; i < allCallIds.length; i += SUPABASE_IN_BATCH) {
      const batch = allCallIds.slice(i, i + SUPABASE_IN_BATCH)
      const { data: ml, error: mlError } = await supabase
        .from('soundflare_metrics_logs')
        .select('stt_metrics, llm_metrics, tts_metrics, eou_metrics')
        .in('session_id', batch)

      if (mlError) throw mlError
      if (ml) allTurnMetrics.push(...ml)
    }

    // --- Compute aggregates from ALL logs ---
    const successCalls = logs.filter(
      (c) =>
        c.call_ended_reason === 'customer_ended_call' ||
        c.call_ended_reason === 'agent_ended_call'
    ).length
    const totalMinutes =
      logs.reduce((s, c) => s + (c.duration_seconds || 0), 0) / 60
    const latencies = logs
      .map((c) => c.avg_latency)
      .filter((l): l is number => l != null && l > 0)
    const avgLatency =
      latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : null
    const p95Latency =
      latencies.length > 0
        ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
        : null
    const successRate =
      totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0

    // Pipeline averages from ALL turn-level data
    const sttDurations: number[] = []
    const llmTtfts: number[] = []
    const ttsTtfbs: number[] = []
    const eouDelays: number[] = []

    for (const m of allTurnMetrics) {
      const stt = m.stt_metrics?.duration
      const llm = m.llm_metrics?.ttft
      const tts = m.tts_metrics?.ttfb
      const eou = m.eou_metrics?.end_of_utterance_delay
      if (typeof stt === 'number' && isFinite(stt)) sttDurations.push(stt)
      if (typeof llm === 'number' && isFinite(llm)) llmTtfts.push(llm)
      if (typeof tts === 'number' && isFinite(tts)) ttsTtfbs.push(tts)
      if (typeof eou === 'number' && isFinite(eou)) eouDelays.push(eou)
    }

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null

    const avgStt = avg(sttDurations)
    const avgLlm = avg(llmTtfts)
    const avgTts = avg(ttsTtfbs)
    const estimatedTts =
      avgTts != null
        ? avgTts
        : avgLatency != null && avgStt != null && avgLlm != null
          ? Math.max(0, avgLatency - avgStt - avgLlm)
          : null

    // --- Daily volumes ---
    const dailyMap = new Map<string, { calls: number; minutes: number }>()
    for (const c of logs) {
      const day = c.call_started_at?.split('T')[0] || 'unknown'
      const entry = dailyMap.get(day) || { calls: 0, minutes: 0 }
      entry.calls++
      entry.minutes += (c.duration_seconds || 0) / 60
      dailyMap.set(day, entry)
    }
    const dailyVolumes = Array.from(dailyMap.entries())
      .map(([date, v]) => ({
        date,
        calls: v.calls,
        minutes: Math.round(v.minutes * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // --- Hourly latency ---
    const hourlyMap = new Map<number, { totalLat: number; count: number }>()
    for (const c of logs) {
      if (c.avg_latency == null) continue
      const hour = new Date(c.call_started_at).getHours()
      const entry = hourlyMap.get(hour) || { totalLat: 0, count: 0 }
      entry.totalLat += c.avg_latency
      entry.count++
      hourlyMap.set(hour, entry)
    }
    const hourlyLatency = Array.from(hourlyMap.entries())
      .map(([hour, v]) => ({
        hour: `${String(hour).padStart(2, '0')}:00`,
        avg_latency:
          v.count > 0
            ? Math.round((v.totalLat / v.count) * 1000) / 1000
            : 0,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour))

    // --- Per-call breakdown (paginated, phones masked) ---
    const turnsBySession = new Map<string, typeof metricsLogs>()
    for (const m of metricsLogs) {
      const sid = m.session_id
      if (!turnsBySession.has(sid)) turnsBySession.set(sid, [])
      turnsBySession.get(sid)!.push(m)
    }

    const callBreakdown = paginatedCalls.map((c) => ({
      id: c.id,
      started_at: c.call_started_at,
      duration_seconds: c.duration_seconds,
      avg_latency: c.avg_latency,
      ended_reason: c.call_ended_reason,
      customer_number: maskPhone(c.customer_number),
      turn_count: turnsBySession.get(c.id)?.length || 0,
      turns: (turnsBySession.get(c.id) || []).map((t) => ({
        turn_id: t.turn_id,
        user_transcript: t.user_transcript,
        agent_response: t.agent_response,
        stt_duration: t.stt_metrics?.duration ?? null,
        llm_ttft: t.llm_metrics?.ttft ?? null,
        tts_ttfb: t.tts_metrics?.ttfb ?? null,
        eou_delay: t.eou_metrics?.end_of_utterance_delay ?? null,
        created_at: t.created_at,
      })),
    }))

    return NextResponse.json({
      summary: {
        total_calls: totalCalls,
        total_minutes: Math.round(totalMinutes * 10) / 10,
        success_count: successCalls,
        failed_count: totalCalls - successCalls,
        avg_latency:
          avgLatency != null ? Math.round(avgLatency * 1000) / 1000 : null,
        p95_latency:
          p95Latency != null ? Math.round(p95Latency * 1000) / 1000 : null,
        success_rate: successRate,
        avg_stt_duration: avgStt != null ? Math.round(avgStt * 10000) / 10000 : null,
        avg_llm_ttft: avgLlm != null ? Math.round(avgLlm * 10000) / 10000 : null,
        avg_tts_ttfb: avgTts != null ? Math.round(avgTts * 10000) / 10000 : null,
        avg_eou_delay: avg(eouDelays) != null ? Math.round(avg(eouDelays)! * 10000) / 10000 : null,
        estimated_tts:
          estimatedTts != null
            ? Math.round(estimatedTts * 10000) / 10000
            : null,
        turn_count: allTurnMetrics.length,
      },
      daily_volumes: dailyVolumes,
      hourly_latency: hourlyLatency,
      calls: callBreakdown,
      pagination: {
        page,
        limit,
        total: totalCalls,
        total_pages: Math.ceil(totalCalls / limit),
      },
      date_range: { from: dateFrom, to: dateTo },
    })
  } catch (err: any) {
    console.error('[pipeline-analytics]', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
