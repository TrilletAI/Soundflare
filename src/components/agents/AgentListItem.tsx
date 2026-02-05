import React, { JSX, useState } from 'react'
import Link from 'next/link'
import { 
  MoreHorizontal, 
  Copy, 
  Settings, 
  Clock, 
  BarChart3,
  Eye,
  Activity,
  Bot,
  Trash2,
  Play,
  Square,
  Loader2,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'

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

interface RunningAgent {
  agent_name: string
  pid: number
  status: string
}

interface AgentListItemProps {
  agent: Agent
  viewMode: 'grid' | 'list' | 'mobile'
  isSelected: boolean
  isCopied: boolean
  isLastItem: boolean
  projectId: string
  runningAgents?: RunningAgent[]
  isLoadingRunningAgents?: boolean
  onCopyId: (e: React.MouseEvent) => void
  onDelete: () => void
  onStartAgent?: (agent: Agent) => void
  onStopAgent?: (agentName: string) => void
  isStartingAgent?: boolean
  isStoppingAgent?: boolean
  isMobile?: boolean
}

const getAgentTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'livekit':
    case 'soundflare_agent':
      return <Activity className="w-4 h-4" />
    default:
      return <Bot className="w-4 h-4" />
  }
}

const formatDate = (dateString: string, isMobile: boolean = false) => {
  const date = new Date(dateString)
  if (isMobile) {
    return date.toLocaleDateString('en-US', {
      month: 'short', 
      day: 'numeric'
    })
  }
  return date.toLocaleDateString('en-US', {
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

const getEnvironmentBadgeColor = (environment: string) => {
  switch (environment.toLowerCase()) {
    case 'production':
    case 'prod':
      return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800'
    case 'staging':
    case 'stage':
      return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
    default:
      return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
  }
}

// Helper function to get agent running status
const getAgentRunningStatus = (agent: Agent, runningAgents?: RunningAgent[], isLoading?: boolean) => {
  if (agent.agent_type !== 'soundflare_agent') {
    return null
  }
  
  // Show loading state if data is being fetched
  if (isLoading) {
    return {
      isRunning: false,
      pid: null,
      status: 'loading'
    }
  }
  
  if (!runningAgents) {
    return {
      isRunning: false,
      pid: null,
      status: 'stopped'
    }
  }
  
  // Sanitize agent ID by replacing hyphens with underscores
  const sanitizedAgentId = agent.id.replace(/-/g, '_')
  
  // First try: Check with name_sanitizedAgentId format (new format)
  const newFormat = `${agent.name}_${sanitizedAgentId}`
  let runningAgent = runningAgents.find(ra => ra.agent_name === newFormat)
  
  // Second try: Check with just name (backward compatibility)
  if (!runningAgent) {
    runningAgent = runningAgents.find(ra => ra.agent_name === agent.name)
  }
  
  return runningAgent ? {
    isRunning: true,
    pid: runningAgent.pid,
    status: runningAgent.status,
    actualAgentName: runningAgent.agent_name
  } : {
    isRunning: false,
    pid: null,
    status: 'stopped'
  }
}

// Helper function to get status indicator
const getStatusIndicator = (agent: Agent, runningAgents?: RunningAgent[], size: 'sm' | 'md' = 'sm', isLoading?: boolean) => {
  const runningStatus = getAgentRunningStatus(agent, runningAgents, isLoading)
  const dotSize = size === 'md' ? 'w-3 h-3' : 'w-2 h-2'
  
  if (!runningStatus) {
    return (
      <div className={`${dotSize} rounded-full border border-white dark:border-neutral-900 bg-gray-300 dark:bg-neutral-600`}></div>
    )
  }
  
  if (runningStatus.status === 'loading') {
    return (
      <div className={`${dotSize} rounded-full border border-white dark:border-neutral-900 bg-gray-400 dark:bg-neutral-500`}></div>
    )
  }
  
  return (
    <div className={`${dotSize} rounded-full border border-white dark:border-neutral-900 ${
      runningStatus.isRunning ? 'bg-green-500' : 'bg-red-500'
    }`}></div>
  )
}

// Helper function to get status text
const getStatusText = (agent: Agent, runningAgents?: RunningAgent[], isLoading?: boolean) => {
  const runningStatus = getAgentRunningStatus(agent, runningAgents, isLoading)
  
  if (!runningStatus) {
    return 'Monitoring'
  }
  
  if (runningStatus.status === 'loading') {
    return 'Loading...'
  }
  
  return runningStatus.isRunning ? 'Running' : 'Stopped'
}

// Helper function to get status color
const getStatusColor = (agent: Agent, runningAgents?: RunningAgent[], isLoading?: boolean) => {
  const runningStatus = getAgentRunningStatus(agent, runningAgents, isLoading)
  
  if (!runningStatus) {
    return 'text-gray-500 dark:text-gray-400'
  }
  
  if (runningStatus.status === 'loading') {
    return 'text-gray-500 dark:text-gray-400'
  }
  
  return runningStatus.isRunning 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400'
}





const AgentListItem: React.FC<AgentListItemProps> = ({
  agent,
  viewMode,
  isSelected,
  isCopied,
  isLastItem,
  projectId,
  runningAgents,
  isLoadingRunningAgents,
  onCopyId,
  onDelete,
  onStartAgent,
  onStopAgent,
  isStartingAgent,
  isStoppingAgent,
  isMobile = false
}) => {
  const runningStatus = getAgentRunningStatus(agent, runningAgents, isLoadingRunningAgents)

  // Handler for start/stop actions
  const handleStartStop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isStartingAgent || isStoppingAgent) {
      return
    }
    
    if (runningStatus?.isRunning) {
      // Use the actualAgentName for stopping, asserting its type as string
      onStopAgent?.(runningStatus.actualAgentName as string)
    } else {
      // Pass the entire agent object for starting
      onStartAgent?.(agent)
    }
  }

  // Mobile-optimized view
  if (viewMode === 'mobile') {
    return (
      <Link href={`/${projectId}/agents/${agent.id}`} className="block">
        <div className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all duration-150 ${
          isSelected ? 'ring-2 ring-gray-400 border-neutral-400 dark:ring-gray-500 dark:border-neutral-500' : ''
        }`}>
          {/* Header with icon, name, and chevron */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center flex-shrink-0">
                {getAgentTypeIcon(agent.agent_type)}
              </div>
              <div className="absolute -bottom-1 -right-1">
                {getStatusIndicator(agent, runningAgents, 'md', isLoadingRunningAgents)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                  {agent.name}
                </h3>
                {agent.agent_type === 'soundflare_agent' && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 h-6">
                    Pype
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {agent.agent_type === 'livekit' ? 'LiveKit Agent' :
                 agent.agent_type === 'soundflare_agent' ? 'Pype Agent' : `${agent.agent_type} Agent`}
              </p>
            </div>
            
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          </div>

          {/* Status and environment row */}
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full ${getEnvironmentBadgeColor(agent.environment)}`}>
              {agent.environment}
            </span>
            
            <div className={`text-sm font-medium flex items-center gap-2 ${getStatusColor(agent, runningAgents, isLoadingRunningAgents)}`}>
              {agent.agent_type === 'soundflare_agent' && runningStatus && (
                <>
                  {isStartingAgent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isStoppingAgent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : runningStatus.status === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : runningStatus.isRunning ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </>
              )}
              <span>
                {isStartingAgent ? 'Starting...' : isStoppingAgent ? 'Stopping...' : getStatusText(agent, runningAgents, isLoadingRunningAgents)}
              </span>
            </div>
          </div>

          {/* Agent ID section */}
          <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Agent ID</div>
                <code className="text-sm text-gray-700 dark:text-gray-300 font-mono block truncate">
                  {agent.id}
                </code>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onCopyId(e)
                }}
                className="ml-2 w-10 h-10 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            {isCopied && (
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ Copied to clipboard
              </div>
            )}
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Created {formatDate(agent.created_at, true)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Quick actions for Pype agents */}
              {agent.agent_type === 'soundflare_agent' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartStop}
                  disabled={isStartingAgent || isStoppingAgent || isLoadingRunningAgents}
                  className="h-9 px-4 text-sm"
                >
                  {isStartingAgent || isStoppingAgent ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : runningStatus?.isRunning ? (
                    <Square className="w-4 h-4 mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isStartingAgent ? 'Starting' : isStoppingAgent ? 'Stopping' : 
                   runningStatus?.isRunning ? 'Stop' : 'Start'}
                </Button>
              )}
              
              {/* More options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">


                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                  }} className="text-sm py-3">
                    <Eye className="h-4 w-4 mr-3" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                  }} className="text-sm py-3">
                    <BarChart3 className="h-4 w-4 mr-3" />
                    Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${projectId}/agents/${agent.id}?tab=settings`} className="flex items-center w-full text-sm py-3 cursor-pointer">
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (!runningStatus?.isRunning) {
                        onDelete()
                      }
                    }} 
                    className={`text-red-600 dark:text-red-400 text-sm py-3 ${
                      runningStatus?.isRunning ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Trash2 className="h-4 w-4 mr-3" />
                    Remove Agent
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Show PID for running agents */}
          {!isStartingAgent && !isStoppingAgent && !isLoadingRunningAgents && runningStatus?.isRunning && runningStatus.pid && (
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">Process ID:</span> {runningStatus.pid}
              </div>
            </div>
          )}
        </div>
      </Link>
    )
  }

  // Desktop list view
  if (viewMode === 'list') {
    return (
      <Link href={`/${projectId}/agents/${agent.id}`} className="block">
        <div
          className={`group px-4 py-4 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors border-b border-neutral-100 dark:border-neutral-800 ${
            isLastItem ? '' : 'border-b'
          } ${isSelected ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="w-8 h-8 bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0 relative">
              {getAgentTypeIcon(agent.agent_type)}
              <div className="absolute -bottom-0.5 -right-0.5">
                {getStatusIndicator(agent, runningAgents, 'sm', isLoadingRunningAgents)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {agent.name}
                  </h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getEnvironmentBadgeColor(agent.environment)}`}>
                    {agent.environment}
                  </span>
                  {agent.agent_type === 'soundflare_agent' && (
                    <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                      Pype
                    </Badge>
                  )}
                </div>
                <div className={`text-sm font-medium flex items-center gap-2 ${getStatusColor(agent, runningAgents, isLoadingRunningAgents)}`}>
                  {agent.agent_type === 'soundflare_agent' && runningStatus && (
                    <>
                      {isStartingAgent ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isStoppingAgent ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : runningStatus.status === 'loading' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : runningStatus.isRunning ? (
                        <Play className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </>
                  )}
                  {isStartingAgent ? 'Starting...' : isStoppingAgent ? 'Stopping...' : getStatusText(agent, runningAgents, isLoadingRunningAgents)}
                  {!isStartingAgent && !isStoppingAgent && !isLoadingRunningAgents && runningStatus?.isRunning && runningStatus.pid && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (PID: {runningStatus.pid})
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs">ID: {agent.id.slice(0, 8)}...{agent.id.slice(-4)}</span>
                  <span className="text-xs">Created {formatDate(agent.created_at, isMobile)}</span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {agent.agent_type === 'soundflare_agent' && (
                      <>
                        <DropdownMenuItem 
                          onClick={handleStartStop}
                          disabled={isLoadingRunningAgents}
                          className="text-sm"
                        >
                          {runningStatus?.isRunning ? (
                            <>
                              <Square className="h-4 w-4 mr-2" />
                              Stop Agent
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Start Agent
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}


                    <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                          <Link href={`/${projectId}/agents/${agent.id}?tab=settings`} className="flex items-center w-full text-sm cursor-pointer">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Settings
                                          </Link>
                                        </DropdownMenuItem>                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onCopyId(e)
                    }} className="text-sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        if (!runningStatus?.isRunning) {
                          onDelete()
                        }
                      }} 
                      className={`text-red-600 dark:text-red-400 text-sm ${
                        runningStatus?.isRunning ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          {isCopied && (
            <div className="mt-2 ml-11">
              <p className="text-sm text-green-600 dark:text-green-400">✓ Copied!</p>
            </div>
          )}
        </div>
      </Link>
    )
  }

    // Desktop grid view

    return (

      <Link href={`/${projectId}/agents/${agent.id}`} className="block h-full">

        <div

          className={`group relative h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:shadow-lg dark:hover:shadow-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 flex flex-col ${

            isSelected ? 'ring-2 ring-gray-400 border-neutral-400 dark:ring-gray-500 dark:border-neutral-500' : ''

          }`}

        >

          <div className="p-5 flex-1 flex flex-col">

            {/* Header */}

            <div className="flex justify-between items-start mb-4">

              <div className="flex gap-3 min-w-0">

                <div className="w-10 h-10 bg-gray-50 dark:bg-neutral-800/50 rounded-lg flex items-center justify-center flex-shrink-0 border border-neutral-100 dark:border-neutral-800">

                  {getAgentTypeIcon(agent.agent_type)}

                </div>

                <div className="min-w-0 pt-0.5">

                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate pr-2">{agent.name}</h3>

                  <div className="flex items-center gap-2">

                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">

                      {agent.agent_type === 'soundflare_agent' ? 'Pype' : agent.agent_type.replace('_', ' ')}

                    </p>

                  </div>

                </div>

              </div>

              

              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium rounded-full ${getEnvironmentBadgeColor(agent.environment)}`}>

                {agent.environment}

              </span>

            </div>

  

            {/* Spacer */}

            <div className="flex-1" />

  

            {/* Status & Actions */}

            <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">

               <div className="flex items-center justify-between">

                  <div className={`flex items-center gap-2 text-xs font-medium ${getStatusColor(agent, runningAgents, isLoadingRunningAgents)}`}>

                     {getStatusIndicator(agent, runningAgents, 'sm', isLoadingRunningAgents)}

                     {isStartingAgent ? 'Starting...' : isStoppingAgent ? 'Stopping...' : getStatusText(agent, runningAgents, isLoadingRunningAgents)}

                  </div>

                  {runningStatus?.pid && (

                    <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-neutral-800 px-1.5 py-0.5 rounded">PID: {runningStatus.pid}</span>

                  )}

               </div>

  

               <div className="flex items-center justify-between">

                  <div 

                    className="flex items-center gap-1.5 group/id cursor-pointer py-1 px-1.5 -ml-1.5 rounded hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors" 

                    onClick={(e) => {

                      e.preventDefault()

                      e.stopPropagation()

                      onCopyId(e)

                    }}

                  >

                    <code className="text-[10px] text-gray-400 dark:text-gray-500 font-mono group-hover/id:text-gray-600 dark:group-hover/id:text-gray-300 transition-colors">

                      {agent.id.slice(0, 12)}...

                    </code>

                    <Copy className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover/id:opacity-100 transition-opacity" />

                    {isCopied && <span className="text-[10px] text-green-500">Copied!</span>}

                  </div>

  

                  <div className="flex items-center gap-1">

                     {agent.agent_type === 'soundflare_agent' && (

                        <Button

                          size="sm"

                          variant="ghost"

                          onClick={handleStartStop}

                          disabled={isLoadingRunningAgents}

                          className="h-7 px-2 text-xs hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400"

                        >

                          {runningStatus?.isRunning ? (

                            <Square className="w-3 h-3 fill-current" />

                          ) : (

                            <Play className="w-3 h-3 fill-current" />

                          )}

                        </Button>

                     )}

                     

                     <DropdownMenu>

                        <DropdownMenuTrigger asChild>

                          <Button

                            variant="ghost"

                            size="sm"

                            className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"

                            onClick={(e) => e.stopPropagation()}

                          >

                            <MoreHorizontal className="h-4 w-4" />

                          </Button>

                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">

                          {agent.agent_type === 'soundflare_agent' && (

                            <>

                              <DropdownMenuItem 

                                onClick={handleStartStop}

                                disabled={isLoadingRunningAgents}

                                className="text-xs"

                              >

                                {runningStatus?.isRunning ? (

                                  <>

                                    <Square className="h-3.5 w-3.5 mr-2" />

                                    Stop

                                  </>

                                ) : (

                                  <>

                                    <Play className="h-3.5 w-3.5 mr-2" />

                                    Start

                                  </>

                                )}

                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                            </>

                          )}

                          <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-xs">

                            <Eye className="h-3.5 w-3.5 mr-2" />

                            View

                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>

                            <Link href={`/${projectId}/agents/${agent.id}?tab=settings`} className="flex items-center w-full text-xs cursor-pointer">

                              <Settings className="h-3.5 w-3.5 mr-2" />

                              Settings

                            </Link>

                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={(e) => {

                            e.stopPropagation()

                            onCopyId(e)

                          }} className="text-xs">

                            <Copy className="h-3.5 w-3.5 mr-2" />

                            Copy ID

                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem 

                            onClick={(e) => {

                              e.stopPropagation()

                              e.preventDefault()

                              if (!runningStatus?.isRunning) {

                                onDelete()

                              }

                            }} 

                            className={`text-red-600 dark:text-red-400 text-xs ${

                              runningStatus?.isRunning ? 'opacity-50 cursor-not-allowed' : ''

                            }`}

                          >

                            <Trash2 className="h-3.5 w-3.5 mr-2" />

                            Remove

                          </DropdownMenuItem>

                        </DropdownMenuContent>

                     </DropdownMenu>

                  </div>

               </div>

            </div>

          </div>

        </div>

      </Link>

    )
}

export default AgentListItem