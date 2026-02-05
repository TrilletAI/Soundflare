'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Search,
  X,
  Clock,
  Sparkles,
  ChevronDown,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchQuery {
  text: string
  fields: string[]
  caseSensitive: boolean
  exactMatch: boolean
}

export interface QuickFilter {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  query: SearchQuery
}

interface GlobalSearchProps {
  onSearch: (query: SearchQuery) => void
  onClear: () => void
  availableFields: { value: string; label: string; category: string }[]
  quickFilters?: QuickFilter[]
  recentSearches?: SearchQuery[]
  className?: string
}

const DEFAULT_QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'failed-today',
    label: 'Failed calls today',
    description: 'Calls that failed in the last 24 hours',
    icon: '❌',
    query: {
      text: 'call_ended_reason:!=completed',
      fields: ['call_ended_reason'],
      caseSensitive: false,
      exactMatch: false
    }
  },
  {
    id: 'long-calls',
    label: 'Long calls (>5 min)',
    description: 'Calls longer than 5 minutes',
    icon: '⏱️',
    query: {
      text: 'duration_seconds:>300',
      fields: ['duration_seconds'],
      caseSensitive: false,
      exactMatch: false
    }
  },
  {
    id: 'high-latency',
    label: 'High latency (>2s)',
    description: 'Calls with average latency over 2 seconds',
    icon: '🐌',
    query: {
      text: 'avg_latency:>2000',
      fields: ['avg_latency'],
      caseSensitive: false,
      exactMatch: false
    }
  },
  {
    id: 'completed-calls',
    label: 'Completed calls',
    description: 'Successfully completed calls',
    icon: '✅',
    query: {
      text: 'call_ended_reason:completed',
      fields: ['call_ended_reason'],
      caseSensitive: false,
      exactMatch: false
    }
  }
]

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onSearch,
  onClear,
  availableFields,
  quickFilters = DEFAULT_QUICK_FILTERS,
  recentSearches = [],
  className
}) => {
  const [searchText, setSearchText] = useState('')
  const [selectedFields, setSelectedFields] = useState<string[]>(['all'])
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [exactMatch, setExactMatch] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showQuickFilters, setShowQuickFilters] = useState(false)

  const handleSearch = useCallback(() => {
    if (!searchText) return

    onSearch({
      text: searchText,
      fields: selectedFields,
      caseSensitive,
      exactMatch
    })
  }, [searchText, selectedFields, caseSensitive, exactMatch, onSearch])

  const handleQuickFilter = (filter: QuickFilter) => {
    setSearchText(filter.query.text)
    setSelectedFields(filter.query.fields)
    setCaseSensitive(filter.query.caseSensitive)
    setExactMatch(filter.query.exactMatch)
    setShowQuickFilters(false)
    onSearch(filter.query)
  }

  const handleClear = () => {
    setSearchText('')
    setSelectedFields(['all'])
    setCaseSensitive(false)
    setExactMatch(false)
    onClear()
  }

  const toggleField = (field: string) => {
    if (field === 'all') {
      setSelectedFields(['all'])
    } else {
      setSelectedFields(prev => {
        const filtered = prev.filter(f => f !== 'all')
        if (filtered.includes(field)) {
          const newFields = filtered.filter(f => f !== field)
          return newFields.length === 0 ? ['all'] : newFields
        }
        return [...filtered, field]
      })
    }
  }

  // Group fields by category
  const groupedFields = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, typeof availableFields>)

  const selectedFieldsText = selectedFields.includes('all')
    ? 'All fields'
    : selectedFields.length === 1
    ? availableFields.find(f => f.value === selectedFields[0])?.label || selectedFields[0]
    : `${selectedFields.length} fields`

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across all fields... (e.g., customer_number:555-0123 OR duration>300)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
              if (e.key === 'Escape') {
                handleClear()
              }
            }}
            className="pl-10 pr-24 h-10"
          />

          {/* Clear Button */}
          {searchText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Field Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 min-w-[140px]">
              <span className="text-sm truncate">{selectedFieldsText}</span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search fields..." />
              <CommandList>
                <CommandEmpty>No fields found.</CommandEmpty>

                {/* All Fields Option */}
                <CommandGroup heading="Search In">
                  <CommandItem onSelect={() => toggleField('all')}>
                    <div className="flex items-center gap-2 flex-1">
                      <div className={cn(
                        "w-4 h-4 border rounded flex items-center justify-center",
                        selectedFields.includes('all') && "bg-primary border-primary"
                      )}>
                        {selectedFields.includes('all') && (
                          <div className="w-2 h-2 bg-white rounded-sm" />
                        )}
                      </div>
                      <span>All Fields</span>
                    </div>
                  </CommandItem>
                </CommandGroup>

                {/* Grouped Fields */}
                {Object.entries(groupedFields).map(([category, fields]) => (
                  <CommandGroup key={category} heading={category}>
                    {fields.map((field) => (
                      <CommandItem key={field.value} onSelect={() => toggleField(field.value)}>
                        <div className="flex items-center gap-2 flex-1">
                          <div className={cn(
                            "w-4 h-4 border rounded flex items-center justify-center",
                            selectedFields.includes(field.value) && "bg-primary border-primary"
                          )}>
                            {selectedFields.includes(field.value) && (
                              <div className="w-2 h-2 bg-white rounded-sm" />
                            )}
                          </div>
                          <span className="text-sm">{field.label}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Quick Filters */}
        <Popover open={showQuickFilters} onOpenChange={setShowQuickFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title="Quick filters">
              <Sparkles className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="end">
            <div className="space-y-2">
              <div className="text-sm font-semibold mb-3">Quick Filters</div>
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleQuickFilter(filter)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {filter.icon && (
                      <span className="text-lg flex-shrink-0">{filter.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{filter.label}</div>
                      {filter.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {filter.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Advanced Settings */}
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title="Search settings">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              <div className="text-sm font-semibold">Search Options</div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Case sensitive</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exactMatch}
                  onChange={(e) => setExactMatch(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Exact match only</span>
              </label>

              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Search Syntax:</div>
                  <ul className="space-y-1">
                    <li>• field:value - Search specific field</li>
                    <li>• field:&gt;100 - Numeric comparison</li>
                    <li>• "exact phrase" - Exact match</li>
                    <li>• word1 OR word2 - OR logic</li>
                  </ul>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Search Info & Recent Searches */}
      {(searchText || recentSearches.length > 0) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {searchText && (
            <Badge variant="secondary" className="gap-1">
              <Search className="h-3 w-3" />
              Searching in {selectedFieldsText.toLowerCase()}
              {caseSensitive && ' (case sensitive)'}
              {exactMatch && ' (exact match)'}
            </Badge>
          )}

          {/* Recent Searches */}
          {!searchText && recentSearches.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Recent:
              </span>
              {recentSearches.slice(0, 3).map((search, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchText(search.text)
                    setSelectedFields(search.fields)
                    setCaseSensitive(search.caseSensitive)
                    setExactMatch(search.exactMatch)
                  }}
                  className="h-6 px-2 text-xs"
                >
                  {search.text}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
