'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PercentileData {
  duration_p95: number | null
  cost_p95: number | null
  latency_p95: number | null
}

interface UsePercentilesOptions {
  agentId: string | undefined
  enabled?: boolean
}

export const usePercentiles = ({ agentId, enabled = true }: UsePercentilesOptions) => {
  return useQuery({
    queryKey: ['percentiles', agentId],
    queryFn: async (): Promise<PercentileData> => {
      if (!agentId) throw new Error('Agent ID required')

      // Calculate percentiles client-side from recent data
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: calls, error } = await supabase
        .from('soundflare_call_logs')
        .select('duration_seconds, total_llm_cost, total_tts_cost, total_stt_cost, avg_latency, metadata')
        .eq('agent_id', agentId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) {
        console.error('Error fetching calls for percentiles:', error)
        throw error
      }

      if (!calls || calls.length === 0) {
        return {
          duration_p95: null,
          cost_p95: null,
          latency_p95: null
        }
      }

      // Calculate 95th percentile for each metric
      const calculatePercentile = (values: number[], percentile: number): number | null => {
        // Filter out null, undefined, and NaN but keep 0 values
        const filtered = values.filter(v => v !== null && v !== undefined && !isNaN(v))
        if (filtered.length === 0) return null

        const sorted = [...filtered].sort((a, b) => a - b)
        const index = Math.ceil((percentile / 100) * sorted.length) - 1
        return sorted[Math.max(0, index)]
      }

      // Extract durations - keep 0 values as valid
      const durations: number[] = []
      for (const c of calls) {
        if (typeof c.duration_seconds === 'number') {
          durations.push(c.duration_seconds)
        }
      }

      // Extract costs - try customer_charge from metadata, then sum individual costs
      const costs: number[] = []
      for (const c of calls) {
        const metadata = c.metadata as any
        if (metadata?.customer_charge !== undefined && metadata?.customer_charge !== null) {
          costs.push(Number(metadata.customer_charge))
        } else {
          // Sum individual costs
          const llm = Number(c.total_llm_cost) || 0
          const tts = Number(c.total_tts_cost) || 0
          const stt = Number(c.total_stt_cost) || 0
          const sum = llm + tts + stt
          if (sum > 0) costs.push(sum)
        }
      }

      // Extract latencies - keep 0 values as valid
      const latencies: number[] = []
      for (const c of calls) {
        if (typeof c.avg_latency === 'number') {
          latencies.push(c.avg_latency)
        }
      }

      const result = {
        duration_p95: calculatePercentile(durations, 95),
        cost_p95: calculatePercentile(costs, 95),
        latency_p95: calculatePercentile(latencies, 95)
      }

      return result
    },
    enabled: enabled && !!agentId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000
  })
}
