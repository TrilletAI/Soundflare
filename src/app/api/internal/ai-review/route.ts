import { NextRequest, NextResponse } from 'next/server'
import { CallReviewService } from '@/services/callReviewService'
import { supabaseServer } from '@/lib/supabase-server'
import { verifyWebhookAuth } from '@/lib/webhook-auth'
import type { CallLog } from '@/types/logs'

/**
 * POST /api/internal/ai-review
 * Internal webhook endpoint triggered by Supabase pg_net
 * 
 * Called automatically when a new call_reviews record with status='pending' is created
 * 
 * Security: Protected by INTERNAL_WEBHOOK_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authorization
    const authError = verifyWebhookAuth(request, 'INTERNAL_WEBHOOK_SECRET')
    if (authError) return authError

    // 2. Parse request body
    const body = await request.json()
    const { call_log_id, agent_id } = body

    if (!call_log_id) {
      return NextResponse.json(
        { success: false, error: 'call_log_id is required' },
        { status: 400 }
      )
    }

    console.log(`[Webhook] Received AI review request for call log: ${call_log_id}, ${agent_id}`)

    // 3. Mark as processing (idempotent - only if still pending)
    const { data: reviewRecord } = await supabaseServer
      .from('call_reviews')
      .update({ status: 'processing' })
      .eq('call_log_id', call_log_id)
      .eq('status', 'pending') // Only update if still pending
      .select()
      .single()

    if (!reviewRecord) {
      // Already processed or invalid
      console.log(`[Webhook] Call log ${call_log_id} already processed or not found`)
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // 4. Fetch the call log with all necessary data
    const { data: callLog, error: fetchError } = await supabaseServer
      .from('soundflare_call_logs')
      .select('*')
      .eq('id', call_log_id)
      .single()

    if (fetchError || !callLog) {
      console.error(`[Webhook] Call log not found: ${call_log_id}`)
      
      // Mark as failed
      await supabaseServer
        .from('call_reviews')
        .update({
          status: 'failed',
          error_message: 'Call log not found',
        })
        .eq('call_log_id', call_log_id)

      return NextResponse.json(
        { success: false, error: 'Call log not found' },
        { status: 404 }
      )
    }

    // 5. Perform AI review
    try {
      console.log(`[Webhook] Starting AI review for call log: ${call_log_id}`)
      
      const reviewResult = await CallReviewService.reviewCallLog(callLog as CallLog)
      
      console.log(`[Webhook] AI review completed for call log: ${call_log_id}`)
      console.log(`Found ${reviewResult.errors.length} errors`)

      return NextResponse.json({
        success: true,
        data: {
          call_log_id,
          error_count: reviewResult.errors.length,
          status: 'completed',
        },
      })
    } catch (reviewError) {
      const errorMessage = reviewError instanceof Error ? reviewError.message : 'Unknown error'
      
      console.error(`[Webhook] AI review failed for call log ${call_log_id}:`, errorMessage)

      // Mark as failed (already handled by reviewCallLog, but double-check)
      await supabaseServer
        .from('call_reviews')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('call_log_id', call_log_id)

      return NextResponse.json(
        {
          success: false,
          error: 'AI review failed',
          details: errorMessage,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Webhook] Internal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}