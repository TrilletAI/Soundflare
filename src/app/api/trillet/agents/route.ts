import { NextRequest, NextResponse } from 'next/server';
import { requireEnv, getErrorMessage } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const TRILLET_API_URL = requireEnv('TRILLET_API_URL');
    if (TRILLET_API_URL instanceof NextResponse) return TRILLET_API_URL;

    const apiKey = req.headers.get('x-api-key');
    const workspaceId = req.headers.get('x-workspace-id');

    if (!apiKey || !workspaceId) {
      return NextResponse.json({ error: 'API Key and Workspace ID are required' }, { status: 400 });
    }

    const response = await fetch(`${TRILLET_API_URL}/v1/api/agents`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
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
    return NextResponse.json(
      { error: 'Failed to fetch agents from Trillet', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
