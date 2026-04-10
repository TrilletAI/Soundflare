// app/api/analytics/pipeline/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * GET /api/analytics/pipeline?agent_id=&from=&to=
 *
 * Returns pipeline latency analytics:
 * - Aggregate KPIs (avg latency, P95, STT/LLM/TTS/EOU averages)
 * - Daily call volumes
 * - Hourly latency trend
 * - Per-call latency breakdown for the call log table
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')
    const from = searchParams.get('from') // YYYY-MM-DD
    const to = searchParams.get('to') // YYYY-MM-DD

    if (!agentId) {
      return NextResponse.json(
        { error: 'agent_id is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Default date range: last 7 days
    const dateTo = to || new Date().toISOString().split('T')[0]
    const dateFrom =
      from ||
      new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

    // 1. Aggregate KPIs from call_logs
    const { data: callLogs, error: callError } = await supabase
      .from('soundflare_call_logs')
      .select(
        'id, avg_latency, duration_seconds, call_ended_reason, call_started_at, customer_number'
      )
      .eq('agent_id', agentId)
      .gte('call_started_at', `${dateFrom} 00:00:00`)
      .lte('call_started_at', `${dateTo} 23:59:59.999`)
      .order('call_started_at', { ascending: true })

    if (callError) throw callError

    // 2. Per-turn metrics from metrics_logs
    const callIds = (callLogs || []).map((c) => c.id)
    let metricsLogs: any[] = []

    if (callIds.length > 0) {
      const { data: ml, error: mlError } = await supabase
        .from('soundflare_metrics_logs')
        .select(
          'session_id, turn_id, stt_metrics, llm_metrics, tts_metrics, eou_metrics, user_transcript, agent_response, created_at'
        )
        .in('session_id', callIds)
        .order('created_at', { ascending: true })

      if (mlError) throw mlError
      metricsLogs = ml || []
    }

    // --- Compute aggregates ---
    const logs = callLogs || []
    const totalCalls = logs.length
    const successCalls = logs.filter(
      (c) => c.call_ended_reason === 'customer_ended_call' || c.call_ended_reason === 'agent_ended_call'
    ).length
    const totalMinutes = logs.reduce(
      (s, c) => s + (c.duration_seconds || 0),
      0
    ) / 60
    const latencies = logs
      .map((c) => c.avg_latency)
      .filter((l): l is number => l != null && l > 0)
    const avgLatency =
      latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : null
    const p95Latency =
      latencies.length > 0
        ? latencies.sort((a, b) => a - b)[
            Math.floor(latencies.length * 0.95)
          ]
        : null
    const successRate =
      totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0

    // Pipeline averages from turn-level data
    const sttDurations: number[] = []
    const llmTtfts: number[] = []
    const ttsTtfbs: number[] = []
    const eouDelays: number[] = []

    for (const m of metricsLogs) {
      const stt = m.stt_metrics?.duration
      const llm = m.llm_metrics?.ttft
      const tts = m.tts_metrics?.ttfb
      const eou = m.eou_metrics?.end_of_utterance_delay
      if (typeof stt === 'number') sttDurations.push(stt)
      if (typeof llm === 'number') llmTtfts.push(llm)
      if (typeof tts === 'number') ttsTtfbs.push(tts)
      if (typeof eou === 'number') eouDelays.push(eou)
    }

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null

    // Estimated TTS: when direct TTS isn't available, approximate from latency
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
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // --- Hourly latency ---
    const hourlyMap = new Map<
      number,
      { totalLat: number; count: number }
    >()
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
        hour: `${hour}:00`,
        avg_latency: v.count > 0 ? v.totalLat / v.count : 0,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))

    // --- Per-call breakdown for table ---
    const turnsBySession = new Map<string, typeof metricsLogs>()
    for (const m of metricsLogs) {
      const sid = m.session_id
      if (!turnsBySession.has(sid)) turnsBySession.set(sid, [])
      turnsBySession.get(sid)!.push(m)
    }

    const callBreakdown = logs.map((c) => ({
      id: c.id,
      started_at: c.call_started_at,
      duration_seconds: c.duration_seconds,
      avg_latency: c.avg_latency,
      ended_reason: c.call_ended_reason,
      customer_number: c.customer_number,
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
        avg_latency: avgLatency != null ? Math.round(avgLatency * 1000) / 1000 : null,
        p95_latency: p95Latency != null ? Math.round(p95Latency * 1000) / 1000 : null,
        success_rate: successRate,
        avg_stt_duration: avg(sttDurations),
        avg_llm_ttft: avg(llmTtfts),
        avg_tts_ttfb: avg(ttsTtfbs),
        avg_eou_delay: avg(eouDelays),
        estimated_tts: estimatedTts,
      },
      daily_volumes: dailyVolumes,
      hourly_latency: hourlyLatency,
      calls: callBreakdown,
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
