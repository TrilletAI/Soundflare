"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Phone, Clock, CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw, Sparkles, Inbox, Eye, EyeOff, PanelLeftClose, PanelLeft, X, Bot, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ReanalyzeCallLogs from "../reprocess/ReprocessCallLogs"
import ColumnSelector from "../shared/ColumnSelector"
import { cn } from "@/lib/utils"
import { CostTooltip } from "../tool-tip/costToolTip"
import { CallLog } from "../../types/logs"
import { supabase } from "../../lib/supabase"
import Papa from 'papaparse'
import { useUser } from "@/hooks/useUser"
import { getUserProjectRole } from "@/services/getUserRole"
import { useRouter } from "next/navigation"
import { useCallLogs } from "@/hooks/useCallLogs"

// NEW IMPORTS
import FieldExplorer from './FieldExplorer'
import GlobalSearch, { SearchQuery } from './GlobalSearch'
import AdvancedFilter, { FilterGroup, FilterRule } from './AdvancedFilter'
import SavedViews, { SavedView } from './SavedViews'
import { useFieldDiscovery } from '@/hooks/useFieldDiscovery'
import { parseSearchQuery, searchQueryToFilters } from '@/lib/searchQueryParser'
import CallReviewBadge from './CallReviewBadge'
import { useCallReviews } from '@/hooks/useCallReviews'
import { useCallReviewsRealtime } from '@/hooks/useCallReviewsRealtime'
import SmartFilterChips, { SmartFilterType } from './SmartFilterChips'
import { usePercentiles } from '@/hooks/usePercentiles'
import toast from 'react-hot-toast'

interface CallLogsProps {
  project: any
  agent: any
  onBack: () => void
  isLoading?: boolean
}

// Skeleton for the filter header
function FilterHeaderSkeleton() {
  return (
    <div className="flex-none p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
        <div className="flex items-center gap-2">
          <div className="h-8 bg-muted animate-pulse rounded w-24"></div>
          <div className="h-8 bg-muted animate-pulse rounded w-24"></div>
          <div className="h-8 bg-muted animate-pulse rounded w-8"></div>
        </div>
      </div>
    </div>
  )
}

// Skeleton for table structure
function TableSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="h-full overflow-x-auto overflow-y-hidden">
        <div className="h-full overflow-y-auto" style={{ minWidth: "1020px" }}>
          <Table className="w-full">
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b-2">
              <TableRow className="bg-muted/80 hover:bg-muted/80">
                <TableHead className="font-semibold text-foreground min-w-[120px]">Customer Number</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[120px]">Call ID</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[120px]">Call Status</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[120px]">Duration</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[120px]">Start Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Table row skeletons */}
              {Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index} className="border-b border-border/50">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
                      <div className="h-5 w-24 bg-muted animate-pulse rounded"></div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="h-6 w-16 bg-muted animate-pulse rounded-md"></div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="h-6 w-20 bg-muted animate-pulse rounded-full"></div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="h-5 w-12 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="h-5 w-32 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}


const TruncatedText: React.FC<{
  text: string;
  maxLength?: number;
  className?: string;
}> = ({ text, maxLength = 30, className = "" }) => {
  const truncated = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("break-words", className)}>
          {truncated}
        </span>
      </TooltipTrigger>
      {text.length > maxLength && (
        <TooltipContent
          sideOffset={6}
          className="pointer-events-auto max-w-[420px] max-h-64 overflow-auto break-words"
        >
          {text}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

// Dynamic JSON Cell Component
const DynamicJsonCell: React.FC<{
  data: any;
  fieldKey: string;
  maxWidth?: string;
}> = ({ data, fieldKey, maxWidth = "180px" }) => {
  if (!data || typeof data !== 'object') {
    return <span className="text-muted-foreground text-xs">-</span>
  }

  const value = data[fieldKey]

  if (value === undefined || value === null) {
    return <span className="text-muted-foreground text-xs">-</span>
  }

  // Handle different data types
  if (typeof value === 'object') {
    const jsonString = JSON.stringify(value, null, 2)
    const truncatedJson = jsonString.length > 80 ? jsonString.substring(0, 80) + '...' : jsonString

    return (
      <div
        className="w-full max-w-full overflow-hidden border rounded-md bg-muted/20"
        style={{ maxWidth }}
      >
        <div className="p-1.5 w-full overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <pre
                className="text-xs font-mono text-foreground whitespace-pre-wrap break-all overflow-hidden w-full"
                style={{
                  wordBreak: 'break-all',
                  overflowWrap: 'break-word',
                  maxWidth: '100%'
                }}
              >
                {truncatedJson}
              </pre>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={6}
              className="pointer-events-auto max-w-[520px] max-h-64 overflow-auto whitespace-pre-wrap break-words"
            >
              {jsonString}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    )
  }

  // Handle primitive values - truncate long strings
  const stringValue = String(value)
  const shouldTruncate = stringValue.length > 25
  const displayValue = shouldTruncate ? stringValue.substring(0, 25) + '...' : stringValue

  return (
    <div
      className="text-xs w-full overflow-hidden"
      style={{ maxWidth }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="text-foreground font-medium block w-full overflow-hidden"
            style={{
              wordBreak: 'break-all',
              overflowWrap: 'break-word',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {displayValue}
          </span>
        </TooltipTrigger>
        {shouldTruncate && (
          <TooltipContent
            sideOffset={6}
            className="pointer-events-auto max-w-[420px] max-h-64 overflow-auto break-words"
          >
            {stringValue}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  )
}

// Wrapper component to manage dialog state
const ReanalyzeDialogWrapper = ({ projectId, agentId }: { projectId?: string; agentId?: string }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-neutral-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Re-analyze Logs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Re-analyze Call Logs</DialogTitle>
        </DialogHeader>
        <ReanalyzeCallLogs
          projectId={projectId}
          agentId={agentId}
          isDialogOpen={isOpen}
        />
      </DialogContent>
    </Dialog>
  )
}

const ROLE_RESTRICTIONS = {
  user: [
    'total_cost',
    'total_llm_cost',
    'total_tts_cost',
    'total_stt_cost',
    'avg_latency',
    'billing_duration_seconds'
  ],
}

const CallLogs: React.FC<CallLogsProps> = ({ project, agent, onBack, isLoading: parentLoading }) => {
  const router = useRouter()

  // Convert string to camelCase
  function toCamelCase(str: string) {
    return str
      .replace(/[^\w\s]/g, '')
      .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^./, c => c.toLowerCase())
  }

  const basicColumns = useMemo(
    () => [
      { key: "customer_number", label: "Customer Number" },
      { key: "call_id", label: "Call ID" },
      { key: "call_ended_reason", label: "Call Status" },
      { key: "duration_seconds", label: "Duration" },
      { key: "total_cost", label: "Total Cost" },
      { key: "avg_latency", label: "Avg Latency" },
      { key: "call_started_at", label: "Start Time" },
      // Hidden columns (available via column selector)
      { key: "billing_duration_seconds", label: "Billing Duration", hidden: true },
      { key: "total_llm_cost", label: "LLM Cost ($)", hidden: true },
      { key: "total_tts_cost", label: "TTS Cost ($)", hidden: true },
      { key: "total_stt_cost", label: "STT Cost ($)", hidden: true }
    ],
    [],
  )

  const isColumnVisibleForRole = useCallback((columnKey: string, role: string | null): boolean => {
    if (!role) return false

    const restrictedColumns = ROLE_RESTRICTIONS[role as keyof typeof ROLE_RESTRICTIONS]
    if (!restrictedColumns) return true

    return !restrictedColumns.includes(columnKey)
  }, [])

  const dynamicColumnsKey = useMemo(() => {
    if (!agent?.field_extractor_prompt) return []
    try {
      const prompt = agent.field_extractor_prompt;
      if (typeof prompt === 'string') {
        const parsed = JSON.parse(prompt);
        return Array.isArray(parsed) ? parsed.map((item: any) => toCamelCase(item.key)) : [];
      } else if (Array.isArray(prompt)) {
        return prompt.map((item: any) => toCamelCase(item.key));
      }
      return [];
    } catch (error) {
      console.error('Error parsing field_extractor_prompt:', error);
      return [];
    }
  }, [agent?.field_extractor_prompt])

  const [roleLoading, setRoleLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)
  const [batchReviewing, setBatchReviewing] = useState(false)
  const [selectedCallIds, setSelectedCallIds] = useState<Set<string>>(new Set())

  // NEW: Field Explorer state
  const [showFieldExplorer, setShowFieldExplorer] = useState(false)

  // NEW: Changed from FilterRule[] to FilterGroup[] for advanced filtering
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([])
  const [role, setRole] = useState<string | null>(null)

  // Sorting state - default to start time descending (most recent first)
  const [sortConfig, setSortConfig] = useState<{ column: string; ascending: boolean }>({
    column: 'call_started_at',
    ascending: false
  })

  // Smart filter state
  const [activeSmartFilters, setActiveSmartFilters] = useState<Set<SmartFilterType>>(new Set())
  const [visibleColumns, setVisibleColumns] = useState<{
    basic: string[]
    metadata: string[]
    transcription_metrics: string[]
    metrics: string[]
  }>({
    basic: basicColumns.filter(col => !col.hidden).map(col => col.key),
    metadata: [],
    transcription_metrics: [],
    metrics: []
  })

  const getFilteredBasicColumns = useMemo(() => {
    return basicColumns.filter(col =>
      !col.hidden && isColumnVisibleForRole(col.key, role)
    )
  }, [role, basicColumns, isColumnVisibleForRole])

  const { user } = useUser()
  const userEmail = user?.email

  // NEW: Field Discovery hook - TEMPORARILY DISABLED
  const { fields, isLoading: fieldsLoading } = useFieldDiscovery({
    agentId: agent?.id,
    sampleSize: 500,
    enabled: false
  })

  // Percentiles for smart filters
  const { data: percentiles, isLoading: percentilesLoading } = usePercentiles({
    agentId: agent?.id,
    enabled: !!agent?.id
  })

  // Load user role first
  useEffect(() => {
    if (userEmail && project?.id) {
      const getUserRole = async () => {
        setRoleLoading(true)
        try {
          const userRole = await getUserProjectRole(userEmail, project.id)
          setRole(userRole.role)
        } catch (error) {
          console.error('Failed to load user role:', error)
          setRole('user')
        } finally {
          setRoleLoading(false)
        }
      }
      getUserRole()
    } else {
      setRoleLoading(false)
      setRole('user')
    }
  }, [userEmail, project?.id])

  // Update visible columns when role changes
  useEffect(() => {
    if (role !== null) {
      const allowedBasicColumns = getFilteredBasicColumns.map(col => col.key)
      setVisibleColumns(prev => ({
        ...prev,
        basic: allowedBasicColumns
      }))
    }
  }, [role, getFilteredBasicColumns])

  // NEW: Convert FilterGroup[] to flat FilterRule[] for Supabase
  const flattenFilterGroups = (groups: FilterGroup[]): FilterRule[] => {
    const allFilters: FilterRule[] = []
    groups.forEach(group => {
      allFilters.push(...group.filters)
    })
    return allFilters
  }

  // Convert FilterRule[] to Supabase filter format
  const convertToSupabaseFilters = useCallback((filters: FilterRule[]) => {
    if (!agent?.id) return []

    const supabaseFilters = [{ column: "agent_id", operator: "eq", value: agent.id }]

    filters.forEach(filter => {
      const getColumnName = (forTextOperation = false) => {
        if (!filter.jsonField) return filter.column

        if (forTextOperation) {
          return `${filter.column}->>${filter.jsonField}`
        } else {
          return `${filter.column}->${filter.jsonField}`
        }
      }

      switch (filter.operation) {
        case 'equals':
          if (filter.column === 'call_started_at') {
            const startOfDay = `${filter.value} 00:00:00`
            const endOfDay = `${filter.value} 23:59:59.999`
            supabaseFilters.push({
              column: filter.column,
              operator: 'gte',
              value: startOfDay
            })
            supabaseFilters.push({
              column: filter.column,
              operator: 'lte',
              value: endOfDay
            })
          } else {
            supabaseFilters.push({
              column: getColumnName(false),
              operator: 'eq',
              value: filter.value
            })
          }
          break

        case 'contains':
          supabaseFilters.push({
            column: getColumnName(true),
            operator: 'ilike',
            value: `%${filter.value}%`
          })
          break

        case 'starts_with':
          supabaseFilters.push({
            column: getColumnName(true),
            operator: 'ilike',
            value: `${filter.value}%`
          })
          break

        case 'greater_than':
          if (filter.column === 'call_started_at') {
            const nextDay = new Date(filter.value)
            nextDay.setDate(nextDay.getDate() + 1)
            const nextDayStr = nextDay.toISOString().split('T')[0]
            supabaseFilters.push({
              column: filter.column,
              operator: 'gte',
              value: `${nextDayStr} 00:00:00`
            })
          } else {
            supabaseFilters.push({
              column: getColumnName(false),
              operator: 'gt',
              value: filter.value
            })
          }
          break

        case 'less_than':
          if (filter.column === 'call_started_at') {
            supabaseFilters.push({
              column: filter.column,
              operator: 'lt',
              value: `${filter.value} 00:00:00`
            })
          } else {
            supabaseFilters.push({
              column: getColumnName(false),
              operator: 'lt',
              value: filter.value
            })
          }
          break

        case 'json_equals':
          supabaseFilters.push({
            column: getColumnName(true),
            operator: 'eq',
            value: filter.value
          })
          break

        case 'json_contains':
          supabaseFilters.push({
            column: getColumnName(true),
            operator: 'ilike',
            value: `%${filter.value}%`
          })
          break

        case 'json_greater_than':
          supabaseFilters.push({
            column: `${getColumnName(false)}::numeric`,
            operator: 'gt',
            value: parseFloat(filter.value)
          })
          break

        case 'json_less_than':
          supabaseFilters.push({
            column: `${getColumnName(false)}::numeric`,
            operator: 'lt',
            value: parseFloat(filter.value)
          })
          break

        case 'json_exists':
          supabaseFilters.push({
            column: getColumnName(false),
            operator: 'not.is',
            value: null
          })
          break

        default:
          console.warn(`Unknown filter operation: ${filter.operation}`)
          break
      }
    })

    return supabaseFilters
  }, [agent?.id])

  const selectColumns = useMemo(() => {
    if (!role) return '*'

    const columns = [
      'id',
      'agent_id',
      'call_id',
      'customer_number',
      'call_ended_reason',
      'call_started_at',
      'call_ended_at',
      'duration_seconds',
      'recording_url',
      'metadata',
      'environment',
      'transcript_type',
      'transcript_json',
      'created_at',
      'transcription_metrics',
      'billing_duration_seconds',
      'metrics'
    ]

    if (isColumnVisibleForRole('avg_latency', role)) {
      columns.push('avg_latency')
    }

    if (isColumnVisibleForRole('total_llm_cost', role)) {
      columns.push('total_llm_cost', 'total_tts_cost', 'total_stt_cost')
    }

    return columns.join(',')
  }, [role, isColumnVisibleForRole])

  // NEW: Flatten filter groups for Supabase query
  const activeFilters = useMemo(() => flattenFilterGroups(filterGroups), [filterGroups])

  // Combine regular filters with smart filters
  const combinedFilters = useMemo(() => {
    const baseFilters = convertToSupabaseFilters(activeFilters)

    // Add smart filter conditions based on percentiles
    if (percentiles) {
      if (activeSmartFilters.has('duration') && percentiles.duration_p95 !== null) {
        baseFilters.push({
          column: 'duration_seconds',
          operator: 'gte',
          value: percentiles.duration_p95
        })
      }
      if (activeSmartFilters.has('cost') && percentiles.cost_p95 !== null) {
        // Use metadata->customer_charge if that's what we're filtering by
        baseFilters.push({
          column: 'metadata->>customer_charge',
          operator: 'gte',
          value: percentiles.cost_p95
        })
      }
      if (activeSmartFilters.has('latency') && percentiles.latency_p95 !== null) {
        baseFilters.push({
          column: 'avg_latency',
          operator: 'gte',
          value: percentiles.latency_p95
        })
      }
    }

    return baseFilters
  }, [activeFilters, activeSmartFilters, percentiles, convertToSupabaseFilters])

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error: queryError,
    fetchNextPage,
    refetch
  } = useCallLogs({
    agentId: agent?.id,
    filters: combinedFilters,
    select: selectColumns,
    orderBy: sortConfig,
    enabled: !!agent?.id
  })

  // Flatten pages into single array
  const calls = useMemo(() => data?.pages.flat() ?? [], [data])

  // Fetch call reviews for all visible call logs
  const callLogIds = useMemo(() => calls.map((call: CallLog) => call.id), [calls])
  const { data: reviewsMap, isLoading: reviewsLoading } = useCallReviews({
    callLogIds,
    enabled: true
  })

  // Subscribe to real-time updates for call reviews
  useCallReviewsRealtime(callLogIds)

  // Map to match old API
  const loading = isLoading || isFetchingNextPage
  const hasMore = hasNextPage ?? false
  const loadMore = fetchNextPage
  const refresh = refetch
  const error = queryError?.message

  // Extract all unique keys from metadata, transcription_metrics, and metrics across all calls
  const dynamicColumns = useMemo(() => {
    const metadataKeys = new Set<string>()
    const transcriptionKeys = new Set<string>()
    const metricsKeys = new Set<string>()

    calls.forEach((call: CallLog) => {
      if (call.metadata && typeof call.metadata === 'object') {
        Object.keys(call.metadata).forEach(key => {
          // Exclude customer_charge from metadata columns since it's shown in total_cost
          if (key !== 'customer_charge') {
            metadataKeys.add(key)
          }
        })
      }

      if (call.transcription_metrics && typeof call.transcription_metrics === 'object') {
        Object.keys(call.transcription_metrics).forEach(key => transcriptionKeys.add(key))
      }

      if (call.metrics && typeof call.metrics === 'object') {
        Object.keys(call.metrics).forEach(metricId => {
          metricsKeys.add(metricId)
        })
      }
    })

    return {
      metadata: Array.from(metadataKeys).sort(),
      transcription_metrics: Array.from(transcriptionKeys).sort(),
      metrics: Array.from(metricsKeys).sort()
    }
  }, [calls])

  // Initialize visible columns when dynamic columns change
  useEffect(() => {
    setVisibleColumns((prev) => {
      // Only update if actually needed
      const newBasic = prev.basic.length === 0
        ? basicColumns.filter(col => !col.hidden).map((col) => col.key)
        : prev.basic

      // Keep previous metadata selection, don't auto-populate
      const newMetadata = prev.metadata

      // Keep previous transcription_metrics selection, don't auto-populate
      const newTranscription = prev.transcription_metrics

      // Keep previous metrics selection, don't auto-populate
      const newMetrics = prev.metrics || []

      // Only update if something actually changed
      if (
        JSON.stringify(prev.basic) === JSON.stringify(newBasic) &&
        JSON.stringify(prev.metadata) === JSON.stringify(newMetadata) &&
        JSON.stringify(prev.transcription_metrics) === JSON.stringify(newTranscription) &&
        JSON.stringify(prev.metrics || []) === JSON.stringify(newMetrics)
      ) {
        return prev // No change, return previous state to prevent re-render
      }

        return {
          basic: newBasic,
          metadata: newMetadata,
          transcription_metrics: newTranscription,
          metrics: newMetrics
        }
    })
  }, [dynamicColumns.metadata, dynamicColumns.metrics, dynamicColumnsKey, basicColumns])

  const handleColumnChange = useCallback((type: 'basic' | 'metadata' | 'transcription_metrics' | 'metrics', column: string, visible: boolean) => {
    setVisibleColumns(prev => ({
      ...prev,
      [type]: visible
        ? [...prev[type], column]
        : prev[type].filter(col => col !== column)
    }))
  }, [])

  const handleSelectAll = useCallback((type: 'basic' | 'metadata' | 'transcription_metrics' | 'metrics', visible: boolean) => {
    setVisibleColumns(prev => ({
      ...prev,
      [type]: visible
        ? (type === "basic" ? basicColumns.map(col => col.key) : dynamicColumns[type] || [])
        : []
    }))
  }, [basicColumns, dynamicColumns])

  // NEW: Handle global search
  const handleGlobalSearch = (query: SearchQuery) => {
    const parsed = parseSearchQuery(query.text)
    const filters = searchQueryToFilters(parsed, query.fields)

    // Convert to filter groups
    const searchGroup: FilterGroup = {
      id: 'search-' + Date.now(),
      logic: parsed.logic,
      filters: filters
    }

    setFilterGroups([searchGroup])
  }

  // NEW: Handle advanced filter changes
  const handleAdvancedFiltersChange = (groups: FilterGroup[]) => {
    setFilterGroups(groups)
  }

  // NEW: Handle clear all filters
  const handleClearAllFilters = () => {
    setFilterGroups([])
  }

  // Handle column sort
  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      ascending: prev.column === column ? !prev.ascending : false
    }))
  }

  // Define which columns are sortable
  const sortableColumns = useMemo(() => new Set([
    'duration_seconds',
    'total_cost',
    'avg_latency',
    'call_started_at',
    'created_at'
  ]), [])

  // Handle smart filter toggle
  const handleSmartFilterToggle = (filter: SmartFilterType) => {
    setActiveSmartFilters(prev => {
      const next = new Set(prev)
      if (next.has(filter)) {
        next.delete(filter)
      } else {
        next.add(filter)
      }
      return next
    })
  }

  // NEW: Handle remove individual filter
  const handleRemoveFilter = (groupId: string, filterId: string) => {
    setFilterGroups(prev => {
      const updated = prev.map(group => {
        if (group.id === groupId) {
          const newFilters = group.filters.filter(f => f.id !== filterId)
          return { ...group, filters: newFilters }
        }
        return group
      }).filter(group => group.filters.length > 0) // Remove empty groups

      return updated
    })
  }

  // NEW: Format filter for display
  const formatFilterDisplay = (filter: FilterRule): string => {
    const fieldName = filter.jsonField
      ? `${filter.column}.${filter.jsonField}`
      : filter.column

    const operationMap: Record<string, string> = {
      'equals': '=',
      'contains': '~',
      'starts_with': '^',
      'greater_than': '>',
      'less_than': '<',
      'json_equals': '=',
      'json_contains': '~',
      'json_greater_than': '>',
      'json_less_than': '<',
      'json_exists': 'exists'
    }

    const op = operationMap[filter.operation] || filter.operation
    const displayValue = filter.value.length > 20 ? filter.value.substring(0, 20) + '...' : filter.value

    return filter.operation === 'json_exists'
      ? `${fieldName} exists`
      : `${fieldName} ${op} ${displayValue}`
  }

  // NEW: Handle saved view load
  const handleLoadView = (view: SavedView) => {
    setFilterGroups(view.filters)
    setVisibleColumns(view.visible_columns)
  }

  // NEW: Handle field toggle from Field Explorer
  const handleFieldToggle = useCallback((fieldPath: string) => {
    // Parse the field path (e.g., "metadata.customer_intent")
    const parts = fieldPath.split('.')

    if (parts.length === 1) {
      // Basic field
      const column = parts[0]
      const isVisible = visibleColumns.basic.includes(column)
      handleColumnChange('basic', column, !isVisible)
    } else {
      // JSONB field
      const [column, field] = parts
      const type = column === 'metadata' ? 'metadata' :
                   column === 'transcription_metrics' ? 'transcription_metrics' :
                   column === 'metrics' ? 'metrics' : 'metadata'

      const isVisible = visibleColumns[type].includes(field)
      handleColumnChange(type, field, !isVisible)
    }
  }, [visibleColumns, handleColumnChange])

  // NEW: Handle add filter from Field Explorer
  const handleAddFilterFromField = useCallback((fieldPath: string, fieldType: string) => {
    // Parse the field path
    const parts = fieldPath.split('.')
    const column = parts[0]
    const jsonField = parts.length > 1 ? parts[1] : undefined

    // Create a default filter
    const defaultOperation = fieldType === 'number' ? 'greater_than' :
                            fieldType === 'date' ? 'greater_than' :
                            jsonField ? 'json_contains' : 'contains'

    const newFilter: FilterRule = {
      id: Date.now().toString(),
      column,
      operation: defaultOperation,
      value: '',
      ...(jsonField && { jsonField })
    }

    // Add to first filter group or create new one
    if (filterGroups.length === 0) {
      setFilterGroups([{
        id: '1',
        logic: 'AND',
        filters: [newFilter]
      }])
    } else {
      const updated = [...filterGroups]
      updated[0] = {
        ...updated[0],
        filters: [...updated[0].filters, newFilter]
      }
      setFilterGroups(updated)
    }
  }, [filterGroups])

  const handleDownloadCSV = async () => {
    if (!agent?.id) return

    const { basic, metadata, transcription_metrics } = visibleColumns;

    const selectColumns = [
      'id',
      'agent_id',
      ...basic.filter(col => col !== "total_cost"),
      ...(metadata.length > 0 ? ['metadata'] : []),
      ...(transcription_metrics.length > 0 ? ['transcription_metrics'] : []),
    ];

    try {
      let query = supabase
        .from("soundflare_call_logs")
        .select(selectColumns.join(','));

      const filters = convertToSupabaseFilters(activeFilters);

      for (const filter of filters) {
        switch (filter.operator) {
          case 'eq':
            query = query.eq(filter.column, filter.value);
            break;
          case 'ilike':
            query = query.ilike(filter.column, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.column, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.column, filter.value);
            break;
          case 'gt':
            query = query.gt(filter.column, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.column, filter.value);
            break;
          case 'not.is':
            query = query.not(filter.column, 'is', filter.value);
            break;
          default:
            console.warn(`Unknown operator: ${filter.operator}`);
        }
      }

      query = query.order('created_at', { ascending: false });

      let allData: CallLog[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMoreData = true;

      while (hasMoreData) {
        const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          alert("Failed to fetch data for export: " + error.message);
          return;
        }

        if (data && data.length > 0) {
          allData = allData.concat(data as unknown as CallLog[]);

          if (data.length < pageSize) {
            hasMoreData = false;
          } else {
            page += 1;
          }
        } else {
          hasMoreData = false;
        }
      }

      if (allData.length === 0) {
        alert("No data found to export");
        return;
      }

      const csvData = allData.map((row) => {
        const flattened = flattenAndPickColumnsFixed(row, basic, metadata, transcription_metrics);
        return flattened;
      });

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `call_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download error:', error);
      alert("Failed to download CSV: " + (error as Error).message);
    }
  };

  function flattenAndPickColumnsFixed(
    row: CallLog,
    basic: string[],
    metadata: string[],
    transcription: string[]
  ): Record<string, any> {
    const flat: Record<string, any> = {};

    for (const key of basic) {
      if (key in row && key !== 'total_cost') {
        flat[key] = row[key as keyof CallLog];
      }
    }

    if (basic.includes('total_cost')) {
      const totalCost = (row.total_llm_cost || 0) + (row.total_tts_cost || 0) + (row.total_stt_cost || 0);
      flat['total_cost'] = totalCost;
    }

    if (row.metadata && typeof row.metadata === "object" && metadata.length > 0) {
      for (const key of metadata) {
        const value = row.metadata[key];
        flat[`metadata_${key}`] = value !== undefined && value !== null
          ? (typeof value === 'object' ? JSON.stringify(value) : String(value))
          : '';
      }
    } else if (metadata.length > 0) {
      for (const key of metadata) {
        flat[`metadata_${key}`] = '';
      }
    }

    if (row.transcription_metrics && typeof row.transcription_metrics === "object" && transcription.length > 0) {
      for (const key of transcription) {
        const value = row.transcription_metrics[key];
        flat[`transcription_${key}`] = value !== undefined && value !== null
          ? (typeof value === 'object' ? JSON.stringify(value) : String(value))
          : '';
      }
    } else if (transcription.length > 0) {
      for (const key of transcription) {
        flat[`transcription_${key}`] = '';
      }
    }

    return flat;
  }

  const totalVisibleColumns = visibleColumns.metadata.length + visibleColumns.transcription_metrics.length
  const baseWidth = 1020
  const dynamicWidth = totalVisibleColumns * 200
  const minTableWidth = baseWidth + dynamicWidth

  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleRefresh = () => {
    refetch()
  }

  const handleToggleSelectAll = () => {
    if (selectedCallIds.size === calls.length) {
      // Deselect all
      setSelectedCallIds(new Set())
    } else {
      // Select all visible calls
      setSelectedCallIds(new Set(calls.map((call: CallLog) => call.id)))
    }
  }

  const handleToggleSelectCall = (callId: string) => {
    const newSelected = new Set(selectedCallIds)
    if (newSelected.has(callId)) {
      newSelected.delete(callId)
    } else {
      newSelected.add(callId)
    }
    setSelectedCallIds(newSelected)
  }

  const handleBatchReview = async () => {
    if (!agent?.id || selectedCallIds.size === 0) return

    if (!confirm(`Queue ${selectedCallIds.size} selected call${selectedCallIds.size > 1 ? 's' : ''} for AI review?`)) {
      return
    }

    setBatchReviewing(true)
    try {
      const response = await fetch('/api/call-reviews/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callLogIds: Array.from(selectedCallIds),
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ Successfully queued ${result.data.processed} calls for AI review!\n\nThey will be processed in the next few minutes.`)
        // Clear selection
        setSelectedCallIds(new Set())
        // No need to refetch - SSE will handle the updates automatically
      } else {
        alert(`❌ Failed to queue reviews: ${result.error}`)
      }
    } catch (error) {
      console.error('Batch review error:', error)
      alert(`❌ Failed to queue reviews: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setBatchReviewing(false)
    }
  }

  const handleQueueSingleReview = async (callLogId: string, agentId: string) => {
    try {
      // Call the review endpoint directly with single callLogId
      const response = await fetch('/api/call-reviews/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callLogId: callLogId,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to trigger review')
      }
      
      // No need to refetch - SSE will handle the update automatically
    } catch (error) {
      console.error('Queue review error:', error)
      throw error
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatToIndianDateTime = (timestamp: any) => {
    const date = new Date(timestamp)
    const indianTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))

    return indianTime.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // NEW: Get all visible field paths for Field Explorer - MUST be before early returns
  const allVisibleFieldPaths = useMemo(() => {
    const paths: string[] = []

    // Basic fields
    visibleColumns.basic.forEach(col => paths.push(col))

    // Metadata fields
    visibleColumns.metadata.forEach(field => paths.push(`metadata.${field}`))

    // Transcription fields
    visibleColumns.transcription_metrics.forEach(field => paths.push(`transcription_metrics.${field}`))

    // Metrics fields
    visibleColumns.metrics.forEach(field => paths.push(`metrics.${field}`))

    return paths
  }, [visibleColumns])

  // Show skeleton while parent is loading OR role is loading
  if (parentLoading || roleLoading || !agent || !project || (isLoading && !data)) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <FilterHeaderSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-none p-4 border-b bg-background/95 dark:bg-neutral-900/95">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 rounded-lg flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Unable to load calls
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Unable to load calls</h3>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-neutral-900">
      {/* NEW: Field Explorer Sidebar - REMOVED */}
      {/* {showFieldExplorer && (
        <div className="w-64 border-r border-neutral-200 dark:border-neutral-700 flex-shrink-0">
          <FieldExplorer
            fields={fields}
            visibleFields={allVisibleFieldPaths}
            onFieldToggle={handleFieldToggle}
            onAddFilter={handleAddFilterFromField}
          />
        </div>
      )} */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* NEW: Search & Filter Bar */}
        <div className="flex-none p-4 border-b border-neutral-200 dark:border-neutral-700 bg-background/95 dark:bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 space-y-3">
          {/* Global Search */}
          <GlobalSearch
            onSearch={handleGlobalSearch}
            onClear={handleClearAllFilters}
            availableFields={fields.map(f => ({
              value: f.path,
              label: f.name,
              category: f.category
            }))}
          />

          {/* NEW: Active Filter Tags (Datadog-style) */}
          {filterGroups.length > 0 && activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap py-2 px-1">
              <span className="text-xs text-muted-foreground font-medium">Active Filters:</span>
              {filterGroups.map(group =>
                group.filters.map(filter => (
                  <Badge
                    key={`${group.id}-${filter.id}`}
                    variant="secondary"
                    className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-normal bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
                  >
                    <span>{formatFilterDisplay(filter)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFilter(group.id, filter.id)
                      }}
                      className="flex items-center justify-center w-3.5 h-3.5 rounded-sm hover:bg-orange-200 dark:hover:bg-orange-900 transition-colors"
                      aria-label="Remove filter"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))
              )}
              {filterGroups.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              )}
            </div>
          )}

          {/* Filter Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Advanced Filter */}
              <AdvancedFilter
                onFiltersChange={handleAdvancedFiltersChange}
                onClear={handleClearAllFilters}
                availableMetadataFields={dynamicColumns.metadata}
                availableTranscriptionFields={dynamicColumnsKey}
              />

              {/* Smart Filter Chips */}
              <SmartFilterChips
                percentiles={percentiles}
                isLoading={percentilesLoading}
                activeFilters={activeSmartFilters}
                onToggle={handleSmartFilterToggle}
              />

              {/* Saved Views */}
              <SavedViews
                agentId={agent?.id}
                currentFilters={filterGroups}
                currentColumns={visibleColumns}
                onLoadView={handleLoadView}
              />

              {/* Toggle Field Explorer */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFieldExplorer(!showFieldExplorer)}
                className="gap-2 h-8"
              >
                {showFieldExplorer ? <PanelLeftClose className="h-3 w-3" /> : <PanelLeft className="h-3 w-3" />}
                {showFieldExplorer ? 'Hide' : 'Show'} Fields
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Selection info */}
              {selectedCallIds.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedCallIds.size} selected
                </span>
              )}

              {/* Batch AI Review Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchReview}
                disabled={batchReviewing || !agent?.id || selectedCallIds.size === 0}
                className="gap-2 h-8 border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950 disabled:opacity-50"
              >
                {batchReviewing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Bot className="h-3 w-3" />
                )}
                {batchReviewing ? 'Queueing...' : selectedCallIds.size > 0 ? `AI Review (${selectedCallIds.size})` : 'AI Review'}
              </Button>

              <ReanalyzeDialogWrapper projectId={project?.id} agentId={agent?.id} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCSV}
                disabled={loading || !agent?.id}
                className="border-neutral-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                Download CSV
              </Button>
              <ColumnSelector
                basicColumns={basicColumns.map((col) => col.key)}
                basicColumnLabels={Object.fromEntries(basicColumns.filter(col => !col.hidden).map((col) => [col.key, col.label]))}
                metadataColumns={dynamicColumns.metadata}
                transcriptionColumns={dynamicColumnsKey}
                metricsColumns={dynamicColumns.metrics}
                visibleColumns={visibleColumns}
                onColumnChange={handleColumnChange}
                onSelectAll={handleSelectAll}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="gap-2 h-8 w-8 p-0 border-neutral-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Table Container - Same as before */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <div className="h-full overflow-y-auto" style={{ minWidth: `${minTableWidth}px` }}>
              <Table className="w-full">
                <TableHeader className="sticky top-0 z-10 bg-background/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b-2">
                  <TableRow className="bg-muted/80 dark:bg-neutral-800/80 hover:bg-muted/80 dark:hover:bg-neutral-800/80">
                    {/* Selection Checkbox */}
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={calls.length > 0 && selectedCallIds.size === calls.length}
                        onCheckedChange={handleToggleSelectAll}
                        aria-label="Select all calls"
                      />
                    </TableHead>

                    {/* Fixed Columns */}
                    {visibleColumns.basic.map((key) => {
                      const col = basicColumns.find((c) => c.key === key)
                      const isSortable = sortableColumns.has(key)
                      const isActiveSort = sortConfig.column === key

                      return (
                        <TableHead
                          key={`basic-${key}`}
                          className={cn(
                            "font-semibold text-foreground dark:text-gray-100 min-w-[120px]",
                            isSortable && "cursor-pointer select-none hover:bg-muted/50 dark:hover:bg-neutral-700/50 transition-colors"
                          )}
                          onClick={isSortable ? () => handleSort(key) : undefined}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{col?.label ?? key}</span>
                            {isSortable && (
                              <span className="flex-shrink-0">
                                {isActiveSort ? (
                                  sortConfig.ascending ? (
                                    <ArrowUp className="h-3.5 w-3.5 text-primary" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5 text-primary" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                                )}
                              </span>
                            )}
                          </div>
                        </TableHead>
                      )
                    })}

                    {/* AI Review Column */}
                    <TableHead className="font-semibold text-foreground dark:text-gray-100 min-w-[130px]">
                      AI Review
                    </TableHead>

                    {/* Dynamic Metadata Columns */}
                    {visibleColumns.metadata.map((key) => (
                      <TableHead
                        key={`metadata-${key}`}
                        className="w-[200px] font-semibold text-foreground dark:text-gray-100 bg-orange-50/50 dark:bg-orange-950/20 border-r border-orange-200/50 dark:border-orange-800/50"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">{key}</span>
                        </div>
                      </TableHead>
                    ))}

                    {/* Dynamic Transcription Metrics Columns */}
                    {visibleColumns.transcription_metrics.map((key, index) => (
                      <TableHead
                        key={`transcription-${key}`}
                        className={cn(
                          "w-[200px] font-semibold text-foreground dark:text-gray-100 bg-orange-50/50 dark:bg-orange-950/20",
                          index === 0 && visibleColumns.metadata.length === 0 && "border-l-2 border-primary/30 dark:border-primary/40",
                          index < visibleColumns.transcription_metrics.length - 1 && "border-r border-orange-200/50 dark:border-orange-800/50"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">{key}</span>
                        </div>
                      </TableHead>
                    ))}

                    {/* Dynamic Metrics Columns */}
                    {visibleColumns.metrics.map((metricId, index) => (
                      <TableHead
                        key={`metrics-${metricId}`}
                        className={cn(
                          "w-[150px] font-semibold text-foreground dark:text-gray-100 bg-green-50/50 dark:bg-green-950/20",
                          index === 0 && visibleColumns.metadata.length === 0 && visibleColumns.transcription_metrics.length === 0 && "border-l-2 border-primary/30 dark:border-primary/40",
                          index < visibleColumns.metrics.length - 1 && "border-r border-green-200/50 dark:border-green-800/50"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">{metricId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="overflow-auto">
                  {calls.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={
                          1 + // Checkbox column
                          visibleColumns.basic.length +
                          1 + // AI Review column
                          visibleColumns.metadata.length +
                          visibleColumns.transcription_metrics.length +
                          visibleColumns.metrics.length
                        }
                        className="h-[400px] text-center"
                      >
                        <div className="flex flex-col items-center justify-center space-y-4 py-12">
                          <div className="rounded-full bg-muted/50 dark:bg-neutral-800/50 p-6">
                            <Inbox className="w-12 h-12 text-muted-foreground dark:text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              No call logs found
                            </h3>
                            {activeFilters.length > 0 && (
                              <p className="text-sm text-muted-foreground dark:text-gray-400 max-w-md">
                                No call logs match your current filters. Try adjusting your filter criteria.
                              </p>
                            )}
                          </div>
                          {activeFilters.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleClearAllFilters}
                              className="mt-4"
                            >
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    calls.map((call: CallLog) => (
                    <TableRow
                      key={call.id}
                      className={cn(
                        "hover:bg-muted/30 dark:hover:bg-neutral-800/50 transition-all duration-200 border-b border-border/50 dark:border-neutral-700/50",
                        selectedCallIds.has(call.id) && "bg-orange-50/50 dark:bg-orange-950/20",
                      )}
                    >
                      {/* Selection Checkbox */}
                      <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedCallIds.has(call.id)}
                          onCheckedChange={() => handleToggleSelectCall(call.id)}
                          aria-label={`Select call ${call.call_id}`}
                        />
                      </TableCell>
                      {visibleColumns.basic.map((key) => {
                        let value: React.ReactNode = "-"

                        switch (key) {
                          case "customer_number":
                            value = (
                              <div className="flex w-full items-center gap-3">
                                <div className="w-10 h-8 rounded-full flex items-center justify-center">
                                  <Phone className="w-4 h-4 text-[#ff4d00] dark:text-[#ff4d00]/70" />
                                </div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{call.customer_number}</span>
                              </div>
                            )
                            break
                          case "call_id":
                            value = (
                              <code
                                className="text-xs bg-muted/60 dark:bg-neutral-700/60 px-3 py-1.5 rounded-md font-mono text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-muted dark:hover:bg-neutral-600/60 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigator.clipboard.writeText(call.call_id)
                                  toast.success('Call ID copied to clipboard')
                                }}
                              >
                                {call.call_id.slice(0, 8)}...
                              </code>
                            )
                            break
                          case "call_ended_reason":
                            value = (
                              <Badge
                                variant={call.call_ended_reason === "completed" ? "outline" : "destructive"}
                                className={`text-xs font-medium px-2.5 py-1 ${call.call_ended_reason === "completed" ? "border-[#ff4d00] text-[#ff4d00] dark:border-[#ff4d00]/70 dark:text-[#ff4d00]/70" : ""}`}
                              >
                                {call.call_ended_reason === "completed" ? (
                                  <CheckCircle className="w-3 h-3 mr-1.5" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1.5" />
                                )}
                                {call.call_ended_reason}
                              </Badge>
                            )
                            break
                          case "billing_duration_seconds":
                              value = (
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                <Clock className="w-3 h-3 text-muted-foreground dark:text-gray-400" />
                                {formatDuration(call?.billing_duration_seconds ?? 0)}
                              </div>
                              )
                              break
                          case "duration_seconds":
                            value = (
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                <Clock className="w-3 h-3 text-muted-foreground dark:text-gray-400" />
                                {formatDuration(call.duration_seconds)}
                              </div>
                            )
                            break
                          case "call_started_at":
                            value = <span className="text-gray-900 dark:text-gray-100">{formatToIndianDateTime(call.call_started_at)}</span>
                            break
                          case "total_cost":
                            // Show customer_charge from metadata if available
                            const customerCharge = call?.metadata?.customer_charge
                            value = customerCharge !== undefined && customerCharge !== null ? (
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                ${typeof customerCharge === 'number' ? customerCharge.toFixed(3) : customerCharge}
                              </span>
                            ) : "-"
                            break
                          case "avg_latency":
                            value = call.avg_latency ? (
                              <span className={`text-sm font-medium ${
                                call.avg_latency < 2
                                  ? "text-green-600 dark:text-green-400"
                                  : call.avg_latency <= 3
                                    ? "text-orange-500 dark:text-orange-400"
                                    : "text-red-600 dark:text-red-400"
                              }`}>
                                {call.avg_latency.toFixed(2)} s
                              </span>
                            ) : "-"
                            break
                        }

                        return (
                          <TableCell
                            key={`basic-${call.id}-${key}`}
                            className="py-4 cursor-pointer"
                            onClick={() => router.push(`/${project?.id}/agents/${call.agent_id}/observability?session_id=${call?.id}`)}
                          >
                            {value}
                          </TableCell>
                        )
                      })}

                      {/* AI Review Cell */}
                      <TableCell
                        className="py-4"
                        onClick={(e) => {
                          // Only navigate if clicking the cell background, not the badge
                          if (e.target === e.currentTarget) {
                            router.push(`/${project?.id}/agents/${call.agent_id}/observability?session_id=${call?.id}`)
                          }
                        }}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <CallReviewBadge 
                            review={reviewsMap?.get(call.id)}
                            callLogId={call.id}
                            agentId={call.agent_id}
                            onQueueReview={handleQueueSingleReview}
                          />
                        </div>
                      </TableCell>

                      {/* Dynamic Metadata Columns */}
                      {visibleColumns.metadata.map((key) => (
                        <TableCell
                          key={`metadata-${call.id}-${key}`}
                          className="py-4 bg-orange-50/30 dark:bg-orange-950/10 border-r border-orange-200/50 dark:border-orange-800/50 cursor-pointer"
                          onClick={() => router.push(`/${project?.id}/agents/${call.agent_id}/observability?session_id=${call?.id}`)}
                        >
                          <DynamicJsonCell
                            data={call.metadata}
                            fieldKey={key}
                            maxWidth="180px"
                          />
                        </TableCell>
                      ))}

                      {/* Dynamic Transcription Metrics Columns */}
                      {visibleColumns.transcription_metrics.map((key, index) => (
                        <TableCell
                          key={`transcription-${call.id}-${key}`}
                          className={cn(
                            "py-4 bg-orange-50/30 dark:bg-orange-950/10 cursor-pointer",
                            index === 0 && visibleColumns.metadata.length === 0 && "border-l-2 border-primary/30 dark:border-primary/40",
                            index < visibleColumns.transcription_metrics.length - 1 && "border-r border-orange-200/50 dark:border-orange-800/50"
                          )}
                          onClick={() => router.push(`/${project?.id}/agents/${call.agent_id}/observability?session_id=${call?.id}`)}
                        >
                          <DynamicJsonCell
                            data={call.transcription_metrics}
                            fieldKey={key}
                            maxWidth="180px"
                          />
                        </TableCell>
                      ))}

                      {/* Dynamic Metrics Columns */}
                      {visibleColumns.metrics.map((metricId, index) => {
                        let value: React.ReactNode = "-"
                        let tooltipContent: string | null = null

                        if (call.metrics && typeof call.metrics === 'object') {
                          const metricData = (call.metrics as any)[metricId]
                          if (metricData) {
                            const score = metricData.score
                            const reason = metricData.reason || "-"

                            value = (
                              <Badge
                                variant={score >= 0.7 ? "default" : score >= 0.5 ? "secondary" : "destructive"}
                                className="text-xs font-medium cursor-help"
                              >
                                {typeof score === 'number' ? score.toFixed(2) : score}
                              </Badge>
                            )

                            tooltipContent = reason
                          }
                        }

                        return (
                          <TableCell
                            key={`metrics-${call.id}-${metricId}`}
                            className={cn(
                              "py-4 bg-green-50/30 dark:bg-green-950/10",
                              index === 0 && visibleColumns.metadata.length === 0 && visibleColumns.transcription_metrics.length === 0 && "border-l-2 border-primary/30 dark:border-primary/40",
                              index < visibleColumns.metrics.length - 1 && "border-r border-green-200/50 dark:border-green-800/50"
                            )}
                          >
                            {tooltipContent ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {value}
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md bg-gray-900 dark:bg-neutral-800 border-neutral-700 p-0">
                                  <div className="text-sm p-4">
                                    <div className="font-semibold mb-2 text-white dark:text-gray-100">{metricId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                                    <div className="text-xs text-gray-100 dark:text-gray-200 whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                                      {tooltipContent}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              value
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>

              {/* Load More Trigger */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="py-6 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                  {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />}
                </div>
              )}

              {/* End of List */}
              {!hasNextPage && calls.length > 0 && (
                <div className="py-4 text-muted-foreground dark:text-gray-400 text-sm border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-center">
                  All calls loaded ({calls.length} total)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallLogs
