'use client'

import React from 'react'
import Link from 'next/link'

interface UserProfile {
  preferred_domain?: string
  default_job_role?: string
  default_risk_profile?: string
  training_level: number
}

interface TrainingMetrics {
  total_sessions: number
  completed_sessions: number
  average_score: number
  best_score: number
}

interface TrainingRecommendation {
  id: string
  title: string
  description: string
  domain: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  focusAreas: string[]
  reason: string
  priority: 'high' | 'medium' | 'low'
}

interface RecommendedTrainingProps {
  profile: UserProfile
  metrics: TrainingMetrics
  loading?: boolean
}

export function RecommendedTraining({ profile, metrics, loading = false }: RecommendedTrainingProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const generateRecommendations = (): TrainingRecommendation[] => {
    const recommendations: TrainingRecommendation[] = []
    
    // Determine user's skill level based on metrics
    const skillLevel = metrics.average_score >= 75 ? 'advanced' : 
                      metrics.average_score >= 50 ? 'intermediate' : 'beginner'
    
    // Completion rate analysis
    const completionRate = metrics.total_sessions > 0 ? 
      (metrics.completed_sessions / metrics.total_sessions) * 100 : 0

    // Generate recommendations based on profile and performance
    if (!profile.preferred_domain) {
      recommendations.push({
        id: 'setup-profile',
        title: 'Complete Your Profile Setup',
        description: 'Set your preferred domain and job role to get personalized training recommendations.',
        domain: 'general',
        difficulty: 'beginner',
        estimatedTime: 5,
        focusAreas: ['Profile Setup'],
        reason: 'Complete your profile to unlock personalized training paths',
        priority: 'high'
      })
    }

    if (metrics.total_sessions === 0) {
      recommendations.push({
        id: 'first-scenario',
        title: 'Your First Crisis Scenario',
        description: 'Start with a beginner-friendly scenario to learn the basics of crisis decision-making.',
        domain: profile.preferred_domain || 'cybersecurity',
        difficulty: 'beginner',
        estimatedTime: 15,
        focusAreas: ['Decision Making', 'Time Management'],
        reason: 'Perfect introduction to crisis training',
        priority: 'high'
      })
    }

    if (completionRate < 50 && metrics.total_sessions > 0) {
      recommendations.push({
        id: 'completion-focus',
        title: 'Scenario Completion Training',
        description: 'Practice completing scenarios to build endurance and decision-making stamina.',
        domain: profile.preferred_domain || 'general',
        difficulty: 'beginner',
        estimatedTime: 20,
        focusAreas: ['Persistence', 'Completion'],
        reason: `Your completion rate is ${completionRate.toFixed(0)}% - let's improve that`,
        priority: 'high'
      })
    }

    if (metrics.average_score < 40 && metrics.completed_sessions > 0) {
      recommendations.push({
        id: 'fundamentals-review',
        title: 'Decision-Making Fundamentals',
        description: 'Review core principles of crisis decision-making to improve your scoring.',
        domain: profile.preferred_domain || 'general',
        difficulty: 'beginner',
        estimatedTime: 25,
        focusAreas: ['Risk Assessment', 'Impact Analysis'],
        reason: `Your average score is ${metrics.average_score.toFixed(1)} - let's build stronger foundations`,
        priority: 'high'
      })
    }

    if (metrics.average_score >= 60 && skillLevel === 'intermediate') {
      recommendations.push({
        id: 'advanced-scenarios',
        title: 'Advanced Crisis Scenarios',
        description: 'Challenge yourself with complex, multi-stakeholder crisis situations.',
        domain: profile.preferred_domain || 'cybersecurity',
        difficulty: 'advanced',
        estimatedTime: 35,
        focusAreas: ['Complex Decision Trees', 'Stakeholder Management'],
        reason: 'You\'re ready for more challenging scenarios',
        priority: 'medium'
      })
    }

    if (profile.preferred_domain && metrics.completed_sessions >= 3) {
      const otherDomains = ['cybersecurity', 'healthcare', 'aerospace', 'finance']
        .filter(d => d !== profile.preferred_domain)
      
      recommendations.push({
        id: 'cross-domain',
        title: `Cross-Domain Training: ${otherDomains[0]}`,
        description: 'Expand your skills by practicing decision-making in different domains.',
        domain: otherDomains[0],
        difficulty: skillLevel,
        estimatedTime: 30,
        focusAreas: ['Domain Adaptation', 'Transferable Skills'],
        reason: 'Broaden your expertise across different crisis types',
        priority: 'medium'
      })
    }

    if (profile.default_risk_profile === 'conservative' && metrics.average_score >= 50) {
      recommendations.push({
        id: 'risk-tolerance',
        title: 'Risk Tolerance Training',
        description: 'Practice scenarios that challenge your comfort zone with calculated risks.',
        domain: profile.preferred_domain || 'general',
        difficulty: skillLevel,
        estimatedTime: 25,
        focusAreas: ['Risk Assessment', 'Bold Decision Making'],
        reason: 'Expand your risk tolerance for better crisis outcomes',
        priority: 'low'
      })
    }

    if (metrics.completed_sessions >= 5 && metrics.average_score >= 70) {
      recommendations.push({
        id: 'time-pressure',
        title: 'High-Pressure Time Scenarios',
        description: 'Master decision-making under extreme time constraints.',
        domain: profile.preferred_domain || 'general',
        difficulty: 'advanced',
        estimatedTime: 20,
        focusAreas: ['Time Management', 'Quick Decision Making'],
        reason: 'Perfect your skills under maximum pressure',
        priority: 'medium'
      })
    }

    // Sort by priority and return top 4
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return recommendations
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 4)
  }

  const recommendations = generateRecommendations()

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        )
      case 'medium':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recommended Training</h3>
        <p className="text-sm text-gray-600">Personalized suggestions based on your progress</p>
      </div>

      <div className="p-6">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Available</h4>
            <p className="text-gray-600">Complete more training sessions to get personalized recommendations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getPriorityIcon(rec.priority)}
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(rec.difficulty)}`}>
                      {rec.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">{rec.estimatedTime}min</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {rec.focusAreas.map((area) => (
                      <span key={area} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {area}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {rec.id === 'setup-profile' ? (
                      <Link
                        href="/config"
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        Set Up Profile
                      </Link>
                    ) : (
                      <Link
                        href="/scenario/configure"
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        Start Training
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 italic">
                  💡 {rec.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <Link
          href="/scenario/configure"
          className="block text-center text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Browse All Training Scenarios
        </Link>
      </div>
    </div>
  )
}