import { NextRequest, NextResponse } from 'next/server'
import { requireEnv, getErrorMessage } from '@/lib/api-utils'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      )
    }

    const baseUrl = requireEnv('NEXT_PUBLIC_API_BASE_URL_CAMPAIGN')
    if (baseUrl instanceof NextResponse) return baseUrl
    const apiUrl = `${baseUrl}/api/v1/campaigns/${campaignId}`

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to delete campaign' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Delete campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign', details: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

