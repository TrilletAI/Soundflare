import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { FieldInfo } from '@/components/calls/FieldExplorer'
import type { CallLog } from '@/types/logs'

interface UseFieldDiscoveryOptions {
  agentId?: string
  sampleSize?: number
  enabled?: boolean
}

interface UseFieldDiscoveryReturn {
  fields: FieldInfo[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const BASIC_FIELDS: FieldInfo[] = [
  // Only ACTUAL database columns, not JSONB nested fields
  { name: 'Call ID', type: 'string', path: 'call_id', category: 'basic' },
  { name: 'Customer Number', type: 'string', path: 'customer_number', category: 'basic' },
  { name: 'Agent ID', type: 'string', path: 'agent_id', category: 'basic' },
  { name: 'Status', type: 'string', path: 'call_ended_reason', category: 'basic' },
  { name: 'Duration (seconds)', type: 'number', path: 'duration_seconds', category: 'basic' },
  { name: 'Billing Duration', type: 'number', path: 'billing_duration_seconds', category: 'basic' },
  { name: 'Total Cost', type: 'number', path: 'total_cost', category: 'basic' },
  { name: 'Start Time', type: 'date', path: 'call_started_at', category: 'basic' },
  { name: 'End Time', type: 'date', path: 'call_ended_at', category: 'basic' },
  { name: 'Created At', type: 'date', path: 'created_at', category: 'basic' },
  { name: 'Avg Latency (ms)', type: 'number', path: 'avg_latency', category: 'basic' },
  { name: 'LLM Cost', type: 'number', path: 'total_llm_cost', category: 'basic' },
  { name: 'TTS Cost', type: 'number', path: 'total_tts_cost', category: 'basic' },
  { name: 'STT Cost', type: 'number', path: 'total_stt_cost', category: 'basic' },
  { name: 'Recording URL', type: 'string', path: 'recording_url', category: 'basic' },
  { name: 'Environment', type: 'string', path: 'environment', category: 'basic' },
  { name: 'Transcript Type', type: 'string', path: 'transcript_type', category: 'basic' },
  // Note: phone_number, room_name, call_type are in metadata JSONB and will be discovered dynamically
]

/**
 * Hook to discover all available fields from call logs
 * Analyzes JSONB columns to extract field names, types, and sample values
 */
export const useFieldDiscovery = ({
  agentId,
  sampleSize = 500,
  enabled = true
}: UseFieldDiscoveryOptions = {}): UseFieldDiscoveryReturn => {
  const [fields, setFields] = useState<FieldInfo[]>(BASIC_FIELDS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const discoverFields = useCallback(async () => {
    if (!enabled || !agentId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch a sample of call logs to analyze
      const { data, error: fetchError } = await supabase
        .from('soundflare_call_logs')
        .select('metadata, transcription_metrics, metrics, telemetry_data')
        .eq('agent_id', agentId)
        .limit(sampleSize)

      if (fetchError) throw fetchError

      if (!data || data.length === 0) {
        setFields(BASIC_FIELDS)
        return
      }

      // Extract fields from JSONB columns
      const discoveredFields: FieldInfo[] = [...BASIC_FIELDS]

      // Helper function to analyze JSONB data
      const analyzeJsonbField = (
        records: any[],
        fieldName: 'metadata' | 'transcription_metrics' | 'metrics' | 'telemetry_data',
        category: FieldInfo['category']
      ) => {
        const fieldMap = new Map<string, { type: string; values: Set<any>; count: number }>()

        records.forEach((record) => {
          const jsonData = record[fieldName]
          if (!jsonData || typeof jsonData !== 'object') return

          Object.keys(jsonData).forEach((key) => {
            const value = jsonData[key]
            const existingField = fieldMap.get(key)

            if (!existingField) {
              fieldMap.set(key, {
                type: inferType(value),
                values: new Set([value]),
                count: 1
              })
            } else {
              existingField.values.add(value)
              existingField.count++
            }
          })
        })

        // Convert map to FieldInfo array
        fieldMap.forEach((fieldData, key) => {
          discoveredFields.push({
            name: key,
            type: fieldData.type as any,
            path: `${fieldName}.${key}`,
            category,
            sampleValues: Array.from(fieldData.values).slice(0, 5),
            count: fieldData.count,
            uniqueCount: fieldData.values.size
          })
        })
      }

      // Analyze each JSONB column
      analyzeJsonbField(data, 'metadata', 'metadata')
      analyzeJsonbField(data, 'transcription_metrics', 'transcription')
      analyzeJsonbField(data, 'metrics', 'metrics')
      analyzeJsonbField(data, 'telemetry_data', 'telemetry')

      setFields(discoveredFields)
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Error discovering fields:', {
        message: errorMessage,
        errorName: err?.name,
        errorCode: err?.code,
        errorDetails: err?.details,
        errorHint: err?.hint,
        stack: err?.stack,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        agentId,
        sampleSize
      })
      setError(errorMessage)
      setFields(BASIC_FIELDS)
    } finally {
      setIsLoading(false)
    }
  }, [agentId, enabled, sampleSize])

  useEffect(() => {
    discoverFields()
  }, [discoverFields])

  return {
    fields,
    isLoading,
    error,
    refetch: discoverFields
  }
}

/**
 * Infer the type of a value
 */
function inferType(value: any): FieldInfo['type'] {
  if (value === null || value === undefined) return 'string'

  if (Array.isArray(value)) return 'array'

  if (typeof value === 'object') return 'object'

  if (typeof value === 'boolean') return 'boolean'

  if (typeof value === 'number') return 'number'

  // Check if string is a date
  if (typeof value === 'string') {
    const datePattern = /^\d{4}-\d{2}-\d{2}/
    if (datePattern.test(value)) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) return 'date'
    }
  }

  return 'string'
}

/**
 * Helper hook to get field names grouped by category
 */
export const useFieldsByCategory = (fields: FieldInfo[]) => {
  return useMemo(() => {
    return {
      basic: fields.filter(f => f.category === 'basic'),
      metadata: fields.filter(f => f.category === 'metadata'),
      transcription: fields.filter(f => f.category === 'transcription'),
      metrics: fields.filter(f => f.category === 'metrics'),
      telemetry: fields.filter(f => f.category === 'telemetry')
    }
  }, [fields])
}

/**
 * Helper hook to get available field names for a specific JSONB column
 */
export const useAvailableJsonFields = (fields: FieldInfo[], column: 'metadata' | 'transcription_metrics') => {
  return useMemo(() => {
    const category = column === 'metadata' ? 'metadata' : 'transcription'
    return fields
      .filter(f => f.category === category)
      .map(f => f.name)
      .sort()
  }, [fields, column])
}
