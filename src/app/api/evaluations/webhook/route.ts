import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { verifyWebhookAuth } from '@/lib/webhook-auth'
import connectionStore from '@/lib/sse-store'

// POST /api/evaluations/webhook - Receive evaluation results from LiveKit/middleware
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authError = verifyWebhookAuth(request, 'EVALUATION_WEBHOOK_SECRET')
    if (authError) return authError

    const body = await request.json()
    
    console.log('Evaluation webhook received:', {
      room_name: body.room_name,
      score: body.score,
      keys: Object.keys(body)
    })

    // Extract data from webhook payload
    const {
      room_name,
      score,
      transcript,
      reasoning,
      evaluation_context,
      agentId,
      timestamp,
    } = body

    // Validate required fields
    if (!room_name) {
      return NextResponse.json(
        { error: 'room_name is required' },
        { status: 400 }
      )
    }

    // Extract campaign_id and prompt_id from evaluation_context
    const extractedCampaignId = evaluation_context?.campaign_id
    const extractedPromptId = evaluation_context?.prompt_id

    if (!extractedCampaignId || !extractedPromptId) {
      console.error('Missing campaign_id or prompt_id in webhook:', body)
      return NextResponse.json(
        { error: 'campaign_id and prompt_id are required in evaluation_context' },
        { status: 400 }
      )
    }

    // Verify campaign exists
    const { data: campaign, error: campaignError } = await supabaseServer
      .from('soundflare_evaluation_campaigns')
      .select('id, test_count, status')
      .eq('id', extractedCampaignId)
      .single()

    if (campaignError || !campaign) {
      console.error('Campaign not found:', extractedCampaignId)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Verify prompt exists
    const { data: prompt, error: promptError } = await supabaseServer
      .from('soundflare_evaluation_prompts')
      .select('id')
      .eq('id', extractedPromptId)
      .single()

    if (promptError || !prompt) {
      console.error('Prompt not found:', extractedPromptId)
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Store result in database
    const { data: result, error: resultError } = await supabaseServer
      .from('soundflare_evaluation_results')
      .insert({
        campaign_id: extractedCampaignId,
        prompt_id: extractedPromptId,
        room_name,
        agent_id: agentId || null,
        score: score || null,
        transcript: transcript || null,
        reasoning: reasoning || null,
        timestamp: timestamp || null,
        webhook_payload: body, // Store full payload for debugging
      })
      .select()
      .single()

    if (resultError) {
      console.error('Error storing result:', resultError)
      return NextResponse.json(
        { error: 'Failed to store evaluation result' },
        { status: 500 }
      )
    }

    console.log('Result stored:', result.id)

    // Get campaign details for SSE broadcast
    const { data: campaignDetails } = await supabaseServer
      .from('soundflare_evaluation_campaigns')
      .select('project_id, agent_id')
      .eq('id', extractedCampaignId)
      .single()

    // Broadcast SSE update to connected clients
    if (campaignDetails) {
      connectionStore?.broadcast(campaignDetails.project_id, campaignDetails.agent_id, {
        campaignId: extractedCampaignId,
        resultId: result.id,
        score: score,
        timestamp: Date.now()
      })
    }

    // Check if all results are received for this campaign
    const { count: completedCount, error: countError } = await supabaseServer
      .from('soundflare_evaluation_results')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', extractedCampaignId)

    if (!countError && completedCount !== null) {
      console.log(`Campaign ${extractedCampaignId}: ${completedCount}/${campaign.test_count} results received`)

      // If all results received, mark campaign as completed
      if (completedCount >= campaign.test_count) {
        await supabaseServer
          .from('soundflare_evaluation_campaigns')
          .update({ status: 'completed' })
          .eq('id', extractedCampaignId)

        console.log(`Campaign ${extractedCampaignId} completed!`)
        
        // Broadcast completion update
        if (campaignDetails) {
          connectionStore?.broadcast(campaignDetails.project_id, campaignDetails.agent_id, {
            campaignId: extractedCampaignId,
            status: 'completed',
            timestamp: Date.now()
          })
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      result_id: result.id,
      message: 'Evaluation result stored successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Error processing evaluation webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process evaluation webhook' },
      { status: 500 }
    )
  }
}
