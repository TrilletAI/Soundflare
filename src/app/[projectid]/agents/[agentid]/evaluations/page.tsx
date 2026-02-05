'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Plus,
  BarChart3,
  Search,
  Loader2,
  MoreVertical,
  Copy,
  Download,
  Trash2,
  Info,
  ChevronDown,
  ChevronLeft
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useCampaignsSSE } from '@/hooks/useEvaluationSSE'
import { useEvaluationCampaigns, useCreateCampaign } from '@/hooks/useEvaluations'

// Types
interface EvaluationCampaign {
  id: string
  name: string
  createdAt: string
  testCount: number
  status: 'running' | 'completed' | 'failed' | 'pending'
  completedCount: number
  avgScore: number | null
  notes?: string
}

function Evaluations() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectid as string
  const agentId = params.agentid as string

  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    testCount: '25',
    notes: ''
  })
  const [isInfoExpanded, setIsInfoExpanded] = useState(true)

  // Fetch campaigns using TanStack Query
  const { data: campaigns = [], isLoading: loading } = useEvaluationCampaigns(projectId, agentId)
  
  // Create campaign mutation
  const createMutation = useCreateCampaign()

  // Get running campaign IDs for SSE
  const runningCampaignIds = useMemo(() => 
    campaigns
      .filter(c => c.status === 'running' || c.status === 'pending')
      .map(c => c.id),
    [campaigns]
  )

  // Connect to SSE for real-time updates (only for running campaigns)
  useCampaignsSSE(projectId, agentId, runningCampaignIds)

  const filteredCampaigns = campaigns
    .filter(campaign =>
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: EvaluationCampaign['status'], completedCount?: number, testCount?: number) => {
    const statusConfig = {
      pending: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
      running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    }

    const labels = {
      pending: 'Pending',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed'
    }

    return (
      <Badge variant="outline" className={`${statusConfig[status]} text-xs`}>
        {labels[status]}
      </Badge>
    )
  }

  const getStatusDisplay = (status: EvaluationCampaign['status'], completedCount: number, testCount: number) => {
    if (status === 'running' || status === 'pending') {
      const progress = testCount > 0 ? (completedCount / testCount) * 100 : 0
      
      return (
        <div className="flex items-center gap-2 w-[100px]">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {completedCount}/{testCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )
    }
    
    return getStatusBadge(status, completedCount, testCount)
  }

  const handleCampaignClick = (campaignId: string) => {
    router.push(`/${projectId}/agents/${agentId}/evaluations/${campaignId}`)
  }

  const handleCreateCampaign = async () => {
    if (!createForm.name.trim()) {
      alert('Please enter a campaign name')
      return
    }

    try {
      await createMutation.mutateAsync({
        projectId,
        agentId,
        name: createForm.name.trim(),
        testCount: parseInt(createForm.testCount),
        notes: createForm.notes.trim() || undefined,
      })

      setIsCreateModalOpen(false)
      setCreateForm({ name: '', testCount: '25', notes: '' })

      // Show success message
      alert(`Evaluation campaign "${createForm.name}" started successfully with ${createForm.testCount} test cases!`)
    } catch (error: any) {
      console.error('Error creating campaign:', error)
      alert(error.message || 'Failed to create campaign')
    }
  }

  const handleDeleteCampaign = async (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this evaluation campaign?')) return

    try {
      setActionLoading(campaignId)
      // TODO: Implement delete mutation
      await new Promise(resolve => setTimeout(resolve, 500))
      // After implementing delete mutation, use: await deleteMutation.mutateAsync(campaignId)
    } catch (error) {
      alert('Failed to delete campaign')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicateCampaign = async (campaign: EvaluationCampaign, e: React.MouseEvent) => {
    e.stopPropagation()
    setCreateForm({
      name: `${campaign.name} (Copy)`,
      testCount: campaign.testCount.toString(),
      notes: campaign.notes || ''
    })
    setIsCreateModalOpen(true)
  }

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
        <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
        No evaluations yet
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4 max-w-sm">
        Run your first evaluation to test how your agent handles different caller behaviors.
      </p>
      <Button
        onClick={() => setIsCreateModalOpen(true)}
        className="bg-orange-500 hover:bg-orange-600 text-white"
        size="sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Campaign
      </Button>
    </div>
  )

  const handleBack = () => {
    router.push(`/${projectId}/agents/${agentId}?tab=overview`)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-neutral-900">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-xl transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                  Evaluations
                </h1>
              </div>
            </div>

            {/* Right: New Campaign button */}
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Subtitle */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Test your agent with simulated conversations
          </p>

      {/* Search */}
      {campaigns.length > 0 && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState />
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          No campaigns match your search.
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                  # Tests
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                  Score
                </th>
                <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">

                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredCampaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  onClick={() => handleCampaignClick(campaign.id)}
                  className="hover:bg-gray-50 dark:hover:bg-neutral-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {campaign.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(campaign.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {campaign.testCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusDisplay(campaign.status, campaign.completedCount, campaign.testCount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {campaign.avgScore !== null ? campaign.avgScore.toFixed(1) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={actionLoading === campaign.id}
                        >
                          {actionLoading === campaign.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => handleDuplicateCampaign(campaign, e as any)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteCampaign(campaign.id, e as any)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Campaign Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Evaluation Campaign</DialogTitle>
            <DialogDescription>
              Configure and launch a new evaluation run to test your agent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder='e.g. "Defiance stress test v1"'
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Number of Test Cases */}
            <div className="space-y-2">
              <Label htmlFor="test-count">Number of Test Cases</Label>
              <Select
                value={createForm.testCount}
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, testCount: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 (Quick Test)</SelectItem>
                  <SelectItem value="25">25 (Standard)</SelectItem>
                  <SelectItem value="50">50 (Comprehensive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any extra behavioral instructions for the simulated personas..."
                value={createForm.notes}
                onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Info Panel */}
            <Collapsible open={isInfoExpanded} onOpenChange={setIsInfoExpanded}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-full">
                  <Info className="w-4 h-4" />
                  <span>How defiance levels work</span>
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isInfoExpanded ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 p-3 bg-gray-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Each test case is assigned a random defiance level from a distribution:
                  </p>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="font-medium">Cooperative</span> – Answers everything
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      <span className="font-medium">Hesitant</span> – Needs coaxing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      <span className="font-medium">Evasive</span> – Dodges questions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="font-medium">Defiant</span> – Refuses requests
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-800"></span>
                      <span className="font-medium">Hostile</span> – Actively difficult
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    This tests how your agent handles varying caller behaviors.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={createMutation.isPending || !createForm.name.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Run Evaluation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  )
}

export default Evaluations
