'use client'

import { useState } from 'react'
import { HistoryFilters as FilterType } from './history-view'

interface HistoryFiltersProps {
  filters: FilterType
  onFiltersChange: (filters: FilterType) => void
  availableDomains: string[]
  totalSessions: number
  filteredCount: number
}

export function HistoryFilters({
  filters,
  onFiltersChange,
  availableDomains,
  totalSessions,
  filteredCount
}: HistoryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof FilterType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({ completionStatus: 'all' })
  }

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof FilterType]
    if (key === 'completionStatus') return value !== 'all'
    return value !== undefined && value !== null && value !== ''
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">Filter Sessions</h3>
            <span className="text-sm text-gray-500">
              {filteredCount} of {totalSessions} sessions
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-700"
            >
              {isExpanded ? 'Hide filters' : 'Show filters'}
              <svg
                className={`ml-1 h-4 w-4 transform transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search scenarios, domains, or roles..."
              value={filters.searchQuery || ''}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Domain Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain
              </label>
              <select
                value={filters.domain || ''}
                onChange={(e) => handleFilterChange('domain', e.target.value || undefined)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All domains</option>
                {availableDomains.map(domain => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Completion Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.completionStatus || 'all'}
                onChange={(e) => handleFilterChange('completionStatus', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All sessions</option>
                <option value="completed">Completed</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>

            {/* Score Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  max="100"
                  value={filters.scoreRange?.min || ''}
                  onChange={(e) => {
                    const min = e.target.value ? parseInt(e.target.value) : undefined
                    handleFilterChange('scoreRange', {
                      ...filters.scoreRange,
                      min
                    })
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  min="0"
                  max="100"
                  value={filters.scoreRange?.max || ''}
                  onChange={(e) => {
                    const max = e.target.value ? parseInt(e.target.value) : undefined
                    handleFilterChange('scoreRange', {
                      ...filters.scoreRange,
                      max
                    })
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange?.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const start = e.target.value ? new Date(e.target.value) : undefined
                    handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      start
                    })
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={filters.dateRange?.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const end = e.target.value ? new Date(e.target.value) : undefined
                    handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      end
                    })
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}