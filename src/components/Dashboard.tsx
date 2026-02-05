'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  ChevronLeft,
  Database,
  CalendarDays,
  Menu,
  X,
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react'
import Overview from './Overview'
import CallLogs from './calls/CallLogs'
import CampaignLogs from './campaigns/CampaignLogs'
import AgentSettings from './agents/settings/AgentSettings'
import { useSupabaseQuery } from '../hooks/useSupabase'
import FieldExtractorDialog from './FieldExtractorLogs'
import MetricsDialog from './MetricsDialog'
import { supabase } from '../lib/supabase'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import QuickStartGuide from './QuickStartGuide'
import { useMobile } from '@/hooks/use-mobile'

interface DashboardProps {
  agentId: string
}

interface DateRange {
  from: Date | undefined
  to?: Date | undefined
}

interface TrilletAgentDetails {
  _id: string;
  name: string;
  model?: string;
  environment?: string;
  // Add any other relevant fields you expect from the Trillet agent details endpoint
}

const ENHANCED_PROJECT_ID = '371c4bbb-76db-4c61-9926-bd75726a1cda'

const quickFilters = [
  { id: '1d', label: '1D', days: 1 },
  { id: '7d', label: '7D', days: 7 },
  { id: '30d', label: '30D', days: 30 }
]

// Date utility functions
const subDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

const formatDateISO = (date: Date) => {
  return date.toISOString().split('T')[0]
}

// Component for skeleton when agent data is loading
function AgentHeaderSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${isMobile ? 'h-6 w-32' : 'h-8 w-40'} bg-gray-200 dark:bg-neutral-700 rounded animate-pulse`}></div>
      <div className={`${isMobile ? 'h-5 w-16' : 'h-6 w-20'} bg-gray-200 dark:bg-neutral-700 rounded-full animate-pulse`}></div>
    </div>
  )
}

const Dashboard: React.FC<DashboardProps> = ({ agentId }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isMobile } = useMobile(768)

  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Date filter state - these work immediately, no loading needed
  const [quickFilter, setQuickFilter] = useState('7d')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date()
  })
  const [isCustomRange, setIsCustomRange] = useState(false)

  const activeTab = searchParams.get('tab') || 'overview'
  
  // Date range for API calls - works immediately
  const apiDateRange = React.useMemo(() => {
    if (isCustomRange && dateRange.from && dateRange.to) {
      return {
        from: formatDateISO(dateRange.from),
        to: formatDateISO(dateRange.to)
      }
    }
    
    const days = quickFilters.find(f => f.id === quickFilter)?.days || 7
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    return {
      from: formatDateISO(startDate),
      to: formatDateISO(endDate)
    }
  }, [quickFilter, dateRange, isCustomRange])

  // Data fetching - now happens in parallel with UI rendering
  const { data: agents, isLoading: agentLoadingSupabase, error: agentError, refetch: refetchAgent } = useSupabaseQuery('soundflare_agents', {
    select: 'id, name, agent_type, configuration, environment, created_at, is_active, project_id, field_extractor_prompt, field_extractor, metrics',
    filters: [{ column: 'id', operator: 'eq', value: agentId }]
  })

  const agent = agents?.[0]
  const [trilletAgentDetails, setTrilletAgentDetails] = useState<TrilletAgentDetails | null>(null);
  const [isLoadingTrilletAgent, setIsLoadingTrilletAgent] = useState(false);

  // Combined loading state
  const agentLoading = agentLoadingSupabase || isLoadingTrilletAgent;

  const { data: projects, isLoading: projectLoading } = useSupabaseQuery(
    'soundflare_projects',
    {
      select: 'id, name, description, environment, created_at, is_active',
      filters: agent?.project_id 
        ? [{ column: 'id', operator: 'eq', value: agent.project_id }]
        : [{ column: 'id', operator: 'eq', value: '00000000-0000-0000-0000-000000000000' }],
    }
  )

  const { data: callsCheck, isLoading: callsCheckLoading } = useSupabaseQuery(
    'soundflare_call_logs',
    {
      select: 'id',
      filters: agent?.id 
        ? [{ column: 'agent_id', operator: 'eq', value: agent.id }]
        : [{ column: 'agent_id', operator: 'eq', value: '00000000-0000-0000-0000-000000000000' }],
      limit: 1
    }
  )

  const showQuickStart = false
  
  const project = agent?.project_id ? projects?.[0] : null

  // Date filter handlers - work immediately
  const handleQuickFilter = (filterId: string) => {
    setQuickFilter(filterId)
    setIsCustomRange(false)
    
    const days = quickFilters.find(f => f.id === filterId)?.days || 7
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    setDateRange({ from: startDate, to: endDate })
    
    // Close mobile menu after selection
    if (isMobile) {
      setShowMobileMenu(false)
    }
  }

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range)
      setIsCustomRange(true)
      setQuickFilter('')
    }
  }

  const handleBack = () => {
    if (agent?.project_id) {
      router.push(`/${agent.project_id}/agents`)
    } else {
      router.push('/')
    }
  }

  const handleTabChange = useCallback((tab: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('tab', tab)
    const search = current.toString()
    const query = search ? `?${search}` : ""
    
    // Use the full path with projectId
    if (agent?.project_id) {
      router.push(`/${agent.project_id}/agents/${agentId}${query}`)
    }
    
    // Close mobile menu after tab change
    if (isMobile) {
      setShowMobileMenu(false)
    }
  }, [searchParams, agent?.project_id, agentId, router, isMobile])

  const getEnvironmentColor = (environment: string) => {
    switch (environment.toLowerCase()) {
      case 'production':
      case 'prod':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800'
      case 'staging':
      case 'stage':
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800'
      case 'development':
      case 'dev':
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800'
      default:
        return 'bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-neutral-100 dark:border-neutral-700'
    }
  }

  // Set default tab if none specified
  useEffect(() => {
    if (!searchParams.get('tab')) {
      handleTabChange('overview')
    }
  }, [searchParams, handleTabChange])

  const isEnhancedProject = agent?.project_id === ENHANCED_PROJECT_ID

  // Show tabs immediately - can be calculated without agent data
  const tabs = [
    { id: 'overview', label: 'Overview', icon: CalendarDays },
    { id: 'logs', label: 'Call Logs', icon: Database },
    // Only add campaign-logs if we know it's enhanced (will show when agent data loads)
    ...(isEnhancedProject ? [{ id: 'campaign-logs', label: 'Campaign Logs', icon: Database }] : []),
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  // Handle errors without blocking entire dashboard
  if (agentError) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-neutral-900">
        <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className={`${isMobile ? 'px-4 py-3' : 'px-8 py-3'}`}>
            <div className="flex items-center gap-4">
              <button onClick={handleBack} className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-xl transition-all duration-200`}>
                <ChevronLeft className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              </button>
              <div className={`${isMobile ? 'h-7' : 'h-8'} bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 rounded-lg flex items-center`}>
                <AlertCircle className={`${isMobile ? 'w-3 h-3 mr-1.5' : 'w-4 h-4 mr-2'}`} />
                <span className={isMobile ? 'text-xs' : 'text-sm'}>Agent not found</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className={`bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6 ${isMobile ? 'mx-4' : 'max-w-md'} text-center`}>
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
            </div>
            <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-gray-100 mb-2`}>Agent not found</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{agentError.message}</p>
            <Button onClick={handleBack} variant="outline" className="w-full border-neutral-200 dark:border-neutral-700">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-neutral-900">
      {/* Header - Mobile optimized */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className={`${isMobile ? 'px-4 py-3' : 'px-8 py-3'}`}>
          <div className="flex items-center justify-between">
            {/* Left: Navigation & Identity */}
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBack}
                className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-xl transition-all duration-200`}
              >
                <ChevronLeft className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              </button>
              
              <div className="flex items-center gap-3">
                {/* Agent name and badge - skeleton while loading */}
                {agentLoading ? (
                  <AgentHeaderSkeleton isMobile={isMobile} />
                ) : agent ? (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h1 className={`${isMobile ? 'text-lg max-w-[180px]' : 'text-2xl max-w-[250px]'} font-semibold text-gray-900 dark:text-gray-100 tracking-tight truncate cursor-default`}>
                            {agent.agent_type === 'trillet' && trilletAgentDetails 
                              ? trilletAgentDetails.name 
                              : agent.name}
                          </h1>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{agent.agent_type === 'trillet' && trilletAgentDetails ? trilletAgentDetails.name : agent.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex items-center gap-2">
                      {agent.agent_type === 'trillet' && trilletAgentDetails && (
                         <Badge className={`${isMobile ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1'} font-medium rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800`}>
                           Trillet
                         </Badge>
                      )}
                      <Badge className={`${isMobile ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1'} font-medium rounded-full ${getEnvironmentColor(agent.environment)}`}>
                        {trilletAgentDetails?.environment || agent.environment}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className={`${isMobile ? 'h-7' : 'h-8'} bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 rounded-lg flex items-center`}>
                    <AlertCircle className={`${isMobile ? 'w-3 h-3 mr-1.5' : 'w-4 h-4 mr-2'}`} />
                    <span className={isMobile ? 'text-xs' : 'text-sm'}>Agent not found</span>
                  </div>
                )}
              </div>

              {/* Tab Navigation */}
              {!isMobile && agent && (
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 rounded-xl p-1 ml-6">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                          activeTab === tab.id
                            ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: Controls or Mobile Menu Button */}
            {!showQuickStart && (
              <div className="flex items-center gap-4">
                {isMobile ? (
                  /* Mobile Menu Button */
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-xl transition-all"
                  >
                    {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </button>
                ) : (
                  /* Desktop Controls */
                  <>
                    {/* Period Filters */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Period</span>
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
                        {quickFilters.map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => handleQuickFilter(filter.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                              quickFilter === filter.id && !isCustomRange
                                ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-neutral-700/50'
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`px-4 py-2 text-sm font-medium rounded-lg border-neutral-200 dark:border-neutral-700 transition-all duration-200 ${
                              isCustomRange 
                                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30' 
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Custom
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-neutral-200 dark:border-neutral-700 shadow-xl rounded-xl" align="end">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={handleDateRangeSelect}
                            numberOfMonths={2}
                            className="rounded-xl"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Field Extractor & Metrics - skeleton while agent loading */}
                    <div className="flex gap-2">
                      {agentLoading ? (
                        <>
                          <div className="h-9 w-32 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
                          <div className="h-9 w-24 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
                        </>
                      ) : agent ? (
                        <>
                          {/* <FieldExtractorDialog
                            initialData={JSON.parse(agent?.field_extractor_prompt || '[]')}
                            isEnabled={!!agent?.field_extractor}
                            initiallyOpen={false}
                            onSave={async (data, enabled) => {
                              const { error } = await supabase
                                .from('soundflare_agents')
                                .update({ 
                                  field_extractor_prompt: JSON.stringify(data), 
                                  field_extractor: enabled 
                                })
                                .eq('id', agent.id)
                              if (!error) {
                                alert('Saved field extractor config.')
                                refetchAgent()
                              } else {
                                alert('Error saving config: ' + error.message)
                              }
                            }}
                          /> */}
                          <MetricsDialog
                            initialMetrics={agent?.metrics ? (typeof agent.metrics === 'string' ? JSON.parse(agent.metrics) : agent.metrics) : {}}
                            onSave={async (metrics) => {
                              const { error } = await supabase
                                .from('soundflare_agents')
                                .update({ metrics })
                                .eq('id', agent.id)
                              if (!error) {
                                alert('Saved metrics config.')
                                refetchAgent()
                              } else {
                                alert('Error saving metrics: ' + error.message)
                              }
                            }}
                          />
                        </>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobile && showMobileMenu && !showQuickStart && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
            <div className="px-4 py-3 space-y-3">
              {/* Tab Navigation */}
              {agent && (
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Sections</div>
                  <div className="space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            handleTabChange(tab.id)
                            setShowMobileMenu(false)
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            activeTab === tab.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border border-neutral-200 dark:border-neutral-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Period Filters */}
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Period</div>
                <div className="flex flex-wrap gap-2">
                  {quickFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => handleQuickFilter(filter.id)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        quickFilter === filter.id && !isCustomRange
                          ? 'bg-orange-500 text-white'
                          : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border border-neutral-200 dark:border-neutral-600'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                          isCustomRange
                            ? 'bg-orange-500 text-white'
                            : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border border-neutral-200 dark:border-neutral-600'
                        }`}
                      >
                        <CalendarDays className="h-3 w-3" />
                        Custom
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateRangeSelect}
                        numberOfMonths={1}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Field Extractor for mobile */}
              {/* {agent && (
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Tools</div>
                  <FieldExtractorDialog
                    initialData={JSON.parse(agent?.field_extractor_prompt || '[]')}
                    isEnabled={!!agent?.field_extractor}
                    initiallyOpen={false}
                    onSave={async (data, enabled) => {
                      const { error } = await supabase
                        .from('soundflare_agents')
                        .update({ field_extractor_prompt: JSON.stringify(data), field_extractor: enabled })
                        .eq('id', agent.id)
                      if (!error) {
                        alert('Saved field extractor config.')
                        refetchAgent()
                      } else {
                        alert('Error saving config: ' + error.message)
                      }
                    }}
                  />
                </div>
              )} */}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showQuickStart ? (
          <QuickStartGuide agentId={agentId} />
        ) : (
                    <>
                      {/* Conditionally render tabs to prevent background processing and layout issues */}
                      {activeTab === 'overview' && (
                        <div className="h-full">
                          <Overview 
                            project={project} 
                            agent={agent}
                            dateRange={apiDateRange}
                            quickFilter={quickFilter}
                            isCustomRange={isCustomRange}
                            isLoading={agentLoading || projectLoading}
                          />
                        </div>
                      )}
                      
                      {activeTab === 'logs' && agent && (
                        <div className="h-full">
                          <CallLogs 
                            project={project} 
                            agent={agent} 
                            onBack={handleBack}
                            isLoading={agentLoading || projectLoading || callsCheckLoading}
                          />
                        </div>
                      )}
                      
                      {isEnhancedProject && activeTab === 'campaign-logs' && (
                        <div className="h-full">
                          <CampaignLogs 
                            project={project} 
                            agent={agent} 
                            onBack={handleBack}
                            isLoading={agentLoading || projectLoading}
                          />
                        </div>
                      )}
                      
                      {activeTab === 'settings' && agent && (
                        <div className="h-full overflow-y-auto">
                          <AgentSettings 
                            agentId={agentId} 
                            projectId={agent.project_id} 
                          />
                        </div>
                      )}
                    </>        )}
      </div>
    </div>
  )
}

export default Dashboard