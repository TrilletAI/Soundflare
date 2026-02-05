'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  projectId: string
}

const TEST_COUNT_OPTIONS = [
  { value: '10', label: 'Quick Test (10 cases)' },
  { value: '25', label: 'Standard (25 cases)' },
  { value: '50', label: 'Comprehensive (50 cases)' },
]

const DEFIANCE_LEVELS = [
  { name: 'Cooperative', description: 'Answers everything willingly', color: 'text-green-600 dark:text-green-400' },
  { name: 'Hesitant', description: 'Needs coaxing to share info', color: 'text-yellow-600 dark:text-yellow-400' },
  { name: 'Evasive', description: 'Dodges direct questions', color: 'text-orange-600 dark:text-orange-400' },
  { name: 'Defiant', description: 'Refuses certain requests', color: 'text-red-600 dark:text-red-400' },
  { name: 'Hostile', description: 'Actively difficult and confrontational', color: 'text-red-800 dark:text-red-300' },
]

function CreateCampaignModal({ isOpen, onClose, onSuccess, projectId }: CreateCampaignModalProps) {
  const [name, setName] = useState('')
  const [testCount, setTestCount] = useState('25')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDefianceInfo, setShowDefianceInfo] = useState(true)
  const [errors, setErrors] = useState<{ name?: string }>({})

  const validateForm = () => {
    const newErrors: { name?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Campaign name is required'
    } else if (name.trim().length < 3) {
      newErrors.name = 'Campaign name must be at least 3 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/evaluations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: name.trim(),
          testCount: parseInt(testCount),
          notes: notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create evaluation')
      }

      // Reset form
      setName('')
      setTestCount('25')
      setNotes('')
      setErrors({})

      onSuccess()
    } catch (error: any) {
      alert(error.message || 'Failed to create evaluation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setName('')
      setTestCount('25')
      setNotes('')
      setErrors({})
      onClose()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Evaluation Campaign</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              placeholder='e.g. "Defiance stress test v1"'
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors({ ...errors, name: undefined })
              }}
              className={errors.name ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Number of Test Cases */}
          <div className="space-y-2">
            <Label htmlFor="test-count">Number of Test Cases</Label>
            <Select value={testCount} onValueChange={setTestCount} disabled={isSubmitting}>
              <SelectTrigger id="test-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEST_COUNT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <span className="text-xs text-gray-500 dark:text-gray-400">(optional)</span>
            </div>
            <Textarea
              id="notes"
              placeholder="Add any extra behavioral instructions for the simulated personas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Defiance Levels Info Panel */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDefianceInfo(!showDefianceInfo)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  How defiance levels work
                </span>
              </div>
              {showDefianceInfo ? (
                <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </button>

            {showDefianceInfo && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Each test case is assigned a random defiance level from a distribution:
                </p>
                <ul className="space-y-2">
                  {DEFIANCE_LEVELS.map((level) => (
                    <li key={level.name} className="flex items-start gap-2 text-xs">
                      <span className={`font-medium ${level.color}`}>{level.name}</span>
                      <span className="text-gray-600 dark:text-gray-400">– {level.description}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-blue-600 dark:text-blue-300 pt-2 border-t border-blue-200 dark:border-blue-800">
                  This tests how your agent handles varying caller behaviors.
                </p>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              'Run Evaluation'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default CreateCampaignModal
