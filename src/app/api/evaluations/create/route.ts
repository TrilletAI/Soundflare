import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { decryptWithTrilletKey } from '@/lib/trillet-evals-crypto'

// POST /api/evaluations/create - Create a new evaluation campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, agentId, name, testCount, notes } = body

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    if (!testCount || ![10, 25, 50].includes(testCount)) {
      return NextResponse.json(
        { error: 'testCount must be 10, 25, or 50' },
        { status: 400 }
      )
    }

    // Fetch agent configuration to get trilletApiKey and trilletAgentId
    const { data: agentData, error: agentError } = await supabaseServer
      .from('soundflare_agents')
      .select('configuration')
      .eq('id', agentId)
      .single()

    if (agentError || !agentData) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const config = agentData.configuration as any
    const encryptedTrilletApiKey = config?.trilletApiKey
    const trilletAgentId = config?.trilletAgentId

    if (!encryptedTrilletApiKey || !trilletAgentId) {
      return NextResponse.json(
        { error: 'Agent configuration is missing trilletApiKey or trilletAgentId' },
        { status: 400 }
      )
    }

    // Decrypt the API key before using it
    let trilletApiKey: string
    try {
      trilletApiKey = decryptWithTrilletKey(encryptedTrilletApiKey)
      console.log('Trillet API key decrypted successfully')
    } catch (error) {
      console.error('Failed to decrypt Trillet API key:', error)
      return NextResponse.json(
        { error: 'Failed to decrypt Trillet API key' },
        { status: 500 }
      )
    }

    // Fetch evaluation prompts for this project (ordered by sequence)
    const { data: prompts, error: promptsError } = await supabaseServer
      .from('soundflare_evaluation_prompts')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence_order', { ascending: true })
      .limit(testCount)

    if (promptsError) {
      console.error('Error fetching prompts:', promptsError)
      return NextResponse.json(
        { error: 'Failed to fetch evaluation prompts' },
        { status: 500 }
      )
    }

    if (!prompts || prompts.length < testCount) {
      return NextResponse.json(
        { error: `Not enough prompts available. Need ${testCount}, found ${prompts?.length || 0}` },
        { status: 400 }
      )
    }

    // Create campaign record in database
    const { data: campaign, error: campaignError } = await supabaseServer
      .from('soundflare_evaluation_campaigns')
      .insert({
        project_id: projectId,
        agent_id: agentId,
        name: name.trim(),
        test_count: testCount,
        notes: notes?.trim() || null,
        status: 'pending',
      })
      .select()
      .single()

    if (campaignError) {
      console.error('Error creating campaign:', campaignError)
      return NextResponse.json(
        { error: 'Failed to create evaluation campaign in database' },
        { status: 500 }
      )
    }

    console.log('ampaign created:', campaign.id)

    // Update campaign status to running before starting API calls
    await supabaseServer
      .from('soundflare_evaluation_campaigns')
      .update({ status: 'running' })
      .eq('id', campaign.id)

    // Trigger sequential API calls in the background (don't await)
    triggerSequentialEvaluations(
      campaign.id,
      prompts,
      trilletApiKey,
      trilletAgentId
    ).catch(error => {
      console.error('Error in sequential evaluations:', error)
      // Update campaign to failed
      supabaseServer
        .from('soundflare_evaluation_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaign.id)
    })

    // Return immediately
    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      status: 'running',
      testCount: campaign.test_count,
      createdAt: campaign.created_at,
      message: `Evaluation campaign started with ${prompts.length} test cases`,
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating evaluation campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create evaluation campaign' },
      { status: 500 }
    )
  }
}

// Background function to trigger sequential API calls
async function triggerSequentialEvaluations(
  campaignId: string,
  prompts: any[],
  trilletApiKey: string,
  trilletAgentId: string
) {
  const middlewareUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.trillet.ai'
  const evaluationUrl = `${middlewareUrl}/v1/api/web-call/evaluation`

  console.log(`Starting ${prompts.length} sequential evaluations for campaign ${campaignId}`)

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i]
    
    try {
      console.log(`Calling API ${i + 1}/${prompts.length} - Prompt: ${prompt.id}`)

      const response = await fetch(evaluationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': trilletApiKey,
        },
        body: JSON.stringify({
          call_agent_id: trilletAgentId,
          evaluationPrompt: prompt.prompt,
          evaluation_context: {
            campaign_id: campaignId,
            prompt_id: prompt.id,
            defiance_level: prompt.defiance_level,
            expected_behavior: prompt.expected_behavior || '',
          },
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error(`API call ${i + 1} failed:`, responseData)
        continue // Continue with next prompt even if one fails
      }

      console.log(`API call ${i + 1} succeeded:`, {
        call_id: responseData.call_id,
        room_name: responseData.room_name
      })

      // 5 second delay between calls to avoid overwhelming the system
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000))
      }

    } catch (error) {
      console.error(`Error in API call ${i + 1}:`, error)
      // Continue with next prompt
    }
  }

  console.log(`Completed all ${prompts.length} API calls for campaign ${campaignId}`)
  
  // Note: Campaign status will be updated to 'completed' by webhook when all results are received
}
