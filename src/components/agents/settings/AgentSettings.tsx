'use client'

import React, { useState, useEffect } from 'react'
import { 
  Bot, 
  Cpu, 
  Settings2, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import MetricsDialog from '@/components/MetricsDialog'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface AgentSettingsProps {
  agentId: string
  projectId: string
}

export default function AgentSettings({ agentId, projectId }: AgentSettingsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [autoReviewEnabled, setAutoReviewEnabled] = useState(true)
  const [agentMetrics, setAgentMetrics] = useState<any>({})
  const queryClient = useQueryClient()

  // Fetch agent data
  const { data: agents, isLoading, error, refetch } = useSupabaseQuery('soundflare_agents', {
    select: 'id, name, agent_type, configuration, environment, created_at, is_active, auto_review_enabled, metrics',
    filters: [{ column: 'id', operator: 'eq', value: agentId }]
  })

  const agent = agents?.[0]

  // Initialize state from fetched data
  useEffect(() => {
    if (agent) {
      setAutoReviewEnabled(agent.auto_review_enabled ?? true)
      setAgentMetrics(
        agent.metrics 
          ? (typeof agent.metrics === 'string' ? JSON.parse(agent.metrics) : agent.metrics) 
          : {}
      )
    }
  }, [agent])

  const handleAutoReviewToggle = async (enabled: boolean) => {
    // Optimistic update
    setAutoReviewEnabled(enabled)
    setIsSaving(true)

    try {
      const response = await fetch(`/api/agents/${agentId}/auto-review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })

      if (!response.ok) {
        throw new Error('Failed to update auto-review setting')
      }
      
      toast.success('Auto-review setting updated')
      // Invalidate queries to ensure consistency across the app
      queryClient.invalidateQueries({ queryKey: ['soundflare_agents'] })
    } catch (err) {
      console.error('Error updating auto-review:', err)
      // Revert on error
      setAutoReviewEnabled(!enabled)
      toast.error('Failed to update setting. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMetricsSave = async (metrics: any) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('soundflare_agents')
        .update({ metrics })
        .eq('id', agentId)

      if (error) throw error
      
      setAgentMetrics(metrics)
      queryClient.invalidateQueries({ queryKey: ['soundflare_agents'] })
      toast.success('Metrics configuration saved successfully')
    } catch (err: any) {
      console.error('Error saving metrics:', err)
      toast.error('Error saving metrics: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateAgent = async (updates: any) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Failed to update agent')
      
      queryClient.invalidateQueries({ queryKey: ['soundflare_agents'] })
      toast.success('Agent updated successfully')
    } catch (err) {
      console.error('Error updating agent:', err)
      toast.error('Failed to update agent settings.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {error?.message || 'Agent not found'}
        </p>
      </div>
    )
  }

  const enabledMetricsCount = Object.values(agentMetrics || {}).filter((m: any) => m.enabled).length

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage configuration and preferences for {agent.name}
        </p>
      </div>

      <div className="grid gap-6">
        {/* General Information Card */}
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-base font-semibold">General Information</CardTitle>
            </div>
            <CardDescription>Basic identification details for this agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Name</Label>
              <Input 
                value={agent.name} 
                onChange={(e) => handleUpdateAgent({ name: e.target.value })}
                onBlur={(e) => handleUpdateAgent({ name: e.target.value })} // Add generic update on blur if we want name editable
                // For now, let's just make Environment editable as requested
                disabled 
                className="bg-gray-50 dark:bg-neutral-900" 
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Environment</Label>
              <Select
                disabled={isSaving}
                value={agent.environment}
                onValueChange={(value) => handleUpdateAgent({ environment: value })}
              >
                <SelectTrigger className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Agent ID</Label>
              <div className="flex items-center gap-2">
                <Input value={agent.id} disabled className="font-mono text-xs bg-gray-50 dark:bg-neutral-900" />
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(agent.id)}>
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automation & Review Card */}
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-base font-semibold">Automation & Review</CardTitle>
            </div>
            <CardDescription>Configure how AI analyzes and processes calls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="auto-review" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Auto AI Review
                </Label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically analyze every call with AI upon completion.
                </span>
              </div>
              <Switch
                id="auto-review"
                checked={autoReviewEnabled}
                onCheckedChange={handleAutoReviewToggle}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quality Assurance / Metrics Card */}
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base font-semibold">Quality Assurance</CardTitle>
            </div>
            <CardDescription>Define the metrics used to evaluate call performance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Active Metrics</span>
                  <Badge variant="secondary" className="text-xs">{enabledMetricsCount} Enabled</Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Configure custom criteria for scoring calls.
                </p>
              </div>
              
              {/* Reuse the existing dialog logic via the component */}
              <MetricsDialog 
                initialMetrics={agentMetrics}
                onSave={handleMetricsSave}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
