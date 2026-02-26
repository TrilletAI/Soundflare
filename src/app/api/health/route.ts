import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    }, { status: 200 })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { status: 'error', error: 'Health check failed' },
      { status: 500 }
    )
  }
}
