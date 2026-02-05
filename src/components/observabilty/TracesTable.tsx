// src/components/observability/TracesTable.tsx
"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle, AlertTriangle, Wrench, TrendingUp, Brain, Mic, Volume2, Activity, Download, Filter } from "lucide-react"
import { OTelSpan } from "@/types/openTelemetry";
import { useSupabaseQuery } from "../../hooks/useSupabase"
import TraceDetailSheet from "./TraceDetailSheet/TraceDetailSheet"
import { cn } from "@/lib/utils"
import { useSessionTrace, useSessionSpansInfinite } from "@/hooks/useSessionTrace" // Changed import
import SessionTraceView from "./SessionTraceView"
import WaterfallView from "./WaterFallView";
import ConfigTab from "./ConfigTab";
import { getAgentPlatform } from "@/utils/agentDetection";

interface TracesTableProps {
  agentId: string
  sessionId?: string
  agent?: any
  filters: {
    search: string
    status: string
    timeRange: string
  }
}

interface TraceLog {
  id: string
  session_id: string
  turn_id: string
  user_transcript: string
  agent_response: string
  trace_id?: string
  otel_spans?: OTelSpan[]
  tool_calls?: any[]
  trace_duration_ms?: number
  trace_cost_usd?: number
  stt_metrics?: any
  llm_metrics?: any
  tts_metrics?: any
  eou_metrics?: any
  created_at: string
  unix_timestamp: number
  phone_number?: string
  lesson_day?: number
  call_success?: boolean
  lesson_completed?: boolean
  bug_report?: boolean
  metadata?: any
}

const TracesTable: React.FC<TracesTableProps> = ({ agentId, agent, sessionId, filters }) => {

  const [selectedTrace, setSelectedTrace] = useState<TraceLog | null>(null)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("turns");
  const [showErrorsOnly, setShowErrorsOnly] = useState(false)


  const { data: sessionTrace, isLoading: traceLoading } = useSessionTrace(sessionId || null);
  
  // Use the infinite scroll hook instead of the old hook
  const { 
    allSpans: sessionSpans, 
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading: spansLoading,
    totalCount: totalSpansCount
  } = useSessionSpansInfinite(sessionTrace);


  // Get call data to access bug report metadata
  const { data: callData } = useSupabaseQuery("soundflare_call_logs", {
    select: "*",
    filters: sessionId 
      ? [{ column: "id", operator: "eq", value: sessionId }]
      : [{ column: "agent_id", operator: "eq", value: agentId }],
    orderBy: { column: "created_at", ascending: false }
  })



  // trace data
  const {
    data: traceData,
    isLoading: traceDataLoading,
    error,
  } = useSupabaseQuery("soundflare_metrics_logs", {
    select: "*",
    filters: sessionId 
      ? [{ column: "session_id", operator: "eq", value: sessionId }]
      : [{ column: "session_id::text", operator: "like", value: `${agentId}%` }],
    orderBy: { column: "unix_timestamp", ascending: true }
  })

  // Extract bug report data from call metadata
  const bugReportData = useMemo(() => {
    if (!callData?.length) return null
    
    const call = callData[0]
    if (!call?.metadata) return null

    try {
      const metadata = typeof call.metadata === "string" ? JSON.parse(call.metadata) : call.metadata
      return {
        bug_reports: metadata?.bug_reports || null,
        bug_flagged_turns: metadata?.bug_flagged_turns || null
      }
    } catch (e) {
      return null
    }
  }, [callData])

  // Check for bug report flags
  const checkBugReportFlags = useMemo(() => {
    const bugReportTurnIds = new Set()

    // Use metadata bug_flagged_turns
    if (bugReportData?.bug_flagged_turns && Array.isArray(bugReportData.bug_flagged_turns)) {
      bugReportData.bug_flagged_turns.forEach((flaggedTurn: any) => {
        if (flaggedTurn.turn_id) {
          bugReportTurnIds.add(flaggedTurn.turn_id.toString())
        }
      })
    }

    // Fallback: Check transcript logs for explicit bug_report flags
    if (traceData?.length) {
      traceData.forEach((log: TraceLog) => {
        if (log.bug_report === true) {
          bugReportTurnIds.add(log.turn_id.toString())
        }
      })
    }

    return bugReportTurnIds
  }, [traceData, bugReportData])

  // Filter and process data
  const processedTraces = useMemo(() => {
    if (!traceData?.length) return []
    
    const filtered = traceData.filter((item: TraceLog) => 
      item.user_transcript || item.agent_response || item.tool_calls?.length || item.otel_spans?.length
    )
  
    filtered.sort((a, b) => {
      const aTurnNum = parseInt(a.turn_id.replace('turn_', '')) || 0
      const bTurnNum = parseInt(b.turn_id.replace('turn_', '')) || 0
      return aTurnNum - bTurnNum
    })
  
    return filtered
  }, [traceData])

  // Helper to check trace status for filtering (used before getTraceStatus is defined)
  const isErrorOrBugReport = useCallback((trace: TraceLog) => {
    if (checkBugReportFlags.has(trace.turn_id.toString())) return true
    const spans = trace.otel_spans || []
    const toolErrors = trace.tool_calls?.some(tool => tool.status === 'error' || tool.success === false)
    const hasExplicitError = trace.llm_metrics?.error === true
    const callFailed = trace.call_success === false
    if (spans.some((span: OTelSpan) => span.status?.code === 'ERROR' || span.status?.code === 2) || toolErrors || hasExplicitError || callFailed) return true
    return false
  }, [checkBugReportFlags])

  // Filter traces when showErrorsOnly is active
  const filteredTraces = useMemo(() => {
    if (!showErrorsOnly) return processedTraces
    return processedTraces.filter(isErrorOrBugReport)
  }, [processedTraces, showErrorsOnly, isErrorOrBugReport])

  const getTraceStatus = (trace: TraceLog) => {
    // Check if this turn is flagged for bug reports
    if (checkBugReportFlags.has(trace.turn_id.toString())) {
      return "bug_report"
    }

    const spans = trace.otel_spans || []
    const toolErrors = trace.tool_calls?.some(tool => tool.status === 'error' || tool.success === false)
    const hasExplicitError = trace.llm_metrics?.error === true
    const callFailed = trace.call_success === false

    if (spans.some((span: OTelSpan) => span.status?.code === 'ERROR' || span.status?.code === 2) || toolErrors || hasExplicitError || callFailed) return "error"
    if (spans.some((span: OTelSpan) => span.status?.code === 'UNSET')) return "warning"
    return "success"
  }

  const getMainOperation = (trace: TraceLog) => {
    // Determine the main operation type based on available data
    if (trace.tool_calls?.length) return "tool"
    if (trace.llm_metrics && Object.keys(trace.llm_metrics).length > 0) return "llm"
    if (trace.stt_metrics && Object.keys(trace.stt_metrics).length > 0) return "stt"
    if (trace.tts_metrics && Object.keys(trace.tts_metrics).length > 0) return "tts"
    if (trace.eou_metrics && Object.keys(trace.eou_metrics).length > 0) return "eou"
    return "general"
  }

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "tool": return <Wrench className="w-3 h-3" />
      case "eou": return <Activity className="w-3 h-3" />
      case "llm": return <Brain className="w-3 h-3" />
      case "stt": return <Mic className="w-3 h-3" />
      case "tts": return <Volume2 className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case "tool": return "text-orange-600 dark:text-orange-400"
      case "llm": return "text-purple-600 dark:text-purple-400"
      case "stt": return "text-blue-600 dark:text-orange-400"
      case "tts": return "text-green-600 dark:text-green-400"
      case "eou": return "text-orange-600 dark:text-orange-400"
      default: return "text-gray-600 dark:text-gray-400"
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }
  const formatCost = (cost: number) => {
    if (cost < 0.000001) return "~$0"
    return `$${cost.toFixed(6)}`
  }

  const formatRelativeTime = (timestamp: string) => {
    const now = Date.now()
    const time = new Date(timestamp).getTime()
    const diff = now - time
    
    if (diff < 60 * 1000) return `${Math.floor(diff / 1000)}s`
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m`
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h`
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d`
  }

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get the start timestamp (first trace's timestamp)
  const callStartTimestamp = useMemo(() => {
    if (!processedTraces.length) return 0
    return processedTraces[0]?.unix_timestamp || 0
  }, [processedTraces])

  const getToolCallsInfo = (toolCalls: any[] = []) => {
    if (!toolCalls || !Array.isArray(toolCalls)) {
      return { total: 0, successful: 0 }
    }
    const total = toolCalls.length
    const successful = toolCalls.filter(tool => tool.status === 'success' || tool.success !== false).length
    return { total, successful }
  }

  const getMetricsInfo = (trace: TraceLog) => {
    const metrics = []
    if (trace.stt_metrics && Object.keys(trace.stt_metrics).length > 0) {
      metrics.push({ type: 'STT', duration: trace.stt_metrics.duration })
    }
    if (trace.llm_metrics && Object.keys(trace.llm_metrics).length > 0) {
      metrics.push({ type: 'LLM', ttft: trace.llm_metrics.ttft })
    }
    if (trace.tts_metrics && Object.keys(trace.tts_metrics).length > 0) {
      metrics.push({ type: 'TTS', ttfb: trace.tts_metrics.ttfb })
    }
    if (trace.eou_metrics && Object.keys(trace.eou_metrics).length > 0) {
      metrics.push({ type: 'EOU', delay: trace.eou_metrics.end_of_utterance_delay })
    }
    return metrics
  }

  const getTotalLatency = (trace: TraceLog) => {
    let total = 0

    // LLM TTFT
    if (trace.llm_metrics?.ttft) {
      total += trace.llm_metrics.ttft * 1000 // Convert seconds to ms
    }

    // TTS TTFB
    if (trace.tts_metrics?.ttfb) {
      total += trace.tts_metrics.ttfb * 1000 // Convert seconds to ms
    }

    // EOU metrics
    if (trace.eou_metrics?.end_of_utterance_delay) {
      total += trace.eou_metrics.end_of_utterance_delay * 1000
    }

    return total
  }

  const downloadFullTranscript = () => {
    if (!processedTraces.length) return

    // Format all conversation turns as JSON
    const transcriptData = {
      session_id: sessionId || 'unknown',
      agent_id: agentId,
      total_turns: processedTraces.length,
      exported_at: new Date().toISOString(),
      turns: processedTraces.map((trace: TraceLog) => {
        const turnData: any = {
          turn_id: trace.turn_id,
        }
        
        // Add user transcript if available
        if (trace.user_transcript && trace.user_transcript.trim()) {
          turnData.user = trace.user_transcript.trim()
        }
        
        // Add assistant response if available
        if (trace.agent_response && trace.agent_response.trim()) {
          turnData.assistant = trace.agent_response.trim()
        }
        
        // Add timestamp if available
        if (trace.unix_timestamp) {
          turnData.timestamp = new Date(trace.unix_timestamp * 1000).toISOString()
        }
        
        // Add additional metadata if available
        if (trace.trace_id) {
          turnData.trace_id = trace.trace_id
        }
        
        return turnData
      })
    }

    // Create JSON string with pretty formatting
    const transcriptJson = JSON.stringify(transcriptData, null, 2)

    // Create filename with session ID and timestamp
    const sessionIdShort = sessionId ? sessionId.slice(-8) : 'unknown'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `transcript-session-${sessionIdShort}-${timestamp}.json`

    // Create blob and download
    const blob = new Blob([transcriptJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }


const handleRowClick = (trace: TraceLog) => {
  const hasBugReport = checkBugReportFlags.has(trace.turn_id.toString())
  
  const relevantBugReports = bugReportData?.bug_reports?.filter((report: any) => {
    const reportFlaggedTurns = bugReportData?.bug_flagged_turns?.filter(
      (flaggedTurn: any) => flaggedTurn.bug_report_id === report.id || 
      flaggedTurn.timestamp === report.timestamp
    ) || []
    
    return reportFlaggedTurns.some((flaggedTurn: any) => 
      flaggedTurn.turn_id.toString() === trace.turn_id.toString()
    )
  }) || []

  const enrichedTrace = {
    ...trace,
    bug_report: hasBugReport,
    bug_report_data: {
      ...bugReportData,
      bug_reports: relevantBugReports
    }
  }
  
  setSelectedTrace(enrichedTrace)
  setIsDetailSheetOpen(true)
}

  if (traceDataLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-neutral-900">
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading traces...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-neutral-900">
        <div className="text-center text-red-600 dark:text-red-400 text-sm">
          Error loading traces: {error.message}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full bg-white dark:bg-neutral-900">
        {/* Tab Navigation */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800 px-3 py-1.5">
          <div className="flex items-center justify-between">
            <nav className="flex space-x-2">
              <button 
                onClick={() => setActiveTab("turns")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                  activeTab === "turns" 
                    ? "bg-blue-100 dark:bg-orange-900/20 text-blue-700 dark:text-orange-300 border border-blue-200 dark:border-orange-800" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
                )}
              >
                Turns ({showErrorsOnly ? `${filteredTraces.length}/${processedTraces.length}` : processedTraces.length})
              </button>
            {sessionSpans && sessionSpans.length > 0 && (
            <>
              <button 
                onClick={() => setActiveTab("trace")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                  activeTab === "trace" 
                    ? "bg-blue-100 dark:bg-orange-900/20 text-blue-700 dark:text-orange-300 border border-blue-200 dark:border-orange-800" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
                )}
              >
                Trace ({totalSpansCount})
              </button>
              <button 
                onClick={() => setActiveTab("waterfall")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                  activeTab === "waterfall" 
                    ? "bg-blue-100 dark:bg-orange-900/20 text-blue-700 dark:text-orange-300 border border-blue-200 dark:border-orange-800" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
                )}
              >
                Timeline ({totalSpansCount})
              </button>
            </>
          )}
          <button 
            onClick={() => setActiveTab("config")}
            className={cn(
              "px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
              activeTab === "config" 
                ? "bg-blue-100 dark:bg-orange-900/20 text-blue-700 dark:text-orange-300 border border-blue-200 dark:border-orange-800" 
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
            )}
          >
            Config
          </button>
          </nav>
          
          {/* Filter and Download Buttons */}
          {activeTab === "turns" && (
            <div className="flex items-center gap-2">
              <Button
                variant={showErrorsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowErrorsOnly(!showErrorsOnly)}
                className={cn(
                  "h-8 text-xs flex items-center gap-1.5",
                  showErrorsOnly && "bg-red-600 hover:bg-red-700 text-white"
                )}
              >
                <Filter className="w-3 h-3" />
                Errors Only
              </Button>
              {processedTraces.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadFullTranscript}
                  className="h-8 text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3 h-3" />
                  Download Transcript
                </Button>
              )}
            </div>
          )}
          </div>
        </div>
  
        {/* Tab Content */}
        {activeTab === "turns" && (
          <>
            {/* Header */}
            <div className="border-b border-neutral-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800 px-4 py-2">
              <div className="grid grid-cols-11 gap-3 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                <div className="col-span-2">Time</div>
                <div className="col-span-5">Conversation</div>
                <div className="col-span-2">Operations</div>
                <div className="col-span-1">Latency</div>
                <div className="col-span-1">Status</div>
              </div>
            </div>
  
            {/* Table Body */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900">
              {filteredTraces.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div>No traces found</div>
                    {showErrorsOnly ? (
                      <div className="text-xs mt-1">No errors in this session. Try disabling the filter.</div>
                    ) : filters.search || filters.status !== "all" ? (
                      <div className="text-xs mt-1">Try adjusting your filters</div>
                    ) : (
                      <div className="text-xs mt-1">Traces will appear here when data is available</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredTraces.map((trace: TraceLog) => {
                    const status = getTraceStatus(trace)
                    const toolInfo = getToolCallsInfo(trace.tool_calls)
                    const mainOp = getMainOperation(trace)
                    const metrics = getMetricsInfo(trace)
                    const latency = getTotalLatency(trace)
                    const hasBugReport = checkBugReportFlags.has(trace.turn_id.toString())
                    const spansLength = trace.otel_spans?.length || 0
                    
                    return (
                      <div
                        key={trace.id}
                        onClick={() => handleRowClick(trace)}
                        className={cn(
                          "grid grid-cols-11 gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-orange-900/10 cursor-pointer border-l-2 transition-all text-sm",
                          hasBugReport
                            ? "border-l-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : "border-l-transparent hover:border-l-blue-500 dark:hover:border-l-orange-400"
                        )}
                      >
                        {/* Time */}
                        <div className="col-span-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={cn("text-sm", getOperationColor(mainOp))}>
                              {getOperationIcon(mainOp)}
                            </div>
                            <div className="font-mono text-xs text-gray-700 dark:text-gray-300 font-semibold">
                              {trace.unix_timestamp && callStartTimestamp
                                ? formatElapsedTime(trace.unix_timestamp - callStartTimestamp)
                                : 'N/A'}
                            </div>
                            {hasBugReport && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                                <Badge variant="destructive" className="text-xs px-1 py-0">
                                  Bug
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
  
                        {/* Conversation */}
                        <div className="col-span-5 space-y-1">
                          {trace.user_transcript && (
                            <div className="text-xs">
                              <span className="text-blue-600 dark:text-orange-400 font-medium">→</span>
                              <span className="ml-1 text-gray-800 dark:text-gray-200">{truncateText(trace.user_transcript, 60)}</span>
                            </div>
                          )}
                          {trace.agent_response && (
                            <div className={cn(
                              "text-xs",
                              hasBugReport && "text-red-700 dark:text-red-300 font-medium"
                            )}>
                              <span className={cn(
                                "font-medium",
                                hasBugReport ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
                              )}>←</span>
                              <span className={cn(
                                "ml-1",
                                hasBugReport ? "text-red-800 dark:text-red-300" : "text-gray-600 dark:text-gray-300"
                              )}>{truncateText(trace.agent_response, 60)}</span>
                              {hasBugReport && (
                                <span className="ml-2 text-red-600 dark:text-red-400 font-medium">[REPORTED]</span>
                              )}
                            </div>
                          )}
                          {!trace.user_transcript && !trace.agent_response && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                              {trace.lesson_day ? `Lesson Day ${trace.lesson_day}` : 'System operation'}
                            </div>
                          )}
                        </div>
  
                        {/* Operations */}
                        <div className="col-span-2 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {toolInfo.total > 0 && (
                              <Wrench className={cn(
                                "w-4 h-4",
                                toolInfo.successful === toolInfo.total
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              )} />
                            )}
                            {metrics.length > 0 && (
                              <div className="flex gap-1">
                                {metrics.map((metric, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-[10px] px-1 py-0 border-green-500 text-green-600 dark:border-green-400 dark:text-green-400"
                                  >
                                    {metric.type}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {spansLength > 0 ? `${spansLength} spans` : ""}
                          </div>
                        </div>
  
                        {/* Latency */}
                        <div className="col-span-1">
                          <span className={cn(
                            "text-xs font-semibold",
                            latency === 0 ? "text-gray-400 dark:text-gray-500" : 
                            latency > 5000 ? "text-red-600 dark:text-red-400" :
                            latency > 2000 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
                          )}>
                            {latency > 0 ? formatDuration(latency) : "N/A"}
                          </span>
                        </div>
  
                        {/* Status */}
                        <div className="col-span-1">
                          <div className="flex items-center pl-5">
                            {status === "bug_report" ? (
                              <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                            ) : status === "error" ? (
                              <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                            ) : status === "warning" ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                            )}
                          </div>
                        </div>
  
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === "trace" && (
          <SessionTraceView 
            trace={sessionTrace} 
            loading={traceLoading || spansLoading}
            spans={sessionSpans}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            totalCount={totalSpansCount}
          />
        )}


        {activeTab === "waterfall" && (
          <WaterfallView 
            trace={{...sessionTrace, spans: sessionSpans}} 
            loading={traceLoading || spansLoading} 
          />
        )}

        {activeTab === "config" && (
          <ConfigTab sessionId={sessionId} />
        )}
      </div>
  
      {/* Trace Detail Sheet */}
      <TraceDetailSheet
        isOpen={isDetailSheetOpen}
        trace={selectedTrace}
        agent={agent}
        recordingUrl={callData?.[0]?.recording_url || callData?.[0]?.voice_recording_url}
        callStartTime={callData?.[0]?.call_started_at}
        onClose={() => {
          setIsDetailSheetOpen(false)
          setSelectedTrace(null)
        }}
      />
    </>
  )
}

export default TracesTable