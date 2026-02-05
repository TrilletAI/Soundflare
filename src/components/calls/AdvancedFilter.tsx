'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Filter,
  X,
  Plus,
  ChevronDown,
  Calendar as CalendarIcon,
  Trash2,
  Copy
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export interface FilterRule {
  id: string
  column: string
  operation: string
  value: string
  jsonField?: string
}

export interface FilterGroup {
  id: string
  logic: 'AND' | 'OR'
  filters: FilterRule[]
  groups?: FilterGroup[]
}

interface AdvancedFilterProps {
  onFiltersChange: (groups: FilterGroup[]) => void
  onClear: () => void
  availableMetadataFields?: string[]
  availableTranscriptionFields?: string[]
  className?: string
}

const COLUMNS = [
  { value: 'customer_number', label: 'Customer Number', type: 'text' },
  { value: 'duration_seconds', label: 'Duration (seconds)', type: 'number' },
  { value: 'billing_duration_seconds', label: 'Billing Duration', type: 'number' },
  { value: 'avg_latency', label: 'Avg Latency (ms)', type: 'number' },
  { value: 'call_started_at', label: 'Date', type: 'date' },
  { value: 'call_ended_reason', label: 'Status', type: 'text' },
  { value: 'total_cost', label: 'Total Cost', type: 'number' },
  { value: 'metadata', label: 'Metadata', type: 'jsonb' },
  { value: 'transcription_metrics', label: 'Transcription', type: 'jsonb' }
]

const OPERATIONS = {
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'is_empty', label: 'Is empty' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'between', label: 'Between' }
  ],
  date: [
    { value: 'equals', label: 'On date' },
    { value: 'greater_than', label: 'After' },
    { value: 'less_than', label: 'Before' },
    { value: 'between', label: 'Between' }
  ],
  jsonb: [
    { value: 'json_equals', label: 'Equals' },
    { value: 'json_contains', label: 'Contains' },
    { value: 'json_exists', label: 'Field Exists' },
    { value: 'json_greater_than', label: 'Greater than' },
    { value: 'json_less_than', label: 'Less than' }
  ]
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  onFiltersChange,
  onClear,
  availableMetadataFields = [],
  availableTranscriptionFields = [],
  className
}) => {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: '1', logic: 'AND', filters: [] }
  ])
  const [isOpen, setIsOpen] = useState(false)

  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: Date.now().toString(),
      logic: 'AND',
      filters: []
    }
    const updated = [...filterGroups, newGroup]
    setFilterGroups(updated)
    onFiltersChange(updated)
  }

  const removeFilterGroup = (groupId: string) => {
    if (filterGroups.length === 1) return // Keep at least one group
    const updated = filterGroups.filter(g => g.id !== groupId)
    setFilterGroups(updated)
    onFiltersChange(updated)
  }

  const updateGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    const updated = filterGroups.map(group =>
      group.id === groupId ? { ...group, logic } : group
    )
    setFilterGroups(updated)
    onFiltersChange(updated)
  }

  const addFilter = (groupId: string, filter: FilterRule) => {
    const updated = filterGroups.map(group =>
      group.id === groupId
        ? { ...group, filters: [...group.filters, filter] }
        : group
    )
    setFilterGroups(updated)
    onFiltersChange(updated)
  }

  const removeFilter = (groupId: string, filterId: string) => {
    const updated = filterGroups.map(group =>
      group.id === groupId
        ? { ...group, filters: group.filters.filter(f => f.id !== filterId) }
        : group
    )
    setFilterGroups(updated)
    onFiltersChange(updated)
  }

  const duplicateFilterGroup = (groupId: string) => {
    const groupToDuplicate = filterGroups.find(g => g.id === groupId)
    if (!groupToDuplicate) return

    const newGroup: FilterGroup = {
      id: Date.now().toString(),
      logic: groupToDuplicate.logic,
      filters: groupToDuplicate.filters.map(f => ({
        ...f,
        id: Date.now().toString() + Math.random()
      }))
    }
    const updated = [...filterGroups, newGroup]
    setFilterGroups(updated)
    onFiltersChange(updated)
  }

  const clearAll = () => {
    const reset = [{ id: '1', logic: 'AND' as const, filters: [] }]
    setFilterGroups(reset)
    onClear()
  }

  const getTotalFilterCount = () => {
    return filterGroups.reduce((sum, group) => sum + group.filters.length, 0)
  }

  const totalFilters = getTotalFilterCount()

  return (
    <div className={cn("w-fit", className)}>
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={totalFilters > 0 ? "default" : "outline"}
              size="sm"
              className="gap-2 h-8"
            >
              <Filter className="h-3 w-3" />
              Advanced Filter
              {totalFilters > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 rounded-full p-0 px-1 text-xs">
                  {totalFilters}
                </Badge>
              )}
              <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && 'rotate-180')} />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[700px] p-4" align="start">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Advanced Filter Builder</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addFilterGroup}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Group
                  </Button>
                  {totalFilters > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="h-7 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter Groups */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filterGroups.map((group, groupIndex) => (
                  <FilterGroupComponent
                    key={group.id}
                    group={group}
                    groupIndex={groupIndex}
                    totalGroups={filterGroups.length}
                    availableMetadataFields={availableMetadataFields}
                    availableTranscriptionFields={availableTranscriptionFields}
                    onLogicChange={(logic) => updateGroupLogic(group.id, logic)}
                    onAddFilter={(filter) => addFilter(group.id, filter)}
                    onRemoveFilter={(filterId) => removeFilter(group.id, filterId)}
                    onRemoveGroup={() => removeFilterGroup(group.id)}
                    onDuplicateGroup={() => duplicateFilterGroup(group.id)}
                  />
                ))}
              </div>

              {/* Footer Info */}
              {totalFilters > 0 && (
                <div className="text-xs text-muted-foreground border-t pt-3">
                  <p>
                    {filterGroups.length} filter group{filterGroups.length > 1 ? 's' : ''} with {totalFilters} total filter{totalFilters > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {totalFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="gap-1 h-8 text-xs"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Summary */}
      {totalFilters > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          {filterGroups.map((group, idx) => (
            <div key={group.id} className="flex items-center gap-1">
              {idx > 0 && <span className="font-semibold">AND</span>}
              <span>
                Group {idx + 1} ({group.logic}): {group.filters.length} filter{group.filters.length > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// FilterGroup Component
interface FilterGroupComponentProps {
  group: FilterGroup
  groupIndex: number
  totalGroups: number
  availableMetadataFields: string[]
  availableTranscriptionFields: string[]
  onLogicChange: (logic: 'AND' | 'OR') => void
  onAddFilter: (filter: FilterRule) => void
  onRemoveFilter: (filterId: string) => void
  onRemoveGroup: () => void
  onDuplicateGroup: () => void
}

const FilterGroupComponent: React.FC<FilterGroupComponentProps> = ({
  group,
  groupIndex,
  totalGroups,
  availableMetadataFields,
  availableTranscriptionFields,
  onLogicChange,
  onAddFilter,
  onRemoveFilter,
  onRemoveGroup,
  onDuplicateGroup
}) => {
  const [newFilter, setNewFilter] = useState({
    column: '',
    operation: '',
    value: '',
    jsonField: ''
  })
  const [selectedDate, setSelectedDate] = useState<Date>()

  const getAvailableJsonFields = () => {
    if (newFilter.column === 'metadata') return availableMetadataFields
    if (newFilter.column === 'transcription_metrics') return availableTranscriptionFields
    return []
  }

  const isJsonbColumn = () => {
    return newFilter.column === 'metadata' || newFilter.column === 'transcription_metrics'
  }

  const isValidFilter = () => {
    const hasBasicFields = newFilter.column && newFilter.operation
    const hasValue = !['json_exists', 'is_empty'].includes(newFilter.operation) ? newFilter.value : true
    const hasJsonField = isJsonbColumn() ? newFilter.jsonField : true
    return hasBasicFields && hasValue && hasJsonField
  }

  const handleAddFilter = () => {
    if (isValidFilter()) {
      const filter: FilterRule = {
        id: Date.now().toString() + Math.random(),
        column: newFilter.column,
        operation: newFilter.operation,
        value: newFilter.value,
        ...(newFilter.jsonField && { jsonField: newFilter.jsonField })
      }
      onAddFilter(filter)
      setNewFilter({ column: '', operation: '', value: '', jsonField: '' })
      setSelectedDate(undefined)
    }
  }

  const getAvailableOperations = () => {
    const selectedColumn = COLUMNS.find(col => col.value === newFilter.column)
    if (!selectedColumn) return []
    return OPERATIONS[selectedColumn.type as keyof typeof OPERATIONS] || []
  }

  const getFilterDisplayText = (filter: FilterRule) => {
    const columnLabel = COLUMNS.find(c => c.value === filter.column)?.label || filter.column
    const operationLabel = Object.values(OPERATIONS)
      .flat()
      .find(op => op.value === filter.operation)?.label || filter.operation
    const jsonFieldText = filter.jsonField ? `.${filter.jsonField}` : ''
    const valueText = !['json_exists', 'is_empty'].includes(filter.operation) ? ` "${filter.value}"` : ''
    return `${columnLabel}${jsonFieldText} ${operationLabel}${valueText}`
  }

  const isDateField = newFilter.column === 'call_started_at'
  const needsValue = !['json_exists', 'is_empty'].includes(newFilter.operation)

  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      {/* Group Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Group {groupIndex + 1}
          </span>
          <Select value={group.logic} onValueChange={(v) => onLogicChange(v as 'AND' | 'OR')}>
            <SelectTrigger className="h-6 w-[80px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDuplicateGroup}
            className="h-6 w-6 p-0"
            title="Duplicate group"
          >
            <Copy className="h-3 w-3" />
          </Button>
          {totalGroups > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemoveGroup}
              className="h-6 w-6 p-0 text-destructive"
              title="Remove group"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Existing Filters */}
      {group.filters.length > 0 && (
        <div className="space-y-1 mb-3">
          {group.filters.map((filter, idx) => (
            <div key={filter.id} className="flex items-center gap-2 text-xs">
              {idx > 0 && (
                <span className="text-muted-foreground font-medium px-2">
                  {group.logic}
                </span>
              )}
              <Badge variant="secondary" className="gap-1 py-1">
                <span>{getFilterDisplayText(filter)}</span>
                <button
                  onClick={() => onRemoveFilter(filter.id)}
                  className="hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Add New Filter */}
      <div className="grid grid-cols-12 gap-2">
        {/* Column */}
        <div className="col-span-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full h-8 text-xs justify-between">
                <span className="truncate">
                  {newFilter.column ? COLUMNS.find(c => c.value === newFilter.column)?.label : 'Column'}
                </span>
                <ChevronDown className="h-3 w-3 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {COLUMNS.map((column) => (
                <DropdownMenuItem
                  key={column.value}
                  onClick={() => setNewFilter({
                    column: column.value,
                    operation: '',
                    value: '',
                    jsonField: ''
                  })}
                >
                  {column.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* JSON Field (if applicable) */}
        {isJsonbColumn() && (
          <div className="col-span-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs justify-between"
                  disabled={!newFilter.column}
                >
                  <span className="truncate">{newFilter.jsonField || 'Field'}</span>
                  <ChevronDown className="h-3 w-3 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 max-h-48 overflow-y-auto">
                {getAvailableJsonFields().map((field) => (
                  <DropdownMenuItem
                    key={field}
                    onClick={() => setNewFilter({ ...newFilter, jsonField: field })}
                  >
                    {field}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Operation */}
        <div className={isJsonbColumn() ? 'col-span-2' : 'col-span-3'}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs justify-between"
                disabled={!newFilter.column || (isJsonbColumn() && !newFilter.jsonField)}
              >
                <span className="truncate">
                  {newFilter.operation
                    ? getAvailableOperations().find(op => op.value === newFilter.operation)?.label
                    : 'Operation'}
                </span>
                <ChevronDown className="h-3 w-3 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {getAvailableOperations().map((operation) => (
                <DropdownMenuItem
                  key={operation.value}
                  onClick={() => setNewFilter({ ...newFilter, operation: operation.value })}
                >
                  {operation.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Value */}
        {needsValue && (
          <div className={isJsonbColumn() ? 'col-span-4' : 'col-span-5'}>
            {isDateField ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs justify-between"
                    disabled={!newFilter.operation}
                  >
                    <span className="truncate">
                      {selectedDate ? format(selectedDate, 'MMM dd') : 'Date'}
                    </span>
                    <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date)
                      if (date) {
                        setNewFilter({ ...newFilter, value: format(date, 'yyyy-MM-dd') })
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <Input
                placeholder="Value"
                value={newFilter.value}
                onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                disabled={!newFilter.operation}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFilter()
                }}
              />
            )}
          </div>
        )}

        {/* Add Button */}
        <div className="col-span-1">
          <Button
            onClick={handleAddFilter}
            disabled={!isValidFilter()}
            size="sm"
            className="w-full h-8"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AdvancedFilter
