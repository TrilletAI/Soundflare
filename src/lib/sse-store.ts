// In-memory store for SSE connections
type Controller = ReadableStreamDefaultController<Uint8Array>

interface ConnectionStore {
  connections: Map<string, Set<Controller>>
  broadcast: (projectId: string, agentId: string, data: any) => void
  broadcastCallReview: (callLogId: string, data: any) => void
  register: (key: string, controller: Controller) => void
  unregister: (key: string, controller: Controller) => void
}

// Use globalThis to ensure singleton across module reloads in dev mode
declare global {
  var sseConnectionStore: ConnectionStore | undefined
}

// Singleton store
const connectionStore: ConnectionStore = globalThis.sseConnectionStore ?? {
  connections: new Map(),
  
  register(key: string, controller: Controller) {
    if (!this.connections.has(key)) {
      this.connections.set(key, new Set())
    }
    this.connections.get(key)!.add(controller)
    console.log(`[SSE Store] Registered connection for ${key}. Total: ${this.connections.get(key)!.size}`)
    console.log(`[SSE Store] All connections:`, Array.from(this.connections.keys()))
  },
  
  unregister(key: string, controller: Controller) {
    const controllers = this.connections.get(key)
    if (controllers) {
      controllers.delete(controller)
      if (controllers.size === 0) {
        this.connections.delete(key)
      }
      console.log(`[SSE Store] Unregistered connection for ${key}`)
    }
  },
  
  broadcast(projectId: string, agentId: string, data: any) {
    const encoder = new TextEncoder()
    const message = `data: ${JSON.stringify({ type: 'update', data })}\n\n`
    let sentCount = 0
    
    console.log(`[SSE Store] Broadcasting for ${projectId}:${agentId}`)
    console.log(`[SSE Store] Active connections:`, Array.from(this.connections.keys()))
    
    // Broadcast to all matching connections (matching projectId:agentId, regardless of campaignIds)
    this.connections.forEach((controllers, key) => {
      const keyPrefix = `${projectId}:${agentId}:`
      if (key.startsWith(keyPrefix)) {
        console.log(`[SSE Store] Matched connection: ${key}`)
        controllers.forEach(controller => {
          try {
            controller.enqueue(encoder.encode(message))
            sentCount++
          } catch (error) {
            console.error('[SSE Store] Failed to send message:', error)
            controllers.delete(controller)
          }
        })
      } else {
        console.log(`[SSE Store] Key ${key} does not start with ${keyPrefix}`)
      }
    })
    
    console.log(`[SSE Store] Broadcast to ${sentCount} connections for ${projectId}:${agentId}`)
  },
  
  broadcastCallReview(callLogId: string, data: any) {
    const encoder = new TextEncoder()
    const message = `data: ${JSON.stringify({ type: 'update', data })}\n\n`
    let sentCount = 0
    
    console.log(`[SSE Store] Broadcasting call review update for ${callLogId}`)
    console.log(`[SSE Store] Active connections:`, Array.from(this.connections.keys()))
    
    // Broadcast to all matching connections (matching call-reviews: prefix and containing this callLogId)
    this.connections.forEach((controllers, key) => {
      if (key.startsWith('call-reviews:')) {
        // Extract call log IDs from the key
        const callLogIds = key.replace('call-reviews:', '').split(',')
        if (callLogIds.includes(callLogId)) {
          console.log(`[SSE Store] Matched call review connection: ${key}`)
          controllers.forEach(controller => {
            try {
              controller.enqueue(encoder.encode(message))
              sentCount++
            } catch (error) {
              console.error('[SSE Store] Failed to send message:', error)
              controllers.delete(controller)
            }
          })
        }
      }
    })
    
    console.log(`[SSE Store] Broadcast to ${sentCount} connections for call review ${callLogId}`)
  }
}

// Store in globalThis for dev mode HMR
if (!globalThis.sseConnectionStore) {
  globalThis.sseConnectionStore = connectionStore
}

export default globalThis.sseConnectionStore
