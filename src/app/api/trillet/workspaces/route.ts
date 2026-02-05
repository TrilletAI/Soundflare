import { NextRequest, NextResponse } from 'next/server';

const TRILLET_API_URL = process.env.TRILLET_API_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 });
    }

    const response = await fetch(`${TRILLET_API_URL}/v1/api/workspaces`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
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
