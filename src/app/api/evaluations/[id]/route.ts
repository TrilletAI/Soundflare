import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// GET /api/evaluations/[id] - Get evaluation campaign details with test cases
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const agentId = searchParams.get('agentId')

    if (!projectId || !agentId) {
      return NextResponse.json(
        { error: 'projectId and agentId are required' },
        { status: 400 }
      )
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabaseServer
      .from('soundflare_evaluation_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('project_id', projectId)
      .eq('agent_id', agentId)
      .single()

    if (campaignError || !campaign) {
      console.error('Error fetching campaign:', campaignError)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch all results for this campaign
    const { data: results, error: resultsError } = await supabaseServer
      .from('soundflare_evaluation_results')
      .select(`
        id,
        prompt_id,
        room_name,
        agent_id,
        score,
        transcript,
        reasoning,
        timestamp,
        created_at,
        webhook_payload
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })

    if (resultsError) {
      console.error('Error fetching results:', resultsError)
      return NextResponse.json(
        { error: 'Failed to fetch campaign results' },
        { status: 500 }
      )
    }

    // Fetch prompts to get defiance levels
    const promptIds = [...new Set(results.map(r => r.prompt_id))]
    const { data: prompts, error: promptsError } = await supabaseServer
      .from('soundflare_evaluation_prompts')
      .select('id, defiance_level, expected_behavior')
      .in('id', promptIds)

    const promptsMap = new Map(prompts?.map(p => [p.id, p]) || [])

    // Parse transcripts and format results
    const testCases = results.map((result, index) => {
      const prompt = promptsMap.get(result.prompt_id)
      
      // Parse transcript from string format to structured messages
      const transcriptMessages: Array<{ role: 'agent' | 'caller'; content: string }> = []
      
      if (result.transcript) {
        const lines = result.transcript.split('\n').filter((line: string) => line.trim())
        
        for (const line of lines) {
          if (line.startsWith('User: ')) {
            transcriptMessages.push({
              role: 'caller',
              content: line.substring(6).trim()
            })
          } else if (line.startsWith('Assistant: ')) {
            transcriptMessages.push({
              role: 'agent',
              content: line.substring(11).trim()
            })
          }
        }
      }

      return {
        id: result.id,
        testNumber: index + 1,
        roomName: result.room_name,
        defianceLevel: prompt?.defiance_level?.toLowerCase() || 'unknown',
        expectedBehavior: prompt?.expected_behavior || null,
        score: result.score ? Number.parseFloat(result.score) : null,
        transcript: transcriptMessages,
        reasoning: result.reasoning || null,
        timestamp: result.timestamp,
        createdAt: result.created_at
      }
    })

    // Calculate average score
    const scoresWithValues = testCases
      .map(tc => tc.score)
      .filter((s): s is number => s !== null)
    
    const avgScore = scoresWithValues.length > 0
      ? scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length
      : null

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      createdAt: campaign.created_at,
      testCount: campaign.test_count,
      status: campaign.status,
      completedCount: results.length,
      avgScore: avgScore,
      notes: campaign.notes,
      testCases: testCases
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching evaluation campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evaluation campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/evaluations/[id] - Delete an evaluation campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    // TODO: Implement actual deletion
    // 1. Verify campaign belongs to project
    // 2. Delete campaign and associated test cases
    // 3. Cancel any running evaluation jobs

    return NextResponse.json({ success: true, deletedId: id })
  } catch (error) {
    console.error('Error deleting evaluation campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete evaluation campaign' },
      { status: 500 }
    )
  }
}
