'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { TrainingSession } from '@/lib/types'
import { SessionList } from './session-list'
import { SessionDetail } from './session-detail'
import { HistoryFilters } from './history-filters'

// Extended type for history view that includes scenario data
export interface TrainingSessionWithScenario extends TrainingSession {
  scenarios?: {
    title: string
    domain: string
    difficulty_level: number
  } | null
}

export interface HistoryFilters {
  domain?: string
  dateRange?: {
    start: Date
    end: Date
  }
  completionStatus?: 'all' | 'completed' | 'incomplete'
  scoreRange?: {
    min: number
    max: number
  }
  searchQuery?: string
}

interface HistoryViewProps {
  sessions: TrainingSessionWithScenario[]
  onRefresh: () => void
}

export function HistoryView({ sessions, onRefresh }: HistoryViewProps) {
  const [selectedSession, setSelectedSession] = useState<TrainingSessionWithScenario | null>(null)
  const [filters, setFilters] = useState<HistoryFilters>({
    completionStatus: 'all'
  })

  // Filter sessions based on current filters
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Domain filter
      if (filters.domain && session.scenarios?.domain !== filters.domain) {
        return false
      }

      // Date range filter
      if (filters.dateRange) {
        const sessionDate = new Date(session.started_at)
        if (sessionDate < filters.dateRange.start || sessionDate > filters.dateRange.end) {
          return false
        }
      }

      // Completion status filter
      if (filters.completionStatus !== 'all') {
        const isCompleted = !!session.completed_at
        if (filters.completionStatus === 'completed' && !isCompleted) {
          return false
        }
        if (filters.completionStatus === 'incomplete' && isCompleted) {
          return false
        }
      }

      // Score range filter
      if (filters.scoreRange && session.final_score !== null && session.final_score !== undefined) {
        if (session.final_score < filters.scoreRange.min || session.final_score > filters.scoreRange.max) {
          return false
        }
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const searchableText = [
          session.scenarios?.title || '',
          session.scenarios?.domain || '',
          session.configuration?.domain || '',
          session.configuration?.jobRole || ''
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [sessions, filters])

  // Get unique domains for filter options
  const availableDomains = useMemo(() => {
    const domains = new Set<string>()
    sessions.forEach(session => {
      if (session.scenarios?.domain) {
        domains.add(session.scenarios.domain)
      }
    })
    return Array.from(domains).sort()
  }, [sessions])

  const handleSessionSelect = (session: TrainingSessionWithScenario) => {
    setSelectedSession(session)
  }

  const handleBackToList = () => {
    setSelectedSession(null)
  }

  if (selectedSession) {
    return (
      <SessionDetail
        session={selectedSession}
        onBack={handleBackToList}
        onRefresh={onRefresh}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <HistoryFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableDomains={availableDomains}
        totalSessions={sessions.length}
        filteredCount={filteredSessions.length}
      />

      {/* Session List */}
      <SessionList
        sessions={filteredSessions}
        onSessionSelect={handleSessionSelect}
        onRefresh={onRefresh}
      />

      {/* Empty State */}
      {filteredSessions.length === 0 && sessions.length > 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions match your filters</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria to see more results.</p>
          <button
            onClick={() => setFilters({ completionStatus: 'all' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* No Sessions State */}
      {sessions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No training sessions yet</h3>
          <p className="text-gray-600 mb-4">Start your first crisis decision training scenario to see your history here.</p>
          <Link
            href="/scenario/configure"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Start Training
            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )
}