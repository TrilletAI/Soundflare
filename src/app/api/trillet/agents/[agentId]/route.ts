import { NextRequest, NextResponse } from 'next/server';
import { decryptWithTrilletKey } from '@/lib/trillet-evals-crypto';

const TRILLET_API_URL = process.env.TRILLET_API_URL || 'http://localhost:3000';

export async function GET(req: NextRequest, props: { params: Promise<{ agentId: string }> }) {
  try {
    const apiKey = req.headers.get('x-api-key');
    const workspaceId = req.headers.get('x-workspace-id');
    const params = await props.params;
    const { agentId } = params;

    if (!apiKey || !workspaceId) {
      return NextResponse.json({ error: 'API Key and Workspace ID are required' }, { status: 400 });
    }

    let decryptedKey = apiKey;
    try {
      // Attempt to decrypt the key. 
      // If the key is already plain text (e.g. from Connect flow using this endpoint, unlikely but possible), 
      // the decryption might fail or return garbage. 
      // But for this route (details), we assume it comes from DB (encrypted).
      decryptedKey = decryptWithTrilletKey(apiKey);
    } catch (e) {
      console.warn('Failed to decrypt Trillet API key, attempting to use as-is:', e);
      // Fallback: use as-is if decryption fails (e.g. if we migrated from plain text)
    }

    const response = await fetch(`${TRILLET_API_URL}/v1/api/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'x-api-key': decryptedKey,
        'x-workspace-id': workspaceId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Trillet API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to Trillet:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
