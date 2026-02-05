'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CallReviewRecord } from '@/types/callReview'

interface UseCallReviewsOptions {
  callLogIds: string[]
  enabled?: boolean
}

/**
 * Hook to fetch call review statuses for multiple call logs
 */
export const useCallReviews = ({ callLogIds, enabled = true }: UseCallReviewsOptions) => {
  return useQuery({
    queryKey: ['call-reviews', callLogIds.join(',')],

    queryFn: async () => {
      if (callLogIds.length === 0) {
        return new Map<string, CallReviewRecord>()
      }

      try {
        const { data, error } = await supabase
          .from('call_reviews')
          .select('*')
          .in('call_log_id', callLogIds)

        if (error) {
          // If table doesn't exist yet, just return empty map
          console.warn('Failed to fetch call reviews:', error.message)
          return new Map<string, CallReviewRecord>()
        }

        // Create a map for quick lookup
        const reviewMap = new Map<string, CallReviewRecord>()
        if (data) {
          data.forEach((review: any) => {
            reviewMap.set(review.call_log_id, review as CallReviewRecord)
          })
        }

        return reviewMap
      } catch (error) {
        // Silently fail if table doesn't exist
        console.warn('Call reviews table not available:', error)
        return new Map<string, CallReviewRecord>()
      }
    },

    enabled: enabled && callLogIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retry
  })
}

/**
 * Hook to fetch a single call review
 */
export const useCallReview = (callLogId: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['call-review', callLogId ?? ''],

    queryFn: async () => {
      if (!callLogId) return null

      try {
        const { data, error } = await supabase
          .from('call_reviews')
          .select('*')
          .eq('call_log_id', callLogId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // No review found
            return null
          }
          // If table doesn't exist, return null
          console.warn('Failed to fetch call review:', error.message)
          return null
        }

        return data as CallReviewRecord
      } catch (error) {
        // Silently fail if table doesn't exist
        console.warn('Call reviews table not available:', error)
        return null
      }
    },

    enabled: enabled && !!callLogId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  })
}
