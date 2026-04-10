// components/analytics/PipelineAnalytics.tsx
'use client'

import React, { useState, useMemo } from 'react'
import {
  Phone,
  Clock,
  CheckCircle,
  Lightning,
  Microphone,
  Brain,
  SpeakerHigh,
  Waveform,
  ChartBar,
  CaretDown,
  CaretUp,
  X,
} from 'phosphor-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  usePipelineAnalytics,
  type PipelineSummary,
  type CallBreakdown,
  type TurnBreakdown,
} from '@/hooks/usePipelineAnalytics'
import { useMobile } from '@/hooks/use-mobile'

// ─── Helpers ────────────────────────────────────────────────────

function fmtMs(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  return `${(seconds * 1000).toFixed(0)}ms`
}

function fmtLatency(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  return seconds >= 1 ? `${seconds.toFixed(2)}s` : `${(seconds * 1000).toFixed(0)}ms`
}

function fmtDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function fmtPhone(phone: string): string {
  if (!phone) return '—'
  if (phone.length > 7) return `***${phone.slice(-4)}`
  return phone
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Date Range Selector ────────────────────────────────────────

const DATE_RANGES = [
  { label: 'Last 24h', value: '1d' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
] as const

function getDateRange(period: string): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90
  from.setDate(from.getDate() - days)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

function PeriodSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1">
      {DATE_RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === r.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

// ─── KPI Card ───────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  iconClassName?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              iconClassName || 'bg-primary/10 text-primary'
            }`}
          >
            <Icon size={20} weight="duotone" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold tabular-nums truncate">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Pipeline Latency Card ──────────────────────────────────────

function PipelineCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  color: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={16} className={colorMap[color] || 'text-primary'} weight="fill" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

// ─── Call Detail Slide-over ─────────────────────────────────────

function CallDetailPanel({
  call,
  onClose,
}: {
  call: CallBreakdown
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Call Details</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Call summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Duration
              </p>
              <p className="text-sm font-semibold mt-0.5">
                {fmtDuration(call.duration_seconds)}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Avg Latency
              </p>
              <p className="text-sm font-semibold mt-0.5">
                {fmtLatency(call.avg_latency)}
              </p>
            </div>
          </div>

          {/* Per-turn breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Turn-by-turn metrics ({call.turns.length})
            </h4>
            <div className="space-y-2">
              {call.turns.map((turn) => (
                <TurnCard key={turn.turn_id} turn={turn} callAvgLatency={call.avg_latency} />
              ))}
              {call.turns.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No turn data available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TurnCard({
  turn,
  callAvgLatency,
}: {
  turn: TurnBreakdown
  callAvgLatency: number | null
}) {
  const hasMetrics = turn.stt_duration != null || turn.llm_ttft != null
  // Estimate TTS when direct measurement isn't available
  const estTts =
    turn.stt_duration != null && turn.llm_ttft != null && callAvgLatency != null
      ? Math.max(0, callAvgLatency - turn.stt_duration - turn.llm_ttft)
      : null

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">
          {turn.turn_id.replace(/_/g, ' ').toUpperCase()}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {fmtTime(turn.created_at)}
        </span>
      </div>

      {turn.user_transcript && (
        <p className="text-xs text-muted-foreground mb-1">
          <span className="font-medium">User:</span> {turn.user_transcript}
        </p>
      )}
      {turn.agent_response && (
        <p className="text-xs text-muted-foreground mb-2">
          <span className="font-medium">Agent:</span>{' '}
          {turn.agent_response.length > 120
            ? turn.agent_response.slice(0, 120) + '…'
            : turn.agent_response}
        </p>
      )}

      {hasMetrics && (
        <div className="flex gap-3 flex-wrap">
          {turn.stt_duration != null && (
            <MetricBadge
              icon={Microphone}
              label="STT"
              value={fmtMs(turn.stt_duration)}
              color="text-blue-500"
            />
          )}
          {turn.llm_ttft != null && (
            <MetricBadge
              icon={Brain}
              label="LLM TTFT"
              value={fmtMs(turn.llm_ttft)}
              color="text-purple-500"
            />
          )}
          {turn.eou_delay != null && (
            <MetricBadge
              icon={Waveform}
              label="EOU"
              value={fmtMs(turn.eou_delay)}
              color="text-amber-500"
            />
          )}
          {turn.tts_ttfb != null && (
            <MetricBadge
              icon={SpeakerHigh}
              label="TTS TTFB"
              value={fmtMs(turn.tts_ttfb)}
              color="text-emerald-500"
            />
          )}
          {turn.tts_ttfb == null && estTts != null && estTts > 0 && (
            <MetricBadge
              icon={SpeakerHigh}
              label="TTS (est.)"
              value={fmtMs(estTts)}
              color="text-emerald-400"
            />
          )}
        </div>
      )}
    </div>
  )
}

function MetricBadge({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex items-center gap-1 text-[10px]">
      <Icon size={12} className={color} weight="fill" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

// ─── Chart Tooltip ──────────────────────────────────────────────

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">
            {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── Skeleton Loaders ───────────────────────────────────────────

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <Skeleton className="h-4 w-40 mb-4" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ─── Main Component ─────────────────────────────────────────────

interface PipelineAnalyticsProps {
  agentId: string
  agentName?: string
}

export function PipelineAnalytics({ agentId, agentName }: PipelineAnalyticsProps) {
  const [period, setPeriod] = useState('7d')
  const [selectedCall, setSelectedCall] = useState<CallBreakdown | null>(null)
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null)
  const { isMobile } = useMobile()

  const { from, to } = useMemo(() => getDateRange(period), [period])

  const { data, isLoading, isError } = usePipelineAnalytics({
    agentId,
    from,
    to,
  })

  const summary = data?.summary
  const dailyVolumes = data?.daily_volumes || []
  const hourlyLatency = data?.hourly_latency || []
  const calls = data?.calls || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pipeline Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <ChartBar size={16} />
            Voice agent performance &amp; latency metrics
            {agentName && (
              <span className="text-foreground font-medium">— {agentName}</span>
            )}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Error banner */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            Failed to load analytics data. Please refresh the page.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Calls"
            value={summary?.total_calls ?? 0}
            subtitle={`${summary?.total_minutes ?? 0} min total`}
            icon={Phone}
            iconClassName="bg-blue-500/10 text-blue-500"
          />
          <KpiCard
            title="Avg Latency"
            value={fmtLatency(summary?.avg_latency)}
            subtitle="End-to-end response time"
            icon={Clock}
            iconClassName="bg-amber-500/10 text-amber-500"
          />
          <KpiCard
            title="P95 Latency"
            value={fmtLatency(summary?.p95_latency)}
            subtitle="95th percentile"
            icon={Lightning}
            iconClassName="bg-red-500/10 text-red-500"
          />
          <KpiCard
            title="Success Rate"
            value={`${summary?.success_rate ?? 0}%`}
            subtitle={`${summary?.total_calls ? summary.total_calls - Math.round((summary.total_calls * (summary?.success_rate ?? 0)) / 100) : 0} failed`}
            icon={CheckCircle}
            iconClassName="bg-emerald-500/10 text-emerald-500"
          />
        </div>
      )}

      {/* Pipeline Latency Breakdown */}
      {!isLoading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PipelineCard
            title="Avg STT"
            value={fmtMs(summary.avg_stt_duration)}
            subtitle="Speech recognition time"
            icon={Microphone}
            color="blue"
          />
          <PipelineCard
            title="Avg LLM TTFT"
            value={fmtMs(summary.avg_llm_ttft)}
            subtitle="Time to first token"
            icon={Brain}
            color="purple"
          />
          <PipelineCard
            title="Avg TTS"
            value={fmtMs(summary.estimated_tts)}
            subtitle={summary.avg_tts_ttfb != null ? 'Time to first byte' : 'Estimated from pipeline'}
            icon={SpeakerHigh}
            color="emerald"
          />
          <PipelineCard
            title="Avg EOU Delay"
            value={fmtMs(summary.avg_eou_delay)}
            subtitle="End-of-utterance detection"
            icon={Waveform}
            color="amber"
          />
        </div>
      )}

      {/* Charts */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Daily Call Volume */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Phone size={16} className="text-muted-foreground" />
                  Daily Call Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyVolumes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dailyVolumes}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => fmtDate(d)}
                        className="text-xs"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="calls"
                        name="Calls"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                    No call data for this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hourly Latency Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock size={16} className="text-muted-foreground" />
                  Hourly Latency Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hourlyLatency.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={hourlyLatency}>
                      <defs>
                        <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v) => `${v.toFixed(1)}s`}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="avg_latency"
                        name="Avg Latency (s)"
                        stroke="hsl(var(--primary))"
                        fill="url(#latencyGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                    No latency data for this period
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Call Log Table */}
      {!isLoading && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Phone size={16} className="text-muted-foreground" />
              Call Log ({calls.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">Phone</th>
                    <th className="p-3 font-medium">Duration</th>
                    <th className="p-3 font-medium">Avg Latency</th>
                    <th className="p-3 font-medium">Turns</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <React.Fragment key={call.id}>
                      <tr
                        className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedCallId(
                            expandedCallId === call.id ? null : call.id
                          )
                        }
                      >
                        <td className="p-3 whitespace-nowrap">
                          {fmtDate(call.started_at)}{' '}
                          <span className="text-muted-foreground">
                            {fmtTime(call.started_at)}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {fmtPhone(call.customer_number)}
                        </td>
                        <td className="p-3 tabular-nums">
                          {fmtDuration(call.duration_seconds)}
                        </td>
                        <td className="p-3 tabular-nums">
                          {fmtLatency(call.avg_latency)}
                        </td>
                        <td className="p-3">{call.turn_count}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              call.ended_reason === 'customer_ended_call' ||
                              call.ended_reason === 'agent_ended_call'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}
                          >
                            {call.ended_reason?.replace(/_/g, ' ') || 'unknown'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCall(call)
                              }}
                            >
                              <ChartBar size={14} />
                            </Button>
                            {expandedCallId === call.id ? (
                              <CaretUp size={14} className="text-muted-foreground mt-1" />
                            ) : (
                              <CaretDown size={14} className="text-muted-foreground mt-1" />
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded turn metrics */}
                      {expandedCallId === call.id && call.turns.length > 0 && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <div className="bg-muted/30 p-3 space-y-1.5">
                              {call.turns.map((turn) => (
                                <div
                                  key={turn.turn_id}
                                  className="flex items-center gap-4 text-[11px] py-1"
                                >
                                  <span className="font-medium w-16 shrink-0">
                                    {turn.turn_id}
                                  </span>
                                  {turn.stt_duration != null && (
                                    <span className="flex items-center gap-1">
                                      <Microphone size={10} className="text-blue-500" />
                                      {fmtMs(turn.stt_duration)}
                                    </span>
                                  )}
                                  {turn.llm_ttft != null && (
                                    <span className="flex items-center gap-1">
                                      <Brain size={10} className="text-purple-500" />
                                      {fmtMs(turn.llm_ttft)}
                                    </span>
                                  )}
                                  {turn.tts_ttfb != null && (
                                    <span className="flex items-center gap-1">
                                      <SpeakerHigh size={10} className="text-emerald-500" />
                                      {fmtMs(turn.tts_ttfb)}
                                    </span>
                                  )}
                                  {turn.eou_delay != null && (
                                    <span className="flex items-center gap-1">
                                      <Waveform size={10} className="text-amber-500" />
                                      {fmtMs(turn.eou_delay)}
                                    </span>
                                  )}
                                  <span className="text-muted-foreground truncate flex-1">
                                    {turn.user_transcript?.slice(0, 60)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {calls.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No calls found for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call Detail Slide-over */}
      {selectedCall && (
        <CallDetailPanel
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  )
}
