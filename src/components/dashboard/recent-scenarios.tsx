'use client'

import React from 'react'
import Link from 'next/link'

interface RecentSession {
  id: string
  scenario_id: string
  started_at: string
  completed_at?: string
  final_score?: number
  scenarios?: {
    title: string
    domain: string
  }
}

interface RecentScenariosProps {
  sessions: RecentSession[]
  loading?: boolean
}

export function RecentScenarios({ sessions, loading = false }: RecentScenariosProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="ml-4">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const getStatusBadge = (session: RecentSession) => {
    if (session.completed_at) {
      const score = session.final_score || 0
      if (score >= 80) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Excellent</span>
      } else if (score >= 60) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Good</span>
      } else if (score >= 40) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Fair</span>
      } else {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Needs Work</span>
      }
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">In Progress</span>
    }
  }

  const getDomainIcon = (domain: string) => {
    const iconClass = "w-5 h-5"
    switch (domain?.toLowerCase()) {
      case 'cybersecurity':
        return (
          <svg className={`${iconClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      case 'healthcare':
        return (
          <svg className={`${iconClass} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )
      case 'aerospace':
        return (
          <svg className={`${iconClass} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )
      case 'finance':
        return (
          <svg className={`${iconClass} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      default:
        return (
          <svg className={`${iconClass} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Training Sessions</h3>
            <p className="text-sm text-gray-600">Quick access to your latest scenarios</p>
          </div>
          <Link 
            href="/history"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View all →
          </Link>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="p-8 text-center">
          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Training Sessions Yet</h4>
          <p className="text-gray-600 mb-4">Start your first crisis decision training scenario to see your progress here.</p>
          <Link
            href="/scenario/configure"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Start Training
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {sessions.map((session) => (
            <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getDomainIcon(session.scenarios?.domain || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {session.scenarios?.title || `Scenario ${session.scenario_id.slice(0, 8)}`}
                    </h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {session.scenarios?.domain || 'Unknown Domain'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(session.started_at)}
                      {session.completed_at && session.final_score && (
                        <span className="ml-2">• Score: {session.final_score.toFixed(1)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(session)}
                  <div className="flex space-x-2">
                    {session.completed_at ? (
                      <Link
                        href={`/scenario/results?session=${session.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        Review
                      </Link>
                    ) : (
                      <Link
                        href={`/scenario/${session.scenario_id}?session=${session.id}`}
                        className="text-sm font-medium text-green-600 hover:text-green-500"
                      >
                        Continue
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <Link
            href="/history"
            className="block text-center text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View Complete Training History
          </Link>
        </div>
      )}
    </div>
  )
}