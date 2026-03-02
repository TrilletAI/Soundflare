import { NextRequest, NextResponse } from 'next/server'
import { requireEnv, getErrorMessage } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      )
    }

    const baseUrl = requireEnv('NEXT_PUBLIC_API_BASE_URL_CAMPAIGN')
    if (baseUrl instanceof NextResponse) return baseUrl
    const apiUrl = `${baseUrl}/api/v1/campaigns/${campaignId}/pause`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to pause campaign' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Pause campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to pause campaign', details: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

