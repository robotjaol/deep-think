'use client'

import { TrainingSession } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'

// Extended type for history view that includes scenario data
export interface TrainingSessionWithScenario extends TrainingSession {
  scenarios?: {
    title: string
    domain: string
    difficulty_level: number
  } | null
}

interface SessionListProps {
  sessions: TrainingSessionWithScenario[]
  onSessionSelect: (session: TrainingSessionWithScenario) => void
  onRefresh: () => void
}

export function SessionList({ sessions, onSessionSelect, onRefresh }: SessionListProps) {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  const getStatusBadge = (session: TrainingSessionWithScenario) => {
    if (session.completed_at) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Incomplete
        </span>
      )
    }
  }

  const getScoreBadge = (score: number | null) => {
    if (score === null) return null

    let colorClass = 'bg-gray-100 text-gray-800'
    if (score >= 80) colorClass = 'bg-green-100 text-green-800'
    else if (score >= 60) colorClass = 'bg-yellow-100 text-yellow-800'
    else colorClass = 'bg-red-100 text-red-800'

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {score.toFixed(1)}%
      </span>
    )
  }

  const getDifficultyBadge = (level: number) => {
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    const levelName = levels[Math.min(level - 1, levels.length - 1)] || 'Unknown'
    
    let colorClass = 'bg-blue-100 text-blue-800'
    if (level >= 4) colorClass = 'bg-red-100 text-red-800'
    else if (level >= 3) colorClass = 'bg-orange-100 text-orange-800'
    else if (level >= 2) colorClass = 'bg-yellow-100 text-yellow-800'

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {levelName}
      </span>
    )
  }

  if (sessions.length === 0) {
    return null
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Training Sessions</h3>
          <button
            onClick={onRefresh}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSessionSelect(session)}
            className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {session.scenarios?.title || 'Unknown Scenario'}
                  </h4>
                  {getStatusBadge(session)}
                  {session.final_score !== null && session.final_score !== undefined && getScoreBadge(session.final_score)}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                    </svg>
                    {session.scenarios?.domain || session.configuration?.domain || 'Unknown Domain'}
                  </span>
                  
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {session.configuration?.jobRole || 'Unknown Role'}
                  </span>

                  {session.scenarios?.difficulty_level && (
                    <span className="flex items-center">
                      {getDifficultyBadge(session.scenarios.difficulty_level)}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Started {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                  </span>

                  {session.completed_at && (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Completed {formatDistanceToNow(new Date(session.completed_at), { addSuffix: true })}
                    </span>
                  )}

                  {session.session_data?.time_spent_seconds && (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Duration: {formatDuration(session.session_data.time_spent_seconds)}
                    </span>
                  )}
                </div>

                {/* Decision count and other metrics */}
                {session.session_data?.decisions_made && (
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>
                      {session.session_data.decisions_made.length} decisions made
                    </span>
                    {session.session_data.pause_count > 0 && (
                      <span>
                        Paused {session.session_data.pause_count} times
                      </span>
                    )}
                    {session.session_data.hints_used > 0 && (
                      <span>
                        {session.session_data.hints_used} hints used
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 ml-4">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}