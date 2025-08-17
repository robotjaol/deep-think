'use client'

import { useState, useEffect } from 'react'
import { TrainingSession, SessionDecision } from '@/lib/types'
import { DecisionBreakdown } from './decision-breakdown'
import { SessionReplay } from './session-replay'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { format, formatDuration, intervalToDuration } from 'date-fns'

// Extended type for history view that includes scenario data
export interface TrainingSessionWithScenario extends TrainingSession {
  scenarios?: {
    title: string
    domain: string
    difficulty_level: number
  } | null
}

interface SessionDetailProps {
  session: TrainingSessionWithScenario
  onBack: () => void
  onRefresh: () => void
}

type ViewMode = 'overview' | 'decisions' | 'replay'

export function SessionDetail({ session, onBack, onRefresh }: SessionDetailProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [decisions, setDecisions] = useState<SessionDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    loadSessionDecisions()
  }, [session.id])

  const loadSessionDecisions = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('decisions')
        .select('*')
        .eq('session_id', session.id)
        .order('timestamp', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      const formattedDecisions: SessionDecision[] = (data || []).map(d => ({
        id: d.id,
        session_id: d.session_id!,
        state_id: d.state_id,
        decision_text: d.decision_text,
        timestamp: d.timestamp,
        time_taken_ms: d.time_taken || 0,
        score_impact: d.score_impact || 0,
        consequences: d.consequences as any[],
        user_confidence: (d as any).user_confidence || undefined
      }))

      setDecisions(formattedDecisions)
    } catch (err) {
      console.error('Error loading session decisions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load session decisions')
    } finally {
      setLoading(false)
    }
  }

  const formatSessionDuration = () => {
    if (!session.session_data?.time_spent_seconds) return 'Unknown'
    
    const duration = intervalToDuration({ 
      start: 0, 
      end: session.session_data.time_spent_seconds * 1000 
    })
    
    const parts = []
    if (duration.hours) parts.push(`${duration.hours}h`)
    if (duration.minutes) parts.push(`${duration.minutes}m`)
    if (duration.seconds) parts.push(`${duration.seconds}s`)
    
    return parts.join(' ') || '0s'
  }

  const calculateAverageDecisionTime = () => {
    if (decisions.length === 0) return 'N/A'
    
    const totalTime = decisions.reduce((sum, decision) => sum + decision.time_taken_ms, 0)
    const averageMs = totalTime / decisions.length
    
    return `${(averageMs / 1000).toFixed(1)}s`
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-600'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceInsights = () => {
    if (decisions.length === 0) return []

    const insights = []
    
    // Decision speed analysis
    const avgTime = decisions.reduce((sum, d) => sum + d.time_taken_ms, 0) / decisions.length
    if (avgTime < 10000) { // Less than 10 seconds
      insights.push({
        type: 'positive',
        title: 'Quick Decision Making',
        description: 'You made decisions quickly, showing confidence under pressure.'
      })
    } else if (avgTime > 30000) { // More than 30 seconds
      insights.push({
        type: 'improvement',
        title: 'Consider Faster Decisions',
        description: 'In crisis situations, faster decision-making is often crucial.'
      })
    }

    // Score consistency
    const scores = decisions.map(d => d.score_impact).filter(s => s !== null)
    if (scores.length > 1) {
      const variance = scores.reduce((sum, score) => {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length
        return sum + Math.pow(score - mean, 2)
      }, 0) / scores.length

      if (variance < 100) { // Low variance
        insights.push({
          type: 'positive',
          title: 'Consistent Performance',
          description: 'Your decision quality remained consistent throughout the scenario.'
        })
      }
    }

    // Improvement trend
    if (decisions.length >= 3) {
      const firstHalf = decisions.slice(0, Math.floor(decisions.length / 2))
      const secondHalf = decisions.slice(Math.floor(decisions.length / 2))
      
      const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.score_impact, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.score_impact, 0) / secondHalf.length
      
      if (secondHalfAvg > firstHalfAvg + 5) {
        insights.push({
          type: 'positive',
          title: 'Improving Performance',
          description: 'Your decision quality improved as the scenario progressed.'
        })
      }
    }

    return insights
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to History
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('decisions')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'decisions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              Decisions
            </button>
            <button
              onClick={() => setViewMode('replay')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'replay'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              Replay
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {session.scenarios?.title || 'Training Session'}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{session.scenarios?.domain || session.configuration?.domain}</span>
            <span>•</span>
            <span>{session.configuration?.jobRole}</span>
            <span>•</span>
            <span>
              {session.completed_at ? 'Completed' : 'Incomplete'} on{' '}
              {format(new Date(session.started_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Metrics</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(session.final_score || null)}`}>
                    {session.final_score?.toFixed(1) || 'N/A'}%
                  </div>
                  <div className="text-sm text-gray-600">Final Score</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {decisions.length}
                  </div>
                  <div className="text-sm text-gray-600">Decisions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatSessionDuration()}
                  </div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {calculateAverageDecisionTime()}
                  </div>
                  <div className="text-sm text-gray-600">Avg Decision Time</div>
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
              
              {error ? (
                <div className="text-red-600 text-sm">{error}</div>
              ) : (
                <div className="space-y-3">
                  {getPerformanceInsights().map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        insight.type === 'positive' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900">{insight.title}</div>
                        <div className="text-sm text-gray-600">{insight.description}</div>
                      </div>
                    </div>
                  ))}
                  
                  {getPerformanceInsights().length === 0 && (
                    <div className="text-gray-600 text-sm">
                      Complete more decisions to see performance insights.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Session Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Details</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Started:</span>
                  <div className="text-gray-600">
                    {format(new Date(session.started_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
                
                {session.completed_at && (
                  <div>
                    <span className="font-medium text-gray-700">Completed:</span>
                    <div className="text-gray-600">
                      {format(new Date(session.completed_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700">Domain:</span>
                  <div className="text-gray-600">
                    {session.scenarios?.domain || session.configuration?.domain}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Role:</span>
                  <div className="text-gray-600">
                    {session.configuration?.jobRole}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Risk Profile:</span>
                  <div className="text-gray-600 capitalize">
                    {session.configuration?.riskProfile}
                  </div>
                </div>
                
                {session.scenarios?.difficulty_level && (
                  <div>
                    <span className="font-medium text-gray-700">Difficulty:</span>
                    <div className="text-gray-600">
                      Level {session.scenarios.difficulty_level}
                    </div>
                  </div>
                )}
                
                {session.session_data?.pause_count > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Pauses:</span>
                    <div className="text-gray-600">
                      {session.session_data.pause_count} times
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'decisions' && (
        <DecisionBreakdown 
          decisions={decisions} 
          session={session}
          loading={loading}
          error={error}
        />
      )}

      {viewMode === 'replay' && (
        <SessionReplay 
          session={session}
          decisions={decisions}
          loading={loading}
          error={error}
        />
      )}
    </div>
  )
}