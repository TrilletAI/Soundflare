// hooks/usePipelineAnalytics.ts
'use client'

import { useQuery } from '@tanstack/react-query'

export interface PipelineSummary {
  total_calls: number
  total_minutes: number
  success_count: number
  failed_count: number
  avg_latency: number | null
  p95_latency: number | null
  success_rate: number
  avg_stt_duration: number | null
  avg_llm_ttft: number | null
  avg_tts_ttfb: number | null
  avg_eou_delay: number | null
  estimated_tts: number | null
  turn_count: number
}

export interface DailyVolume {
  date: string
  calls: number
  minutes: number
}

export interface HourlyLatency {
  hour: string
  avg_latency: number
}

export interface TurnBreakdown {
  turn_id: string
  user_transcript: string | null
  agent_response: string | null
  stt_duration: number | null
  llm_ttft: number | null
  tts_ttfb: number | null
  eou_delay: number | null
  created_at: string
}

export interface CallBreakdown {
  id: string
  started_at: string
  duration_seconds: number
  avg_latency: number | null
  ended_reason: string
  customer_number: string
  turn_count: number
  turns: TurnBreakdown[]
}

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface PipelineAnalyticsData {
  summary: PipelineSummary
  daily_volumes: DailyVolume[]
  hourly_latency: HourlyLatency[]
  calls: CallBreakdown[]
  pagination: Pagination
  date_range: { from: string; to: string }
}

interface UsePipelineAnalyticsProps {
  agentId: string | undefined
  from: string
  to: string
  page?: number
  limit?: number
  enabled?: boolean
}

export const usePipelineAnalytics = ({
  agentId,
  from,
  to,
  page = 1,
  limit = 50,
  enabled = true,
}: UsePipelineAnalyticsProps) => {
  return useQuery<PipelineAnalyticsData>({
    queryKey: ['pipeline-analytics', agentId, from, to, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        agent_id: agentId!,
        from,
        to,
        page: String(page),
        limit: String(limit),
      })
      const res = await fetch(`/api/analytics/pipeline?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      return res.json()
    },
    enabled: enabled && !!agentId,
    staleTime: 60_000,
    refetchInterval: 120_000,
  })
}
