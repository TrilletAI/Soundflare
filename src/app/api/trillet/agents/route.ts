import { NextRequest, NextResponse } from 'next/server';

const TRILLET_API_URL = process.env.TRILLET_API_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  try {
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
