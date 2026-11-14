// src/app/[projectid]/analytics/page.tsx
'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PipelineAnalytics } from '@/components/analytics/PipelineAnalytics'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

function AnalyticsSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
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
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[280px] rounded-lg" />
        <Skeleton className="h-[280px] rounded-lg" />
      </div>
    </div>
  )
}

function AnalyticsContent() {
  const params = useParams()
  const searchParams = useSearchParams()

  const projectId = Array.isArray(params?.projectid)
    ? params.projectid[0]
    : (params?.projectid as string)

  // Agent can be specified via query param: ?agent_id=xxx
  const agentId = searchParams.get('agent_id') || ''

  if (!agentId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-20">
          <h2 className="text-lg font-semibold mb-2">Select an Agent</h2>
          <p className="text-sm text-muted-foreground">
            Navigate to an agent&apos;s page and click &quot;Pipeline Analytics&quot; to view
            latency and performance metrics.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Or append <code className="bg-muted px-1.5 py-0.5 rounded">?agent_id=YOUR_AGENT_ID</code> to
            this URL.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PipelineAnalytics agentId={agentId} />
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  )
}
