// src/app/api/projects/[id]/api-keys/[keyId]/decrypt/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { decryptWithTrilletKey } from '@/lib/trillet-evals-crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, keyId } = await params

    // Get the encrypted key
    const { data: apiKey, error } = await getSupabaseAdmin()
      .from('soundflare_api_keys')
      .select('token_hash_master, project_id')
      .eq('id', keyId)
      .eq('project_id', projectId)
      .single()

    if (error || !apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Decrypt and return
    const decryptedKey = decryptWithTrilletKey(apiKey.token_hash_master)
    
    return NextResponse.json({ full_key: decryptedKey })
  } catch (error) {
    console.error('Error decrypting API key:', error)
    return NextResponse.json({ error: 'Failed to decrypt key' }, { status: 500 })
  }
}