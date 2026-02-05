import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { CallReviewService } from '@/services/callReviewService'

/**
 * POST /api/call-reviews/batch-review
 * Manually trigger reviews for recent call logs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, limit = 50 } = body

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Missing agentId parameter' },
        { status: 400 }
      )
    }

    // Get the most recent call logs for the agent
    const { data: callLogs, error: fetchError } = await supabaseServer
      .from('soundflare_call_logs')
      .select('id, agent_id, call_id, call_started_at')
      .eq('agent_id', agentId)
      .order('call_started_at', { ascending: false })
      .limit(limit)

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch call logs: ${fetchError.message}` },
        { status: 500 }
      )
    }

    if (!callLogs || callLogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No call logs found for this agent',
        data: { queued: 0 },
      })
    }

    // Queue all calls for review (upsert will skip already reviewed calls)
    let queuedCount = 0
    for (const log of callLogs) {
      try {
        await CallReviewService.queueReview(log.id, log.agent_id)
        queuedCount++
      } catch (error) {
        console.error(`Failed to queue review for ${log.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${queuedCount} call logs for review`,
      data: {
        total: callLogs.length,
        queued: queuedCount,
        agentId,
      },
    })
  } catch (error) {
    console.error('Batch review API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/call-reviews/batch-review?agentId=xxx&limit=50
 * Alternative GET endpoint for testing
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const agentId = searchParams.get('agentId')
  const limit = parseInt(searchParams.get('limit') || '50')

  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ agentId, limit }),
    })
  )
}
