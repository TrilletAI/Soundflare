import { NextRequest } from 'next/server'
import connectionStore from '@/lib/sse-store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const callLogIds = searchParams.get('callLogIds')?.split(',').filter(Boolean) || []

  if (callLogIds.length === 0) {
    return new Response('Missing callLogIds', { status: 400 })
  }

  // Create a unique key for this subscription
  const subscriptionKey = `call-reviews:${callLogIds.join(',')}`

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Register this connection
      connectionStore?.register(subscriptionKey, controller)

      console.log(`[SSE Call Reviews] New connection for ${subscriptionKey}`)

      // Send initial connection message
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', subscriptionKey })}\n\n`))

      // Keep alive ping every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`))
        } catch (error) {
          console.log('[SSE Call Reviews] Keep-alive failed, cleaning up')
          clearInterval(keepAlive)
        }
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        console.log(`[SSE Call Reviews] Connection closed for ${subscriptionKey}`)
        clearInterval(keepAlive)
        connectionStore?.unregister(subscriptionKey, controller)
        try {
          controller.close()
        } catch (error) {
          // Already closed
        }
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
