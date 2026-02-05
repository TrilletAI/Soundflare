'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Loader2,
  Eye,
  ChevronLeft
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { useCampaignSSE } from '@/hooks/useEvaluationSSE'
import { useEvaluationCampaign } from '@/hooks/useEvaluations'

// Types
type DefianceLevel = 'cooperative' | 'hesitant' | 'evasive' | 'defiant' | 'hostile'

interface TranscriptMessage {
  role: 'agent' | 'caller'
  content: string
}

interface TestCase {
  id: string
  testNumber: number
  roomName: string
  defianceLevel: DefianceLevel
  expectedBehavior: string | null
  score: number | null
  transcript: TranscriptMessage[]
  reasoning: string | null
  timestamp: number | null
  createdAt: string
}

interface EvaluationCampaign {
  id: string
  name: string
  createdAt: string
  testCount: number
  status: 'running' | 'completed' | 'failed' | 'pending'
  completedCount: number
  avgScore: number | null
  notes?: string
  testCases: TestCase[]
}

// Defiance badge configuration
const defianceConfig: Record<DefianceLevel, { label: string; className: string }> = {
  cooperative: {
    label: 'Cooperative',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
  },
  hesitant: {
    label: 'Hesitant',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
  },
  evasive: {
    label: 'Evasive',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
  },
  defiant: {
    label: 'Defiant',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
  },
  hostile: {
    label: 'Hostile',
    className: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-300 dark:border-red-700'
  }
}

function EvaluationResults() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectid as string
  const agentId = params.agentid as string
  const evaluationId = params.id as string

  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)

  // Fetch campaign details using TanStack Query
  const { data: campaign, isLoading: loading } = useEvaluationCampaign(projectId, agentId, evaluationId)

  // Connect to SSE for real-time updates (only if campaign is running)
  const shouldConnectSSE = campaign?.status === 'running' || campaign?.status === 'pending'
  useCampaignSSE(projectId, agentId, shouldConnectSSE ? evaluationId : null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: EvaluationCampaign['status']) => {
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
        {status === 'running' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
        {labels[status]}
      </Badge>
    )
  }

  const handleViewTranscript = (testCase: TestCase) => {
    setSelectedTestCase(testCase)
    setIsTranscriptOpen(true)
  }

  const backPath = `/${projectId}/agents/${agentId}/evaluations`

  const handleBack = () => {
    router.push(backPath)
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-neutral-900">
        <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className="px-8 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-xl transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="h-8 w-48 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-neutral-900">
        <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className="px-8 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-xl transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                Evaluation Results
              </h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Campaign not found</p>
            <Button variant="outline" className="mt-4" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Evaluations
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-neutral-900">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="px-8 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-xl transition-all duration-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                {campaign.name}
              </h1>
              {getStatusBadge(campaign.status)}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Campaign Info */}
          <div className="flex items-center gap-3 mb-6 text-sm text-gray-500 dark:text-gray-400">
            <span>{formatDate(campaign.createdAt)}</span>
            <span>·</span>
            <span>
              {campaign.status === 'running' 
                ? `${campaign.completedCount} / ${campaign.testCount} completed`
                : `${campaign.testCount} tests`
              }
            </span>
            {campaign.avgScore !== null && (
              <>
                <span>·</span>
                <span>Avg Score: <span className="font-medium text-gray-900 dark:text-gray-100">{campaign.avgScore.toFixed(1)}</span></span>
              </>
            )}
          </div>

          {/* Results Table */}
          {campaign.testCases.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Waiting for results...
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                  The evaluation is running. Results will appear here as they are completed.
                </p>
              </div>
            </div>
          ) : (
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                ID
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                Defiance
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                Transcript
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {campaign.testCases.map((testCase) => (
              <tr
                key={testCase.id}
                className="hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    {String(testCase.testNumber).padStart(3, '0')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`${defianceConfig[testCase.defianceLevel as DefianceLevel]?.className || 'bg-gray-100 text-gray-700'} text-xs`}>
                    {defianceConfig[testCase.defianceLevel as DefianceLevel]?.label || testCase.defianceLevel}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewTranscript(testCase as TestCase)}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View transcript
                  </Button>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {testCase.score === null ? '—' : testCase.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
          )}

      {/* Transcript Viewer Sheet */}
      <Sheet open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <SheetTitle className="text-base">
                Test #{selectedTestCase?.testNumber.toString().padStart(3, '0')}
              </SheetTitle>
              {selectedTestCase && (
                <Badge variant="outline" className={`${defianceConfig[selectedTestCase.defianceLevel as DefianceLevel]?.className || 'bg-gray-100 text-gray-700'} text-xs`}>
                  {defianceConfig[selectedTestCase.defianceLevel as DefianceLevel]?.label || selectedTestCase.defianceLevel}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {/* Transcript Content */}
          <div className="py-4 space-y-4">
            {selectedTestCase?.transcript.map((message) => (
              <div
                key={`${message.role}-${message.content.substring(0, 20)}`}
                className={`flex flex-col ${message.role === 'agent' ? 'items-start' : 'items-end'}`}
              >
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {message.role === 'agent' ? 'Agent' : 'Caller'}
                </span>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'agent'
                      ? 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* Evaluation Details */}
          {selectedTestCase && (selectedTestCase.score !== null || selectedTestCase.reasoning) && (
            <div className="pb-4 space-y-3 border-t border-neutral-200 dark:border-neutral-700 pt-4">
              {selectedTestCase.score !== null && (
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Score: </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedTestCase.score} / 10
                  </span>
                </div>
              )}
              
              {selectedTestCase.reasoning && (
                <div className="text-sm">
                  <div className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                    AI Reasoning:
                  </div>
                  <div className="bg-gray-50 dark:bg-neutral-900/50 rounded-lg p-3 text-gray-700 dark:text-gray-300 border border-neutral-200 dark:border-neutral-700">
                    {selectedTestCase.reasoning}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <SheetFooter className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button variant="outline" onClick={() => setIsTranscriptOpen(false)} className="w-full">
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
        </div>
      </div>
    </div>
  )
}

export default EvaluationResults
