import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { generateApiToken, hashToken, createProjectApiKey } from '@/lib/api-key-management'

const TRILLET_API_URL = process.env.TRILLET_API_URL || 'https://api.trillet.ai'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { agentId, projectId, trilletApiKey, trilletWorkspaceId, pathwayId } = body

    if (!agentId || !projectId || !trilletApiKey || !trilletWorkspaceId || !pathwayId) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, projectId, trilletApiKey, trilletWorkspaceId, pathwayId' },
        { status: 400 }
      )
    }

    // Look up the project's decryptable API key (same pattern as create-agent/route.ts)
    let soundflareApiKey: string | null = null

    const { data: apiKey, error: keyError } = await getSupabaseAdmin()
      .from('soundflare_api_keys')
      .select('id, token_hash, token_hash_master')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!keyError && apiKey?.token_hash_master) {
      try {
        const { decryptWithTrilletKey } = await import('@/lib/trillet-evals-crypto')
        soundflareApiKey = decryptWithTrilletKey(apiKey.token_hash_master)
        console.log('✅ Decrypted soundflare API key for middleware registration')
      } catch (decryptError) {
        console.error('Failed to decrypt API key:', decryptError)
      }
    }

    // No decryptable key exists — generate a new one
    // (handles projects created before the api-key-management fix)
    if (!soundflareApiKey) {
      console.log('No decryptable API key found, generating a new one for project:', projectId)
      const newToken = generateApiToken()
      const result = await createProjectApiKey(projectId, userId, newToken)

      if (result.success) {
        soundflareApiKey = newToken
        // Also update the project's token_hash to match
        await getSupabaseAdmin()
          .from('soundflare_projects')
          .update({ token_hash: hashToken(newToken) })
          .eq('id', projectId)
        console.log('✅ Generated and stored new API key for project')
      } else {
        console.error('Failed to generate API key:', result.error)
        return NextResponse.json(
          { error: 'Failed to generate project API key. Please try again.' },
          { status: 500 }
        )
      }
    }

    // Call the Trillet API register-soundflare
    const registerUrl = `${TRILLET_API_URL}/v1/api/call-flows/register-soundflare/${pathwayId}`

    console.log(`Registering agent ${agentId} with Trillet at ${registerUrl}`)

    const response = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': trilletApiKey,
        'x-workspace-id': trilletWorkspaceId,
      },
      body: JSON.stringify({
        soundflareAgentId: agentId,
        soundflareApiKey: soundflareApiKey,
        callbackUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Trillet API error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: `Trillet API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json().catch(() => ({}))
    console.log('✅ Monitoring agent registered with Trillet successfully')

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error proxying to Trillet:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
