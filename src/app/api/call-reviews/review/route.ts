import { NextRequest, NextResponse } from 'next/server'
import { CallReviewService } from '@/services/callReviewService'
import { supabaseServer } from '@/lib/supabase-server'
import type { CallLog } from '@/types/logs'

/**
 * POST /api/call-reviews/review
 * Trigger AI review for a specific call log or batch of call logs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { callLogId, callLogIds } = body

    // Single call log review
    if (callLogId) {
      // Fetch the call log with all necessary fields for AI review
      const { data: callLog, error } = await supabaseServer
        .from('soundflare_call_logs')
        .select('*, complete_configuration, telemetry_data, telemetry_analytics')
        .eq('id', callLogId)
        .single()

      if (error) {
        return NextResponse.json(
          { success: false, error: `Call log not found: ${error.message}` },
          { status: 404 }
        )
      }

      // Perform review
      const result = await CallReviewService.reviewCallLog(callLog as CallLog)

      return NextResponse.json({
        success: true,
        data: {
          callLogId,
          result,
        },
      })
    }

    // Batch review
    if (callLogIds && Array.isArray(callLogIds)) {
      const results = []
      const errors = []

      for (const id of callLogIds) {
        try {
          const { data: callLog, error } = await supabaseServer
            .from('soundflare_call_logs')
            .select('*, complete_configuration, telemetry_data, telemetry_analytics')
            .eq('id', id)
            .single()

          if (error) {
            errors.push({ callLogId: id, error: error.message })
            continue
          }

          const result = await CallReviewService.reviewCallLog(callLog as CallLog)
          results.push({ callLogId: id, result })
        } catch (error) {
          errors.push({
            callLogId: id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          processed: results.length,
          failed: errors.length,
          results,
          errors,
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Missing required parameters: callLogId or callLogIds' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Call review API error:', error)
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
 * GET /api/call-reviews/review?callLogId=xxx
 * Get review status for a call log
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const callLogId = searchParams.get('callLogId')

    if (!callLogId) {
      return NextResponse.json(
        { success: false, error: 'Missing callLogId parameter' },
        { status: 400 }
      )
    }

    const review = await CallReviewService.getReviewStatus(callLogId)

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: review,
    })
  } catch (error) {
    console.error('Get review status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
