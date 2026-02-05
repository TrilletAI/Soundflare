import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface OverviewData {
  totalCalls: number
  totalMinutes: number
  totalBillingSeconds: number
  successfulCalls: number
  successRate: number
  averageLatency: number
  totalCost:number
  uniqueCustomers: number
  dailyData: Array<{
    date: string
    dateKey: string
    calls: number
    minutes: number
  }>
}

interface UseOverviewQueryProps {
  agentId: string
  dateFrom: string // 'YYYY-MM-DD'
  dateTo: string   // 'YYYY-MM-DD'
}

export const useOverviewQuery = ({ agentId, dateFrom, dateTo }: UseOverviewQueryProps) => {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true)
        setError(null)
    
        // 🔄 Call the PostgreSQL function to refresh the materialized view
        console.log('Refreshing call summary...')
        const { error: refreshError } = await supabase.rpc('refresh_call_summary')
        if (refreshError) {
          console.error('Error refreshing call summary:', refreshError)
          // Don't throw here, let the query proceed with potentially stale data
          // throw refreshError 
        }

    
        // ✅ Then query the refreshed materialized view
        const { data: dailyStats, error: queryError } = await supabase
          .from('call_summary_materialized')
          .select(`
            call_date,
            calls,
            total_minutes,
            avg_latency,
            unique_customers,
            successful_calls,
            success_rate,
            total_cost,
            total_billing_minutes,
            total_billing_seconds
          `)
          .eq('agent_id', agentId)
          .gte('call_date', dateFrom)
          .lte('call_date', dateTo)
          .order('call_date', { ascending: true })
            

        if (queryError) throw queryError

        // Fetch aggregates directly from call logs to ensure accuracy and freshness
        const { data: rawLogs, error: rawLogsError } = await supabase
          .from('soundflare_call_logs')
          .select('total_llm_cost, total_tts_cost, total_stt_cost, duration_seconds, billing_duration_seconds, call_ended_reason, avg_latency, customer_number, metadata')
          .eq('agent_id', agentId)
          .gte('call_started_at', `${dateFrom} 00:00:00`)
          .lte('call_started_at', `${dateTo} 23:59:59.999`)

        if (rawLogsError) {
          console.error('Error fetching raw logs for overview:', rawLogsError)
        }

        // Calculate totals from raw logs
        const realTotalCost = rawLogs?.reduce((sum, item) => {
          // Use customer_charge from metadata if available, otherwise sum the costs
          let metadata = item.metadata as any
          
          // Safe parsing if metadata is returned as string
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata)
            } catch (e) {
              metadata = {}
            }
          }

          if (metadata && typeof metadata === 'object' && metadata.customer_charge !== undefined && metadata.customer_charge !== null) {
            const charge = Number(metadata.customer_charge)
            return sum + (isNaN(charge) ? 0 : charge)
          }
          
          const callCost = (Number(item.total_llm_cost) || 0) + (Number(item.total_tts_cost) || 0) + (Number(item.total_stt_cost) || 0)
          return sum + callCost
        }, 0) || 0
        
        const realTotalCalls = rawLogs?.length || 0
        const realTotalMinutes = Math.ceil((rawLogs?.reduce((sum, item) => sum + (Number(item.duration_seconds) || 0), 0) || 0) / 60)
        const realTotalBillingSeconds = rawLogs?.reduce((sum, item) => sum + (Number(item.billing_duration_seconds) || 0), 0) || 0
        const realSuccessfulCalls = rawLogs?.filter(item => item.call_ended_reason === 'completed' || item.call_ended_reason === 'customer-ended-call').length || 0
        
        // Calculate average latency
        const callsWithLatency = rawLogs?.filter(item => item.avg_latency != null) || []
        const realAverageLatency = callsWithLatency.length > 0
          ? callsWithLatency.reduce((sum, item) => sum + (Number(item.avg_latency) || 0), 0) / callsWithLatency.length
          : 0

        // Calculate unique customers
        const uniqueCustomersSet = new Set(rawLogs?.map(item => item.customer_number).filter(Boolean))
        const realUniqueCustomers = uniqueCustomersSet.size

        console.log('Daily Stats (Materialized):', dailyStats)
        console.log('Raw Logs Stats:', { realTotalCost, realTotalCalls, realTotalMinutes, realTotalBillingSeconds })

    
        const typedData: OverviewData = {
          totalCalls: realTotalCalls,
          totalCost: realTotalCost,
          totalMinutes: realTotalMinutes,
          totalBillingSeconds: realTotalBillingSeconds,
          successfulCalls: realSuccessfulCalls,
          successRate: realTotalCalls > 0 ? (realSuccessfulCalls / realTotalCalls) * 100 : 0,
          averageLatency: realAverageLatency,
          uniqueCustomers: realUniqueCustomers,
          dailyData: dailyStats?.map(day => ({
            date: day.call_date,
            dateKey: day.call_date,
            calls: day.calls,
            minutes: day.total_minutes,
            avg_latency: day.avg_latency
          })) || []
          
        }
    
        setData(typedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    

    if (agentId && dateFrom && dateTo) {
      fetchOverviewData()
    }
  }, [agentId, dateFrom, dateTo])

  return { data, loading, error }
}