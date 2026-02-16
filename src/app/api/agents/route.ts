import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { encryptWithTrilletKey } from '@/lib/trillet-evals-crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, agent_type, configuration, project_id, environment, platform } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      )
    }

    if (!agent_type) {
      return NextResponse.json(
        { error: 'Agent type is required' },
        { status: 400 }
      )
    }

    if (!project_id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }
    
    // Verify project exists
    const { data: project, error: projectError } = await getSupabaseAdmin()
      .from('soundflare_projects')
      .select('id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      console.error('Project lookup error:', projectError)
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Check if agent with same name already exists in this project  
    const { data: existingAgent, error: checkError } = await getSupabaseAdmin()
      .from('soundflare_agents')
      .select('id, name')
      .eq('project_id', project_id)
      .eq('name', name.trim())
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error checking existing agent:', checkError)
      return NextResponse.json(
        { error: 'Failed to validate agent name' },
        { status: 500 }
      )
    }

    if (existingAgent) {
      return NextResponse.json(
        { error: `Agent with name "${name.trim()}" already exists in this project. Please choose a different name.` },
        { status: 409 }
      )
    }

    // Create agent data with proper typing
    const agentData: any = {
      name: name.trim(),
      agent_type,
      configuration: configuration || {},
      project_id,
      environment: environment || 'dev',
      is_active: true,
      auto_review_enabled: true // Enable auto AI review by default
    }

    // If it's a Trillet agent, encrypt the API key
    if (agent_type === 'trillet' && configuration?.trilletApiKey) {
      try {
        const encryptedKey = encryptWithTrilletKey(configuration.trilletApiKey);
        // Replace plain text key with encrypted key in configuration
        agentData.configuration.trilletApiKey = encryptedKey;
        console.log('🔐 Trillet API key encrypted securely');
      } catch (error) {
        console.error('❌ Error encrypting Trillet key:', error);
        return NextResponse.json(
          { error: 'Failed to encrypt API key' },
          { status: 500 }
        );
      }
    }

    console.log('💾 Inserting agent data:', {
      ...agentData,
      trilletApiKey: agentData.configuration.trilletApiKey ? '[ENCRYPTED]' : undefined,
    })

    // Insert agent into soundflare_agents
    const { data: agent, error: agentError } = await getSupabaseAdmin()
      .from('soundflare_agents')
      .insert([agentData])
      .select('*')
      .single()

    if (agentError) {
      console.error('❌ Error creating agent:', agentError)
      return NextResponse.json(
        { error: `Failed to create agent: ${agentError.message}` },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully created ${platform} agent "${agent.name}" with ID: ${agent.id}`)
    
    return NextResponse.json(agent, { status: 201 })

  } catch (error) {
    console.error('💥 Unexpected error creating agent:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const { data: agents, error } = await getSupabaseAdmin()
      .from('soundflare_agents')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching agents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      )
    }

    return NextResponse.json({ agents })

  } catch (error) {
    console.error('Unexpected error fetching agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}