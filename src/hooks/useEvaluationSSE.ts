import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useEvaluationSSE(projectId: string, agentId: string, campaignIds: string[]) {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const campaignIdsStr = campaignIds.join(',')

  useEffect(() => {
    if (campaignIds.length === 0 || !projectId || !agentId) return

    console.log('[SSE] Connecting for campaigns:', campaignIds)

    // Create SSE connection
    const url = `/api/evaluations/sse?projectId=${projectId}&agentId=${agentId}&campaignIds=${campaignIdsStr}`
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('[SSE] Connection opened')
    }

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        if (message.type === 'connected') {
          console.log('[SSE] Connected:', message.subscriptionKey)
          return
        }

        if (message.type === 'update') {
          console.log('[SSE] Received update:', message.data)
          
          // Invalidate and refetch queries
          queryClient.invalidateQueries({ 
            queryKey: ['evaluations', 'list', projectId, agentId],
            refetchType: 'none'
          })
          
          // If update has campaignId, also invalidate that specific campaign
          if (message.data?.campaignId) {
            queryClient.invalidateQueries({ 
              queryKey: ['evaluations', 'campaign', message.data.campaignId, projectId, agentId],
              refetchType: 'none'
            })
          }
          
          // Refetch after a short delay to batch multiple updates
          setTimeout(() => {
            queryClient.refetchQueries({ 
              queryKey: ['evaluations', 'list', projectId, agentId],
              type: 'active'
            })
            
            if (message.data?.campaignId) {
              queryClient.refetchQueries({ 
                queryKey: ['evaluations', 'campaign', message.data.campaignId, projectId, agentId],
                type: 'active'
              })
            }
          }, 100)
        }
      } catch (error) {
        console.error('[SSE] Error parsing message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error)
      eventSource.close()
    }

    // Cleanup on unmount
    return () => {
      console.log('[SSE] Cleaning up connection')
      eventSource.close()
      eventSourceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignIdsStr, projectId, agentId, queryClient])
}

// Hook for single campaign details page
export function useCampaignSSE(projectId: string, agentId: string, campaignId: string | null) {
  useEvaluationSSE(projectId, agentId, campaignId ? [campaignId] : [])
}

// Hook for campaigns list page
export function useCampaignsSSE(projectId: string, agentId: string, campaignIds: string[]) {
  useEvaluationSSE(projectId, agentId, campaignIds)
}
