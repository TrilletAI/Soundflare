'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BookmarkIcon,
  ChevronDown,
  Plus,
  Trash2,
  Edit,
  Eye,
  Share2,
  Star
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { FilterGroup } from './AdvancedFilter'

export interface SavedView {
  id: string
  agent_id: string
  name: string
  filters: FilterGroup[]
  visible_columns: {
    basic: string[]
    metadata: string[]
    transcription_metrics: string[]
    metrics: string[]
  }
  created_at: string
  updated_at: string
}

interface SavedViewsProps {
  agentId: string
  currentFilters: FilterGroup[]
  currentColumns: {
    basic: string[]
    metadata: string[]
    transcription_metrics: string[]
    metrics: string[]
  }
  onLoadView: (view: SavedView) => void
  className?: string
}

const SavedViews: React.FC<SavedViewsProps> = ({
  agentId,
  currentFilters,
  currentColumns,
  onLoadView,
  className
}) => {
  const [views, setViews] = useState<SavedView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [viewName, setViewName] = useState('')
  const [editingView, setEditingView] = useState<SavedView | null>(null)

  const loadViews = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('soundflare_agent_call_log_views')
        .select('*')
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setViews(data || [])
    } catch (error) {
      console.error('Error loading saved views:', error)
    } finally {
      setIsLoading(false)
    }
  }, [agentId])

  // Load saved views on mount
  useEffect(() => {
    loadViews()
  }, [loadViews])

  const handleSaveView = async () => {
    if (!viewName.trim()) return

    try {
      const viewData = {
        agent_id: agentId,
        name: viewName,
        filters: currentFilters,
        visible_columns: currentColumns,
        updated_at: new Date().toISOString()
      }

      if (editingView) {
        // Update existing view
        const { error } = await supabase
          .from('soundflare_agent_call_log_views')
          .update(viewData)
          .eq('id', editingView.id)

        if (error) throw error
      } else {
        // Create new view
        const { error } = await supabase
          .from('soundflare_agent_call_log_views')
          .insert([viewData])

        if (error) throw error
      }

      setIsSaveDialogOpen(false)
      setViewName('')
      setEditingView(null)
      loadViews()
    } catch (error) {
      console.error('Error saving view:', error)
      alert('Failed to save view: ' + (error as Error).message)
    }
  }

  const handleDeleteView = async (viewId: string) => {
    if (!confirm('Are you sure you want to delete this view?')) return

    try {
      const { error } = await supabase
        .from('soundflare_agent_call_log_views')
        .delete()
        .eq('id', viewId)

      if (error) throw error
      loadViews()
    } catch (error) {
      console.error('Error deleting view:', error)
      alert('Failed to delete view')
    }
  }

  const handleEditView = (view: SavedView) => {
    setEditingView(view)
    setViewName(view.name)
    setIsSaveDialogOpen(true)
  }

  const openSaveDialog = () => {
    setEditingView(null)
    setViewName('')
    setIsSaveDialogOpen(true)
  }

  const getViewSummary = (view: SavedView) => {
    const filterCount = view.filters.reduce((sum, group) => sum + group.filters.length, 0)
    const columnCount = Object.values(view.visible_columns).reduce(
      (sum, cols) => sum + cols.length,
      0
    )
    return `${filterCount} filters, ${columnCount} columns`
  }

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <BookmarkIcon className="h-3 w-3" />
              <span>Saved Views</span>
              {views.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 rounded-full p-0 px-1 text-xs">
                  {views.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* Save Current View */}
            <DropdownMenuItem onClick={openSaveDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Save Current View</span>
            </DropdownMenuItem>

            {views.length > 0 && (
              <>
                <DropdownMenuSeparator />

                {/* Saved Views List */}
                <div className="max-h-64 overflow-y-auto">
                  {views.map((view) => (
                    <div
                      key={view.id}
                      className="group relative px-2 py-1.5 hover:bg-muted/50 rounded-sm"
                    >
                      <button
                        onClick={() => onLoadView(view)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start gap-2">
                          <Eye className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {view.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getViewSummary(view)}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Action Buttons */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditView(view)
                          }}
                          className="h-6 w-6 p-0"
                          title="Edit view"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteView(view.id)
                          }}
                          className="h-6 w-6 p-0 text-destructive"
                          title="Delete view"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Empty State */}
            {views.length === 0 && !isLoading && (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                <BookmarkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No saved views yet</p>
                <p className="text-xs mt-1">Save your current filters and columns</p>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Save View Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingView ? 'Update View' : 'Save Current View'}
            </DialogTitle>
            <DialogDescription>
              {editingView
                ? 'Update the name of this saved view'
                : 'Give your current filters and column configuration a name'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="view-name" className="text-sm font-medium">
                View Name
              </label>
              <Input
                id="view-name"
                placeholder="e.g., Failed Calls Analysis"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveView()
                }}
                autoFocus
              />
            </div>

            {/* Current Configuration Summary */}
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <div className="font-medium">Current Configuration:</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  • {currentFilters.reduce((sum, g) => sum + g.filters.length, 0)} active filters
                </div>
                <div>
                  • {Object.values(currentColumns).reduce((sum, cols) => sum + cols.length, 0)} visible columns
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSaveDialogOpen(false)
                setViewName('')
                setEditingView(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveView} disabled={!viewName.trim()}>
              {editingView ? 'Update' : 'Save'} View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default SavedViews
