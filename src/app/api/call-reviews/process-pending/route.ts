import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

/**
 * GET /api/call-reviews/process-pending
 * Health check endpoint - shows pending review stats
 * 
 * Note: Reviews are now processed automatically via Supabase triggers
 * No manual processing or cron jobs needed!
 */
export async function GET(request: NextRequest) {
  try {
    // Get stats from call_reviews table
    const { data: stats, error } = await supabaseServer
      .from('call_reviews')
      .select('status')
      .then(({ data, error }) => {
        if (error) throw error
        
        const statusCounts = data?.reduce((acc: any, review: any) => {
          acc[review.status] = (acc[review.status] || 0) + 1
          return acc
        }, {})

        return { data: statusCounts, error: null }
      })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString(),
        message: 'Reviews are processed automatically via Supabase triggers',
      },
    })
  } catch (error) {
    console.error('Stats error:', error)
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
 * POST endpoint deprecated
 * Reviews are now processed automatically via Supabase database triggers
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint is deprecated. Reviews are now processed automatically via Supabase triggers.',
      message: 'See SUPABASE_TRIGGER_SETUP.md for configuration details',
    },
    { status: 410 } // 410 Gone
  )
}
