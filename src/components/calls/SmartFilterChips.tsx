'use client'

import { cn } from '@/lib/utils'
import { Zap, Clock, DollarSign, Gauge, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PercentileData } from '@/hooks/usePercentiles'

export type SmartFilterType = 'duration' | 'cost' | 'latency'

interface SmartFilterChipsProps {
  percentiles: PercentileData | undefined
  isLoading?: boolean
  activeFilters: Set<SmartFilterType>
  onToggle: (filter: SmartFilterType) => void
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

const formatCost = (cost: number): string => {
  return `$${cost.toFixed(2)}`
}

const formatLatency = (seconds: number): string => {
  return `${seconds.toFixed(2)}s`
}

export default function SmartFilterChips({
  percentiles,
  isLoading,
  activeFilters,
  onToggle
}: SmartFilterChipsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading thresholds...</span>
      </div>
    )
  }

  // Don't render if no percentile data available
  if (!percentiles || (percentiles.duration_p95 === null && percentiles.cost_p95 === null && percentiles.latency_p95 === null)) {
    return null
  }

  const chips = [
    {
      id: 'duration' as SmartFilterType,
      icon: Clock,
      label: 'Duration',
      value: percentiles.duration_p95,
      format: formatDuration,
      tooltip: `95th percentile threshold: ${percentiles.duration_p95 ? formatDuration(percentiles.duration_p95) : 'N/A'}`
    },
    {
      id: 'cost' as SmartFilterType,
      icon: DollarSign,
      label: 'Cost',
      value: percentiles.cost_p95,
      format: formatCost,
      tooltip: `95th percentile threshold: ${percentiles.cost_p95 ? formatCost(percentiles.cost_p95) : 'N/A'}`
    },
    {
      id: 'latency' as SmartFilterType,
      icon: Gauge,
      label: 'Latency',
      value: percentiles.latency_p95,
      format: formatLatency,
      tooltip: `95th percentile threshold: ${percentiles.latency_p95 ? formatLatency(percentiles.latency_p95) : 'N/A'}`
    }
  ].filter(chip => chip.value !== null)

  if (chips.length === 0) return null

  return (
    <div className="flex items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span className="font-medium">Smart:</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>Filter by anomalies - shows calls above the 95th percentile threshold</p>
        </TooltipContent>
      </Tooltip>

      {chips.map(chip => {
        const isActive = activeFilters.has(chip.id)
        const Icon = chip.icon

        return (
          <Tooltip key={chip.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onToggle(chip.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                  "border focus:outline-none focus:ring-2 focus:ring-primary/20",
                  isActive
                    ? "bg-[#ff4d00] text-white border-[#ff4d00] shadow-sm dark:bg-[#ff4d00]/90 dark:border-[#ff4d00]/70"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground dark:hover:bg-neutral-800 dark:hover:text-gray-200"
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{chip.label}</span>
                <span className={cn(
                  "font-mono",
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  &gt;P95
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{chip.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
