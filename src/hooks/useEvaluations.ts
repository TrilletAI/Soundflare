import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface EvaluationCampaign {
  id: string
  name: string
  createdAt: string
  testCount: number
  status: 'running' | 'completed' | 'failed' | 'pending'
  completedCount: number
  avgScore: number | null
  notes?: string
}

interface CampaignDetails extends EvaluationCampaign {
  testCases: Array<{
    id: string
    testNumber: number
    roomName: string
    defianceLevel: string
    expectedBehavior: string | null
    score: number | null
    transcript: Array<{ role: 'agent' | 'caller'; content: string }>
    reasoning: string | null
    timestamp: number | null
    createdAt: string
  }>
}

// Hook to fetch campaigns list
export function useEvaluationCampaigns(projectId: string, agentId: string) {
  return useQuery({
    queryKey: ['evaluations', 'list', projectId, agentId],
    queryFn: async () => {
      const response = await fetch(`/api/evaluations/list?projectId=${projectId}&agentId=${agentId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns')
      }
      
      const data = await response.json()
      return data.campaigns as EvaluationCampaign[]
    },
    enabled: !!projectId && !!agentId,
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: false,
  })
}

// Hook to fetch single campaign details
export function useEvaluationCampaign(projectId: string, agentId: string, campaignId: string) {
  return useQuery({
    queryKey: ['evaluations', 'campaign', campaignId, projectId, agentId],
    queryFn: async () => {
      const response = await fetch(`/api/evaluations/${campaignId}?projectId=${projectId}&agentId=${agentId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaign')
      }
      
      const data = await response.json()
      return data as CampaignDetails
    },
    enabled: !!projectId && !!agentId && !!campaignId,
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: false,
  })
}

// Hook to create a new campaign
export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      projectId: string
      agentId: string
      name: string
      testCount: number
      notes?: string
    }) => {
      const response = await fetch('/api/evaluations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create evaluation campaign')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate campaigns list to refetch
      queryClient.invalidateQueries({ 
        queryKey: ['evaluations', 'list', variables.projectId, variables.agentId] 
      })
    },
  })
}

// Hook to delete a campaign
export function useDeleteCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      projectId: string
      agentId: string
      campaignId: string
    }) => {
      const response = await fetch(`/api/evaluations/${data.campaignId}?projectId=${data.projectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete campaign')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate campaigns list
      queryClient.invalidateQueries({ 
        queryKey: ['evaluations', 'list', variables.projectId, variables.agentId] 
      })
    },
  })
}
