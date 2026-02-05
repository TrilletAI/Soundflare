// src/components/agents/AgentSelect/AgentSelection.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, X, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSupabaseQuery } from '../../../hooks/useSupabase'
import AgentToolbar from './AgentToolbar'
import AgentList from '../AgentList'
import AgentDeleteDialog from '../AgentDeleteDialog'
import AdaptiveTutorialEmptyState from './EmptyStates/AdaptiveTutorialEmptyState'
import Header from '../../shared/Header'
import AgentCreationDialog from '../AgentCreation/AgentCreationDialog'
import AgentSelectionSkeleton from './AgentSelectionSkeleton'
import AgentEmptyStates from './EmptyStates/AgentEmptyStates'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useMobile } from '@/hooks/use-mobile'
import { UserPermissionsProvider, useInvalidateUserPermissions } from '@/contexts/UserPermissionsContext'

interface Agent {
  id: string
  name: string
  agent_type: string
  configuration: any
  environment: string
  created_at: string
  is_active: boolean
  project_id: string
  auto_review_enabled?: boolean
}



const AgentSelectionContent: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [initialFlow, setInitialFlow] = useState<'choice' | 'create' | 'connect'>('choice')
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Agent | null>(null)
  const [copiedAgentId, setCopiedAgentId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [breadcrumb, setBreadcrumb] = useState<{
    project?: string;
    item?: string;
  }>({
    project: '',
    item: ''
  })
  // const router = useRouter()

  const invalidatePermissions = useInvalidateUserPermissions()

  const { isMobile } = useMobile(768)

  // Fetch project data
  const { data: projects, isLoading: projectLoading, error: projectError } = useSupabaseQuery('soundflare_projects', {
    select: 'id, name, description, environment, created_at, is_active, plans',
    filters: [{ column: 'id', operator: 'eq', value: projectId }]
  })

  const project = projects?.[0]

  useEffect(() => {
    if (projectId && project) {
      setBreadcrumb({
        project: project.name,
        item: 'Monitoring'
      })
    }
  }, [projectId, project])

  // Fetch agents data
  const { data: agents, isLoading: agentsLoading, error: agentsError, refetch } = useSupabaseQuery('soundflare_agents', {
    select: 'id, name, agent_type, configuration, environment, created_at, is_active, project_id, auto_review_enabled',
    filters: [
      { column: 'project_id', operator: 'eq', value: projectId }
    ],
    orderBy: { column: 'created_at', ascending: sortOrder === 'asc' }
  })

  const handleCreateAgent = () => {
    setInitialFlow('create')
    setShowCreateDialog(true)
    setShowHelpDialog(false)
  }

  const handleConnectAgent = () => {
    setInitialFlow('connect')
    setShowCreateDialog(true)
    setShowHelpDialog(false)
  }

  const handleShowHelp = () => {
    setShowHelpDialog(true)
  }

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  const handleAgentCreated = (agentData: any) => {
    refetch()
    if (agentData.agent_type === 'soundflare_agent') {
      invalidatePermissions(projectId)
    }
  }

  const handleDeleteAgent = async (agent: Agent) => {
    setDeletingAgent(agent.id)
    try {
      // If this is a Trillet agent with monitoring, unregister from middleware first
      if (agent.agent_type === 'trillet' && agent.configuration?.trilletAgentId) {
        try {
          const trilletApiKey = agent.configuration?.trilletApiKey
          const trilletWorkspaceId = agent.configuration?.trilletWorkspaceId
          
          if (trilletApiKey && trilletWorkspaceId) {
            // First, find the pathway ID using the soundflare agent ID
            const middlewareUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
            const pathwayLookupResponse = await fetch(
              `${middlewareUrl}/v1/api/call-flows/pathway-by-soundflare/${agent.id}`,
              {
                headers: {
                  'x-api-key': trilletApiKey,
                  'x-workspace-id': trilletWorkspaceId,
                },
              }
            )

            if (pathwayLookupResponse.ok) {
              const pathwayData = await pathwayLookupResponse.json()
              const pathwayId = pathwayData.pathwayId

              // Now unregister the monitoring agent from the pathway
              const unregisterResponse = await fetch(
                `${middlewareUrl}/v1/api/call-flows/unregister-soundflare/${pathwayId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': trilletApiKey,
                    'x-workspace-id': trilletWorkspaceId,
                  },
                }
              )

              if (unregisterResponse.ok) {
                console.log('✅ Monitoring agent unregistered from middleware successfully')
              } else {
                console.warn('⚠️ Failed to unregister monitoring agent from middleware, continuing with deletion')
              }
            } else {
              console.warn('⚠️ Could not find pathway for soundflare agent, continuing with deletion')
            }
          }
        } catch (error_) {
          console.error('Error unregistering from middleware:', error_)
          console.warn('⚠️ Middleware unregistration failed, continuing with deletion')
        }
      }

      // Delete the agent from the local database
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove monitoring')
      }
  
      refetch()
      setShowDeleteConfirm(null)
      
      if (agent.agent_type === 'soundflare_agent') {
        invalidatePermissions(projectId) // Pass projectId
      }
    } catch (error: unknown) {
      console.error('Error removing monitoring:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove monitoring'
      alert(`Failed to remove monitoring: ${errorMessage}`)
    } finally {
      setDeletingAgent(null)
    }
  }

  const handleCopyAgentId = async (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(agentId)
      setCopiedAgentId(agentId)
      setTimeout(() => setCopiedAgentId(null), 2000)
    } catch (err) {
      console.error('Failed to copy monitoring ID:', err)
    }
  }

  // Filter agents based on search and status
  const filteredAgents = (agents || []).filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.agent_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && agent.is_active) ||
      (statusFilter === 'inactive' && !agent.is_active)
    
    return matchesSearch && matchesStatus
  })

  const loading = projectLoading || agentsLoading
  const error = projectError || agentsError

  if (loading) {
    return <AgentSelectionSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <Header breadcrumb={breadcrumb} />
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-5 max-w-sm">
            <div className="w-14 h-14 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-red-400 dark:text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Unable to Load Monitoring</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{error.message}</p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <main className={`max-w-6xl mx-auto py-6 ${isMobile ? 'px-4' : 'px-8 py-8'}`}>
        <AgentToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateAgent={handleCreateAgent}
          onConnectAgent={handleConnectAgent}
          onShowHelp={filteredAgents.length > 0 ? handleShowHelp : undefined}
          sortOrder={sortOrder}
          onSortToggle={handleSortToggle}
        />

        {filteredAgents.length > 0 ? (
          <AgentList
            agents={filteredAgents}
            viewMode={viewMode}
            selectedAgent={selectedAgent}
            copiedAgentId={copiedAgentId}
            projectId={projectId}
            onCopyAgentId={handleCopyAgentId}
            onDeleteAgent={setShowDeleteConfirm}
          />
        ) : (
          <AgentEmptyStates
            searchQuery={searchQuery}
            totalAgents={agents?.length || 0}
            onClearSearch={() => setSearchQuery('')}
            onCreateAgent={() => {
              setInitialFlow('choice')
              setShowCreateDialog(true)
            }}
          />
        )}
      </main>

      {/* Dialogs */}
      <AgentCreationDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onAgentCreated={handleAgentCreated}
        projectId={projectId}
        initialFlow={initialFlow}
      />

      <AgentDeleteDialog
        agent={showDeleteConfirm}
        isDeleting={deletingAgent !== null}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDeleteAgent}
      />

      {/* Help Sheet - Slide-out from right */}
      {showHelpDialog && (
        <>
          {/* Overlay */}
          <Sheet open={showHelpDialog} onOpenChange={setShowHelpDialog}>
            <SheetContent 
              side="right" 
              className="min-w-3/4 p-0 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800"
            >
              <SheetHeader className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800">
                <SheetTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Integration Guide
                </SheetTitle>
                <SheetDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Add monitoring to your voice agents
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto">
                <AdaptiveTutorialEmptyState
                  searchQuery=""
                  totalAgents={agents?.length || 0}
                  onClearSearch={() => {}}
                  onCreateAgent={() => {
                    setShowHelpDialog(false)
                    setInitialFlow('choice')
                    setShowCreateDialog(true)
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )
}

const AgentSelection = () => {
  const params = useParams()
  const projectId = params.projectid as string
  return (
      <AgentSelectionContent projectId={projectId} />
  )
}

export default AgentSelection