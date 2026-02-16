import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params

    // Fetch only what we need for the sidebar
    const { data: agent, error } = await getSupabaseAdmin()
      .from('soundflare_agents')
      .select('id, agent_type')
      .eq('id', agentId)
      .single()

    if (error || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: agent.id,
      agent_type: agent.agent_type
    })

  } catch (error) {
    console.error('Error fetching agent type:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent type' },
      { status: 500 }
    )
  }
}