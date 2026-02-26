// app/api/campaigns/list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireEnv, getErrorMessage } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const limit = searchParams.get('limit') || '50'

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    const baseUrl = requireEnv('NEXT_PUBLIC_API_BASE_URL_CAMPAIGN')
    if (baseUrl instanceof NextResponse) return baseUrl
    const apiUrl = `${baseUrl}/api/v1/projects/${projectId}/campaigns?limit=${limit}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch campaigns' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('List campaigns error:', error)
    return NextResponse.json(
      { error: 'Failed to list campaigns', details: getErrorMessage(error) },
      { status: 500 }
    )
  }
}