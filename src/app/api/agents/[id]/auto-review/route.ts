import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * PATCH /api/agents/[id]/auto-review
 * Toggle auto-review for an agent
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { enabled } = await request.json()

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'enabled must be a boolean' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update the agent's auto_review_enabled field
    const { data, error } = await supabase
      .from('soundflare_agents')
      .update({ auto_review_enabled: enabled })
      .eq('id', id)
      .select('id, name, auto_review_enabled')
      .single()

    if (error) {
      console.error('Failed to update auto-review setting:', {
        id,
        enabled,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      // If column not found, provide instructions to reload PostgREST schema
      if (error.code === 'PGRST204') {
        return NextResponse.json(
          { 
            success: false, 
            error: `PostgREST schema is outdated. The column exists in the database but PostgREST hasn't detected it yet.`,
            hint: 'Go to Supabase Dashboard → API → Click "Reload schema" button, or restart your PostgREST server.',
            details: error.message
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Database error: ${error.message}`,
          hint: error.hint || 'Check Supabase logs for more details'
        },
        { status: 500 }
      )
    }

    console.log(`✅ Auto-review ${enabled ? 'enabled' : 'disabled'} for agent ${data.name} (${id})`)

    return NextResponse.json({
      success: true,
      data: {
        agent_id: data.id,
        agent_name: data.name,
        auto_review_enabled: data.auto_review_enabled,
      },
    })
  } catch (error) {
    console.error('Auto-review toggle error:', error)
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
 * GET /api/agents/[id]/auto-review
 * Get auto-review status for an agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('soundflare_agents')
      .select('id, name, auto_review_enabled')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to fetch auto-review status:', {
        id,
        error: error.message,
        code: error.code,
        hint: error.hint
      })
      return NextResponse.json(
        { 
          success: false, 
          error: `Database error: ${error.message}`,
          hint: error.hint || 'Make sure the auto_review_enabled column exists in soundflare_agents table'
        },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        agent_id: data.id,
        agent_name: data.name,
        auto_review_enabled: data.auto_review_enabled ?? true, // Default to true if null
      },
    })
  } catch (error) {
    console.error('Get auto-review status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
