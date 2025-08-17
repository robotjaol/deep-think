'use client'

import { TrainingSession, SessionDecision, Consequence } from '@/lib/types'
import { format } from 'date-fns'

// Extended type for history view that includes scenario data
export interface TrainingSessionWithScenario extends TrainingSession {
  scenarios?: {
    title: string
    domain: string
    difficulty_level: number
  } | null
}

interface DecisionBreakdownProps {
  decisions: SessionDecision[]
  session: TrainingSessionWithScenario
  loading: boolean
  error: string | null
}

export function DecisionBreakdown({ decisions, session, loading, error }: DecisionBreakdownProps) {
  const formatDecisionTime = (timeMs: number): string => {
    if (timeMs < 1000) return `${timeMs}ms`
    return `${(timeMs / 1000).toFixed(1)}s`
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBadgeColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    if (score >= 40) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const renderConsequences = (consequences: Consequence[]) => {
    if (!consequences || consequences.length === 0) {
      return <div className="text-gray-500 text-sm">No consequences recorded</div>
    }

    return (
      <div className="space-y-2">
        {consequences.map((consequence, index) => (
          <div key={index} className="flex items-start space-x-2">
            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
              consequence.type === 'direct' ? 'bg-blue-400' : 'bg-purple-400'
            }`} />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  consequence.type === 'direct' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {consequence.type === 'direct' ? 'Direct' : 'Second-order'}
                </span>
                <span className="text-xs text-gray-500">
                  Impact: {consequence.impact_score}
                </span>
                {consequence.probability && (
                  <span className="text-xs text-gray-500">
                    Probability: {(consequence.probability * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700">{consequence.description}</p>
              {consequence.delay_minutes && (
                <p className="text-xs text-gray-500 mt-1">
                  Delayed effect: {consequence.delay_minutes} minutes
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Error loading decisions</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (decisions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Decisions Found</h3>
          <p className="text-gray-600">This session doesn&apos;t have any recorded decisions yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Decision Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{decisions.length}</div>
            <div className="text-sm text-gray-600">Total Decisions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatDecisionTime(
                decisions.reduce((sum, d) => sum + d.time_taken_ms, 0) / decisions.length
              )}
            </div>
            <div className="text-sm text-gray-600">Average Time</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(
              decisions.reduce((sum, d) => sum + d.score_impact, 0) / decisions.length
            )}`}>
              {(decisions.reduce((sum, d) => sum + d.score_impact, 0) / decisions.length).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Average Impact</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {decisions.filter(d => d.user_confidence).length}
            </div>
            <div className="text-sm text-gray-600">With Confidence</div>
          </div>
        </div>
      </div>

      {/* Decision Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Decision Timeline</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {decisions.map((decision, index) => (
            <div key={decision.id} className="p-6">
              <div className="flex items-start space-x-4">
                {/* Timeline indicator */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  {index < decisions.length - 1 && (
                    <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                  )}
                </div>

                {/* Decision content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">
                        Decision {index + 1}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getScoreBadgeColor(decision.score_impact)
                      }`}>
                        Impact: {decision.score_impact.toFixed(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDecisionTime(decision.time_taken_ms)}
                      </span>
                      <span>
                        {format(new Date(decision.timestamp), 'h:mm:ss a')}
                      </span>
                    </div>
                  </div>

                  {/* Decision text */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-900 font-medium mb-2">Decision Made:</p>
                    <p className="text-gray-700">{decision.decision_text}</p>
                    
                    {decision.user_confidence && (
                      <div className="mt-2 flex items-center">
                        <span className="text-sm text-gray-600 mr-2">Confidence:</span>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`h-4 w-4 ${
                                star <= decision.user_confidence!
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="text-sm text-gray-600 ml-2">
                            ({decision.user_confidence}/5)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Consequences */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Consequences:</h5>
                    {renderConsequences(decision.consequences)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}