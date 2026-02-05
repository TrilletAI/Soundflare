import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// GET /api/evaluations/list - List all evaluation campaigns for a project/agent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const agentId = searchParams.get('agentId')
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10)

    if (!projectId || !agentId) {
      return NextResponse.json(
        { error: 'projectId and agentId are required' },
        { status: 400 }
      )
    }

    // Fetch campaigns
    const { data: campaigns, error: campaignsError } = await supabaseServer
      .from('soundflare_evaluation_campaigns')
      .select('*')
      .eq('project_id', projectId)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      )
    }

    // For each campaign, get result count and average score
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        // Get result count
        const { count: completedCount, error: countError } = await supabaseServer
          .from('soundflare_evaluation_results')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)

        // Get average score
        const { data: results, error: scoresError } = await supabaseServer
          .from('soundflare_evaluation_results')
          .select('score')
          .eq('campaign_id', campaign.id)
          .not('score', 'is', null)

        let avgScore = null
        if (!scoresError && results && results.length > 0) {
          const scores = results.map(r => Number.parseFloat(r.score))
          avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
        }

        return {
          id: campaign.id,
          name: campaign.name,
          createdAt: campaign.created_at,
          testCount: campaign.test_count,
          status: campaign.status,
          completedCount: completedCount || 0,
          avgScore: avgScore,
          notes: campaign.notes
        }
      })
    )

    return NextResponse.json({
      campaigns: campaignsWithStats,
      total: campaignsWithStats.length
    })
  } catch (error) {
    console.error('Error fetching evaluation campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evaluation campaigns' },
      { status: 500 }
    )
  }
}
