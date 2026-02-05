import { NextRequest, NextResponse } from 'next/server'
import { CallReviewService } from '@/services/callReviewService'

/**
 * POST /api/call-reviews/webhook
 * Webhook to automatically queue call reviews when new call logs are created
 * This should be triggered by a Supabase trigger or external service when a new call log is inserted
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, record } = body

    // Handle Supabase webhook format
    if (type === 'INSERT' && record) {
      const { id: callLogId, agent_id: agentId } = record

      if (!callLogId || !agentId) {
        return NextResponse.json(
          { success: false, error: 'Missing callLogId or agentId in webhook payload' },
          { status: 400 }
        )
      }

      // Queue the review (will be processed asynchronously)
      await CallReviewService.queueReview(callLogId, agentId)

      return NextResponse.json({
        success: true,
        message: 'Review queued successfully',
        data: { callLogId, agentId },
      })
    }

    // Handle direct call format
    const { callLogId, agentId } = body
    if (callLogId && agentId) {
      await CallReviewService.queueReview(callLogId, agentId)

      return NextResponse.json({
        success: true,
        message: 'Review queued successfully',
        data: { callLogId, agentId },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid webhook payload format' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Call review webhook error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
