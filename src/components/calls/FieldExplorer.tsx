'use client'

import React, { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  ChevronRight,
  ChevronDown,
  Database,
  Tag,
  FileText,
  BarChart3,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FieldInfo {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  path: string
  sampleValues?: any[]
  count?: number
  uniqueCount?: number
  category: 'basic' | 'metadata' | 'transcription' | 'metrics' | 'telemetry'
}

interface FieldExplorerProps {
  fields: FieldInfo[]
  visibleFields: string[]
  onFieldToggle: (fieldPath: string) => void
  onAddFilter: (fieldPath: string, fieldType: string) => void
  className?: string
}

const CATEGORY_CONFIG = {
  basic: {
    label: 'Basic Fields',
    icon: Database,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20'
  },
  metadata: {
    label: 'Metadata',
    icon: Tag,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20'
  },
  transcription: {
    label: 'Transcription Metrics',
    icon: FileText,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20'
  },
  metrics: {
    label: 'Metrics',
    icon: BarChart3,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20'
  },
  telemetry: {
    label: 'Telemetry',
    icon: BarChart3,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-neutral-950/20'
  }
}

const TYPE_ICONS = {
  string: '📝',
  number: '🔢',
  boolean: '✓',
  date: '📅',
  object: '{}',
  array: '[]'
}

const FieldExplorer: React.FC<FieldExplorerProps> = ({
  fields,
  visibleFields,
  onFieldToggle,
  onAddFilter,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([]) // Start with all categories collapsed
  )

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped = fields.reduce((acc, field) => {
      if (!acc[field.category]) {
        acc[field.category] = []
      }
      acc[field.category].push(field)
      return acc
    }, {} as Record<string, FieldInfo[]>)

    // Sort fields within each category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name))
    })

    return grouped
  }, [fields])

  // Filter fields based on search
  const filteredFields = useMemo(() => {
    if (!searchQuery) return fieldsByCategory

    const query = searchQuery.toLowerCase()
    const filtered: Record<string, FieldInfo[]> = {}

    Object.entries(fieldsByCategory).forEach(([category, categoryFields]) => {
      const matchingFields = categoryFields.filter(field =>
        field.name.toLowerCase().includes(query) ||
        field.path.toLowerCase().includes(query) ||
        field.type.toLowerCase().includes(query)
      )

      if (matchingFields.length > 0) {
        filtered[category] = matchingFields
      }
    })

    return filtered
  }, [fieldsByCategory, searchQuery])

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const isFieldVisible = (fieldPath: string) => visibleFields.includes(fieldPath)

  const handleShowAll = (category: string) => {
    // Prevent event bubbling
    const fieldsToToggle = fieldsByCategory[category]?.filter(field => !isFieldVisible(field.path)) || []
    fieldsToToggle.forEach(field => {
      onFieldToggle(field.path)
    })
  }

  const handleHideAll = (category: string) => {
    // Prevent event bubbling
    const fieldsToToggle = fieldsByCategory[category]?.filter(field => isFieldVisible(field.path)) || []
    fieldsToToggle.forEach(field => {
      onFieldToggle(field.path)
    })
  }

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Database className="h-4 w-4" />
          Field Explorer
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-2 mt-3 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {fields.length} fields
          </Badge>
          <Badge variant="outline" className="text-xs">
            {visibleFields.length} visible
          </Badge>
        </div>
      </div>

      {/* Fields List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {Object.entries(filteredFields).map(([category, categoryFields]) => {
            const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]
            const Icon = config.icon
            const isExpanded = expandedCategories.has(category)
            const visibleCount = categoryFields.filter(f => isFieldVisible(f.path)).length

            return (
              <div key={category} className="mb-2">
                {/* Category Header */}
                <div className="group">
                  <button
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors",
                      config.bgColor
                    )}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", config.color)} />
                    <span className="text-xs font-medium flex-1 text-left">
                      {config.label}
                    </span>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {categoryFields.length}
                    </Badge>
                  </button>

                  {/* Quick Actions - Show on hover */}
                  {isExpanded && (
                    <div className="flex gap-1 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShowAll(category)
                        }}
                        className="h-6 text-xs px-2"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Show all
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleHideAll(category)
                        }}
                        className="h-6 text-xs px-2"
                      >
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hide all
                      </Button>
                    </div>
                  )}
                </div>

                {/* Fields */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {categoryFields.map((field) => {
                      const visible = isFieldVisible(field.path)

                      return (
                        <div
                          key={field.path}
                          className={cn(
                            "group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer",
                            visible && "bg-muted/30"
                          )}
                        >
                          {/* Field Info */}
                          <div
                            className="flex items-center gap-2 flex-1 min-w-0"
                            onClick={() => onFieldToggle(field.path)}
                          >
                            <span className="text-xs flex-shrink-0">
                              {TYPE_ICONS[field.type] || '📄'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">
                                {field.name}
                              </div>
                              {field.uniqueCount !== undefined && (
                                <div className="text-[10px] text-muted-foreground">
                                  {field.uniqueCount} unique
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onAddFilter(field.path, field.type)
                              }}
                              className="h-6 w-6 p-0"
                              title="Add filter"
                            >
                              <Filter className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onFieldToggle(field.path)
                              }}
                              className="h-6 w-6 p-0"
                              title={visible ? "Hide column" : "Show column"}
                            >
                              {visible ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Empty State */}
          {Object.keys(filteredFields).length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No fields found</p>
              {searchQuery && (
                <p className="text-xs mt-1">Try a different search term</p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default FieldExplorer
