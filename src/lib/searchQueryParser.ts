/**
 * Search Query Parser
 * Parses user search queries and converts them to Supabase filters
 * Supports syntax like:
 * - field:value
 * - field:>100
 * - field:<=50
 * - "exact phrase"
 * - word1 OR word2
 * - word1 AND word2
 */

import { FilterRule } from '@/components/calls/AdvancedFilter'

export interface ParsedSearchQuery {
  globalSearch?: string
  fieldSearches: FieldSearch[]
  logic: 'AND' | 'OR'
}

export interface FieldSearch {
  field: string
  operator: string
  value: string
  isJsonField: boolean
  jsonPath?: string
}

/**
 * Parse a search query string into structured search parameters
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const trimmed = query.trim()
  if (!trimmed) {
    return { fieldSearches: [], logic: 'AND' }
  }

  const fieldSearches: FieldSearch[] = []
  let globalSearch = ''
  let logic: 'AND' | 'OR' = 'AND'

  // Check for OR logic
  if (trimmed.toUpperCase().includes(' OR ')) {
    logic = 'OR'
  }

  // Split by AND/OR while preserving quoted strings
  const terms = splitPreservingQuotes(trimmed, logic === 'OR' ? /\s+OR\s+/i : /\s+AND\s+|\s+/i)

  for (const term of terms) {
    const cleanTerm = term.trim()
    if (!cleanTerm || cleanTerm.toUpperCase() === 'AND' || cleanTerm.toUpperCase() === 'OR') {
      continue
    }

    // Check if this is a field:value search
    const fieldMatch = cleanTerm.match(/^([a-zA-Z_]+(?:\.[a-zA-Z_]+)?)(:|>|<|>=|<=|!=)(.+)$/)

    if (fieldMatch) {
      const [, fieldPath, operator, value] = fieldMatch
      const isJsonField = fieldPath.includes('.')
      const [field, jsonPath] = fieldPath.split('.')

      fieldSearches.push({
        field: isJsonField ? field : fieldPath,
        operator: mapOperator(operator),
        value: value.trim().replace(/^["']|["']$/g, ''), // Remove quotes
        isJsonField,
        jsonPath
      })
    } else {
      // Global search term
      if (globalSearch) {
        globalSearch += ` ${cleanTerm}`
      } else {
        globalSearch = cleanTerm
      }
    }
  }

  return {
    globalSearch: globalSearch || undefined,
    fieldSearches,
    logic
  }
}

/**
 * Convert parsed search to Supabase filter rules
 */
export function searchQueryToFilters(
  parsedQuery: ParsedSearchQuery,
  searchInFields: string[] = ['all']
): FilterRule[] {
  const filters: FilterRule[] = []

  // Add field-specific searches
  parsedQuery.fieldSearches.forEach(search => {
    filters.push({
      id: Date.now().toString() + Math.random(),
      column: search.field,
      operation: search.operator,
      value: search.value,
      jsonField: search.jsonPath
    })
  })

  // Add global search filters
  if (parsedQuery.globalSearch) {
    const searchTerm = parsedQuery.globalSearch.replace(/^["']|["']$/g, '')

    if (searchInFields.includes('all') || searchInFields.length === 0) {
      // Search in all text fields
      const textFields = [
        'customer_number',
        'call_id',
        'call_ended_reason'
      ]

      textFields.forEach(field => {
        filters.push({
          id: Date.now().toString() + Math.random(),
          column: field,
          operation: 'contains',
          value: searchTerm
        })
      })
    } else {
      // Search in specified fields only
      searchInFields.forEach(field => {
        // Check if it's a JSONB field path
        if (field.includes('.')) {
          const [column, jsonField] = field.split('.')
          filters.push({
            id: Date.now().toString() + Math.random(),
            column,
            operation: 'json_contains',
            value: searchTerm,
            jsonField
          })
        } else {
          filters.push({
            id: Date.now().toString() + Math.random(),
            column: field,
            operation: 'contains',
            value: searchTerm
          })
        }
      })
    }
  }

  return filters
}

/**
 * Map search operators to filter operations
 */
function mapOperator(operator: string): string {
  const operatorMap: Record<string, string> = {
    ':': 'equals',
    '>': 'greater_than',
    '<': 'less_than',
    '>=': 'gte',
    '<=': 'lte',
    '!=': 'not_equals'
  }

  return operatorMap[operator] || 'equals'
}

/**
 * Split a string by delimiter while preserving quoted strings
 */
function splitPreservingQuotes(str: string, delimiter: RegExp): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let quoteChar = ''

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true
        quoteChar = char
      } else if (char === quoteChar) {
        inQuotes = false
        quoteChar = ''
      }
      current += char
    } else if (!inQuotes && delimiter.test(str.slice(i))) {
      if (current.trim()) {
        result.push(current.trim())
      }
      current = ''
      // Skip the delimiter
      const match = str.slice(i).match(delimiter)
      if (match) {
        i += match[0].length - 1
      }
    } else {
      current += char
    }
  }

  if (current.trim()) {
    result.push(current.trim())
  }

  return result
}

/**
 * Build a user-friendly search query string from filters
 */
export function filtersToSearchQuery(filters: FilterRule[]): string {
  return filters
    .map(filter => {
      const field = filter.jsonField
        ? `${filter.column}.${filter.jsonField}`
        : filter.column

      const operator = (() => {
        switch (filter.operation) {
          case 'equals':
          case 'json_equals':
            return ':'
          case 'greater_than':
          case 'json_greater_than':
            return '>'
          case 'less_than':
          case 'json_less_than':
            return '<'
          case 'contains':
          case 'json_contains':
            return ':'
          default:
            return ':'
        }
      })()

      const value = filter.value.includes(' ')
        ? `"${filter.value}"`
        : filter.value

      return `${field}${operator}${value}`
    })
    .join(' AND ')
}

/**
 * Validate a search query string
 */
export function validateSearchQuery(query: string): { valid: boolean; error?: string } {
  try {
    parseSearchQuery(query)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: (error as Error).message
    }
  }
}

/**
 * Get search suggestions based on partial query
 */
export function getSearchSuggestions(
  partialQuery: string,
  availableFields: string[]
): string[] {
  const suggestions: string[] = []

  // If query contains ':', suggest operators
  if (partialQuery.includes(':')) {
    const [field] = partialQuery.split(':')
    if (availableFields.some(f => f.startsWith(field))) {
      suggestions.push(`${field}:value`)
      suggestions.push(`${field}:>100`)
      suggestions.push(`${field}:<100`)
    }
  } else {
    // Suggest matching fields
    const matching = availableFields.filter(f =>
      f.toLowerCase().includes(partialQuery.toLowerCase())
    )
    matching.forEach(field => {
      suggestions.push(`${field}:`)
    })
  }

  return suggestions.slice(0, 5)
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(
  text: string,
  searchTerms: string[]
): string {
  let highlighted = text
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi')
    highlighted = highlighted.replace(regex, '<mark>$1</mark>')
  })
  return highlighted
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
