'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

interface ScenarioResults {
  sessionId: string
  finalScore: number
  totalDecisions: number
  averageDecisionTime: number
  riskProfile: string
  completedAt: string
}

function ScenarioResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [results, setResults] = useState<ScenarioResults | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionId = searchParams.get('sessionId')
    if (!sessionId) {
      router.push('/dashboard')
      return
    }

    // Mock results data - in real implementation, fetch from API
    const mockResults: ScenarioResults = {
      sessionId,
      finalScore: 78,
      totalDecisions: 5,
      averageDecisionTime: 45.2,
      riskProfile: 'balanced',
      completedAt: new Date().toISOString()
    }

    setTimeout(() => {
      setResults(mockResults)
      setLoading(false)
    }, 1000)
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating your results...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn&apos;t find the results for this session.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Fair'
    if (score >= 60) return 'Needs Improvement'
    return 'Poor'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scenario Complete!</h1>
          <p className="text-gray-600">Here&apos;s how you performed in this crisis simulation</p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.finalScore)}`}>
              {results.finalScore}
            </div>
            <div className="text-xl text-gray-600 mb-4">
              {getScoreGrade(results.finalScore)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ${
                  results.finalScore >= 80 ? 'bg-green-500' :
                  results.finalScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${results.finalScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Decisions</p>
                <p className="text-2xl font-bold text-gray-900">{results.totalDecisions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Decision Time</p>
                <p className="text-2xl font-bold text-gray-900">{results.averageDecisionTime}s</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <span className="text-2xl">⚖️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Risk Profile</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{results.riskProfile}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Feedback</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-green-400 pl-4">
              <h3 className="font-semibold text-green-800 mb-2">Strengths</h3>
              <ul className="text-green-700 space-y-1">
                <li>• Quick decision-making under pressure</li>
                <li>• Good risk assessment capabilities</li>
                <li>• Effective resource allocation</li>
              </ul>
            </div>

            <div className="border-l-4 border-yellow-400 pl-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Areas for Improvement</h3>
              <ul className="text-yellow-700 space-y-1">
                <li>• Consider long-term consequences more carefully</li>
                <li>• Improve stakeholder communication</li>
                <li>• Better contingency planning</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-400 pl-4">
              <h3 className="font-semibold text-blue-800 mb-2">Recommended Resources</h3>
              <ul className="text-blue-700 space-y-1">
                <li>• Crisis Management Fundamentals (Course)</li>
                <li>• Decision Making Under Uncertainty (Research Paper)</li>
                <li>• Leadership in Crisis Situations (Video Series)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/scenario/configure')}
            className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Try Another Scenario
          </button>
          
          <button
            onClick={() => router.push('/history')}
            className="px-8 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
          >
            View History
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ScenarioResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    }>
      <ScenarioResultsContent />
    </Suspense>
  )
}