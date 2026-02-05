'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Hook to subscribe to real-time updates for call reviews via SSE
 * Invalidates TanStack Query cache when reviews are inserted or updated
 */
export function useCallReviewsRealtime(callLogIds: string[]) {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const callLogIdsStr = callLogIds.join(',')

  useEffect(() => {
    if (callLogIds.length === 0) return

    console.log('[Call Reviews SSE] Connecting for', callLogIds.length, 'call logs')

    // Create SSE connection
    const url = `/api/call-reviews/sse?callLogIds=${callLogIdsStr}`
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('[Call Reviews SSE] Connection opened')
    }

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        if (message.type === 'connected') {
          console.log('[Call Reviews SSE] Connected:', message.subscriptionKey)
          return
        }

        if (message.type === 'update') {
          console.log('[Call Reviews SSE] Received update:', message.data)
          
          const callLogId = message.data?.callLogId
          const status = message.data?.status
          
          if (callLogId) {
            // Update the cache directly instead of invalidating
            const queryKey = ['call-reviews', callLogIdsStr]
            
            queryClient.setQueryData(queryKey, (oldData: Map<string, any> | undefined) => {
              if (!oldData) return oldData
              
              // Clone the Map to trigger React re-render
              const newData = new Map(oldData)
              
              // Get existing review or create new entry
              const existingReview = newData.get(callLogId) || { call_log_id: callLogId }
              
              // Update with broadcast data
              const updatedReview = {
                ...existingReview,
                status,
                ...(message.data.errorCount !== undefined && { 
                  error_count: message.data.errorCount,
                  has_api_failures: message.data.hasApiFailures,
                  has_wrong_actions: message.data.hasWrongActions,
                  has_wrong_outputs: message.data.hasWrongOutputs,
                }),
                ...(message.data.errorMessage && { error_message: message.data.errorMessage }),
              }
              
              newData.set(callLogId, updatedReview)
              
              console.log('[Call Reviews SSE] Updated cache for:', callLogId, 'status:', status)
              return newData
            })
            
            // Also update individual call-review query if it exists
            queryClient.setQueryData(['call-review', callLogId], (oldData: any) => {
              if (!oldData) return oldData
              
              return {
                ...oldData,
                status,
                ...(message.data.errorCount !== undefined && { 
                  error_count: message.data.errorCount,
                  has_api_failures: message.data.hasApiFailures,
                  has_wrong_actions: message.data.hasWrongActions,
                  has_wrong_outputs: message.data.hasWrongOutputs,
                }),
                ...(message.data.errorMessage && { error_message: message.data.errorMessage }),
              }
            })
          }
        }
      } catch (error) {
        console.error('[Call Reviews SSE] Error parsing message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[Call Reviews SSE] Connection error:', error)
      eventSource.close()
    }

    // Cleanup on unmount
    return () => {
      console.log('[Call Reviews SSE] Cleaning up connection')
      eventSource.close()
      eventSourceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callLogIdsStr, queryClient])
}
