'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import {
  Dialog,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  XCircle,
  AlertTriangle,
  Info,
  Code,
  Terminal,
  Activity,
  Bug,
  Cpu,
  Play,
} from 'lucide-react'
import type { CallReviewRecord } from '@/types/callReview'
import { cn } from '@/lib/utils'

interface CallReviewBadgeProps {
  review: CallReviewRecord | null | undefined
  showDetails?: boolean
  callLogId?: string
  agentId?: string
  onQueueReview?: (callLogId: string, agentId: string) => Promise<void>
}

/**
 * Component to display call review status badge with error details
 */
export const CallReviewBadge: React.FC<CallReviewBadgeProps> = ({
  review,
  showDetails = true,
  callLogId,
  agentId,
  onQueueReview,
}) => {
  const [isQueueing, setIsQueueing] = useState(false)

  // Handle queue review button click
  const handleQueueReview = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click navigation
    
    if (!callLogId || !agentId || !onQueueReview) return

    setIsQueueing(true)
    try {
      await onQueueReview(callLogId, agentId)
    } catch (error) {
      console.error('Failed to queue review:', error)
    } finally {
      setIsQueueing(false)
    }
  }

  if (!review) {
    return (
      <div className="flex items-center gap-2">
        {callLogId && agentId && onQueueReview ? (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2 gap-1"
            onClick={handleQueueReview}
            disabled={isQueueing}
          >
            {isQueueing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Queueing...
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                Queue Review
              </>
            )}
          </Button>
        ) : (
          <Badge variant="outline" className="gap-1 text-xs opacity-50">
            <Clock className="w-3 h-3" />
            —
          </Badge>
        )}
      </div>
    )
  }

  const { status, error_count, error_message } = review

  // Pending status - show only Queue Review button to allow manual triggering
  if (status === 'pending') {
    return (
      <div className="flex items-center gap-2">
        {callLogId && agentId && onQueueReview ? (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2 gap-1"
            onClick={handleQueueReview}
            disabled={isQueueing}
          >
            {isQueueing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                Queue Review
              </>
            )}
          </Button>
        ) : (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        )}
      </div>
    )
  }

  // Processing status
  if (status === 'processing') {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <Loader2 className="w-3 h-3 animate-spin" />
        Processing
      </Badge>
    )
  }

  // Failed status
  if (status === 'failed') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="gap-1 cursor-help text-xs">
            <XCircle className="w-3 h-3" />
            Failed
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Review failed: {error_message || 'Unknown error'}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  // Completed status - with errors
  if (status === 'completed' && error_count > 0 && showDetails) {
    return (
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Badge
                variant="destructive"
                className="gap-1 cursor-pointer hover:bg-red-700 transition-colors text-xs"
              >
                <AlertCircle className="w-3 h-3" />
                {error_count} {error_count === 1 ? 'Error' : 'Errors'}
              </Badge>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to open the AI Review Workbench</p>
          </TooltipContent>
        </Tooltip>
        {/* Full-screen Workbench Modal - Custom Implementation */}
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: 'none',
              width: '100vw',
              height: '100vh',
              maxWidth: 'none',
              margin: 0,
              padding: 0,
              borderRadius: 0,
              border: 'none'
            }}
          >
            <DialogTitle className="sr-only">AI Review Workbench - {error_count} {error_count === 1 ? 'Error' : 'Errors'} Detected</DialogTitle>
            <DialogPrimitive.Close className="absolute top-4 right-4 z-50 rounded-lg p-2 bg-background/80 backdrop-blur-sm border border-border/50 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-background hover:border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none shadow-lg">
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
            <CallReviewWorkbench review={review} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </Dialog>
    )
  }

  // Completed status - no errors
  if (status === 'completed') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700 cursor-help text-xs">
            <CheckCircle className="w-3 h-3" />
            No Issues
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Call reviewed successfully - no errors found</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return null
}

/**
 * Main Workbench Component
 */
const CallReviewWorkbench: React.FC<{ review: CallReviewRecord }> = React.memo(({ review }) => {
  const [selectedErrorIndex, setSelectedErrorIndex] = useState<number>(0)
  const errors = React.useMemo(() => review.review_result?.errors || [], [review.review_result?.errors])
  const selectedError = errors[selectedErrorIndex]

  // Stats - memoized to prevent recalculation on every render
  const apiFailures = React.useMemo(() => errors.filter((e) => e.type === 'API_FAILURE').length, [errors])
  const wrongActions = React.useMemo(() => errors.filter((e) => e.type === 'WRONG_ACTION').length, [errors])
  const wrongOutputs = React.useMemo(() => errors.filter((e) => e.type === 'WRONG_OUTPUT').length, [errors])

  const getErrorIcon = React.useCallback((type: string, className = "w-4 h-4") => {
    switch (type) {
      case 'API_FAILURE': return <XCircle className={cn("text-red-500", className)} />
      case 'WRONG_ACTION': return <AlertTriangle className={cn("text-orange-500", className)} />
      case 'WRONG_OUTPUT': return <Info className={cn("text-yellow-500", className)} />
      default: return <AlertCircle className={cn("text-gray-500", className)} />
    }
  }, [])

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="min-h-16 border-b flex items-center px-4 md:px-6 justify-between bg-gradient-to-r from-muted/30 to-muted/10 shrink-0 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0 shadow-sm">
            <Bug className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-base md:text-lg tracking-tight">AI Review Workbench</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="truncate max-w-[200px] md:max-w-none">{review.call_log_id}</span>
              <span className="hidden sm:inline">•</span>
              <span className="whitespace-nowrap">{review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : 'Just now'}</span>
            </div>
          </div>
        </div>

        {/* Top Stats */}
        <div className="hidden lg:flex items-center gap-3 ml-4 shrink-0 flex-wrap">
          {apiFailures > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100/50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-full text-xs whitespace-nowrap shadow-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="font-medium text-red-700 dark:text-red-400">{apiFailures} API Failure{apiFailures !== 1 ? 's' : ''}</span>
            </div>
          )}
          {wrongActions > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100/50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900 rounded-full text-xs whitespace-nowrap shadow-sm">
              <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              <span className="font-medium text-orange-700 dark:text-orange-400">{wrongActions} Wrong Action{wrongActions !== 1 ? 's' : ''}</span>
            </div>
          )}
          {wrongOutputs > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100/50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-full text-xs whitespace-nowrap shadow-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
              <span className="font-medium text-yellow-700 dark:text-yellow-400">{wrongOutputs} Wrong Output{wrongOutputs !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Error List */}
        <div className="w-80 border-r bg-muted/10 flex flex-col shrink-0 shadow-inner">
            <div className="p-4 border-b pb-2 bg-background/50">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">Detected Issues</h3>
            </div>
            <div className="flex-1 overflow-y-auto scroll-smooth">
                <div className="p-2 space-y-1">
                    {errors.map((error, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedErrorIndex(idx)}
                            className={cn(
                                "w-full text-left p-3 rounded-lg border transition-all duration-200 hover:bg-muted group relative",
                                selectedErrorIndex === idx
                                    ? "bg-background border-primary/50 shadow-md ring-1 ring-primary/20"
                                    : "bg-transparent border-transparent hover:border-border hover:shadow-sm"
                            )}
                        >
                            {selectedErrorIndex === idx && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
                            )}
                            <div className="flex items-start gap-2 pl-2">
                                <div className="mt-0.5 shrink-0">{getErrorIcon(error.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal shrink-0">
                                            {error.type.replace(/_/g, ' ')}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground shrink-0">{error.timestamp}</span>
                                    </div>
                                    <h4 className={cn("text-sm font-medium leading-tight mb-1 break-words", selectedErrorIndex === idx ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                                        {error.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2 opacity-80 break-words">
                                        {error.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Content: Workbench Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
            {selectedError ? (
                <>
                    {/* Impact Banner */}
                    {selectedError.impact && (
                        <div className="px-6 md:px-8 pt-6 md:pt-8 pb-0">
                            <div
                                className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4"
                                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <span className="font-semibold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">Impact:</span>
                                        <p className="text-sm text-amber-800 dark:text-amber-300 mt-1" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                                            {selectedError.impact}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Header */}
                    <div className="p-6 md:p-8 border-b shrink-0 bg-background">
                        <div className="w-full max-w-full">
                            <div className="flex items-start gap-4 md:gap-6">
                                <div className="p-3 md:p-4 bg-muted rounded-xl border shrink-0">
                                    {getErrorIcon(selectedError.type, "w-8 h-8 md:w-10 md:h-10")}
                                </div>
                                <div className="flex-1 min-w-0 pr-4">
                                    <h1
                                        className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-foreground"
                                        style={{
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            hyphens: 'auto',
                                            whiteSpace: 'normal',
                                            display: 'block'
                                        }}
                                    >
                                        {selectedError.title}
                                    </h1>
                                    <p
                                        className="text-sm text-muted-foreground leading-relaxed"
                                        style={{
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            hyphens: 'auto',
                                            whiteSpace: 'normal'
                                        }}
                                    >
                                        {selectedError.description}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-4 flex-wrap">
                                <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    {selectedError.timestamp}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Detail View */}
                    <div className="flex-1 overflow-y-auto scroll-smooth">
                        <div className="p-4 md:p-6 lg:p-8 space-y-6 min-w-0 max-w-full">

                            {/* Comparison Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2 min-w-0">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-500">
                                        <CheckCircle className="w-4 h-4 shrink-0" />
                                        <span>Expected Behavior</span>
                                    </div>
                                    <div className="p-4 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 text-sm leading-relaxed overflow-auto max-h-[400px]">
                                        <div className="break-words whitespace-pre-wrap hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            {selectedError.evidence.expected}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 min-w-0">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-500">
                                        <XCircle className="w-4 h-4 shrink-0" />
                                        <span>Actual Behavior</span>
                                    </div>
                                    <div className="p-4 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 text-sm leading-relaxed overflow-auto max-h-[400px]">
                                        <div className="break-words whitespace-pre-wrap hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            {selectedError.evidence.actual}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Transcript Context */}
                            {selectedError.evidence.transcript_excerpt && (
                                <div className="space-y-2 min-w-0">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-primary shrink-0" />
                                        <span>Transcript Context</span>
                                    </h3>
                                    <div className="bg-muted/30 rounded-lg border p-4 max-h-[300px] overflow-y-auto">
                                        <p className="text-sm text-muted-foreground italic leading-relaxed break-words whitespace-pre-wrap hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            "{selectedError.evidence.transcript_excerpt}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Technical Deep Dive */}
                            <div className="space-y-3 min-w-0">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-primary shrink-0" />
                                    <span>Technical Analysis</span>
                                </h3>
                                <Tabs defaultValue="request" className="w-full min-w-0">
                                    <TabsList className="mb-3 flex-wrap h-auto">
                                        <TabsTrigger value="request" disabled={!selectedError.evidence.api_request} className="gap-2">
                                            <Terminal className="w-3 h-3 shrink-0" />
                                            <span>Request</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="response" disabled={!selectedError.evidence.api_response} className="gap-2">
                                            <Code className="w-3 h-3 shrink-0" />
                                            <span>Response</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="request" className="mt-0 min-w-0">
                                        <div className="bg-neutral-950 dark:bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shadow-lg">
                                            <div className="max-h-[500px] overflow-auto">
                                                <pre className="p-4 text-xs font-mono text-neutral-300 min-w-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                    {formatJson(selectedError.evidence.api_request)}
                                                </pre>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="response" className="mt-0 min-w-0">
                                        <div className="bg-neutral-950 dark:bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shadow-lg">
                                            <div className="max-h-[500px] overflow-auto">
                                                <pre className="p-4 text-xs font-mono text-neutral-300 min-w-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                    {formatJson(selectedError.evidence.api_response)}
                                                </pre>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>

                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                    <div className="rounded-full p-6 bg-muted/30 mb-4">
                        <CheckCircle className="w-12 h-12 text-muted-foreground/40" />
                    </div>
                    <p className="font-medium text-lg mb-2">No Error Selected</p>
                    <p className="text-sm text-muted-foreground/60">Select an error from the sidebar to view details</p>
                </div>
            )}
        </div>
      </div>
    </div>
  )
})

CallReviewWorkbench.displayName = 'CallReviewWorkbench'

// Helper to safely format JSON
const formatJson = (data: any) => {
  if (!data) return '// No data available';
  try {
    if (typeof data === 'string') {
      try {
        return JSON.stringify(JSON.parse(data), null, 2)
      } catch {
        return data
      }
    }
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

export default CallReviewBadge