'use client'

import Link from 'next/link'
import { ProtectedRoute, useAuth, useProfile } from '../../lib/auth'
import { ProgressDashboard, RecentScenarios, RecommendedTraining } from '../../components/dashboard'

function DashboardContent() {
  const { user, signOut } = useAuth()
  const { 
    profile, 
    trainingStats, 
    recentSessions, 
    progressData, 
    domainPerformance, 
    loading 
  } = useProfile()

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-8">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.email?.split('@')[0] || 'Trainee'}! 
              {profile?.preferred_domain && (
                <span className="ml-1">Specializing in {profile.preferred_domain}</span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Link
              href="/scenario/configure"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Start Training
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Progress and Recent Sessions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Dashboard */}
            <ProgressDashboard
              metrics={trainingStats || {
                total_sessions: 0,
                completed_sessions: 0,
                average_score: 0,
                best_score: 0,
                recent_sessions_count: 0
              }}
              progressData={progressData || []}
              domainPerformance={domainPerformance || []}
              loading={loading}
            />

            {/* Recent Sessions */}
            <RecentScenarios
              sessions={recentSessions || []}
              loading={loading}
            />
          </div>

          {/* Right Column - Recommendations */}
          <div className="space-y-8">
            <RecommendedTraining
              profile={{
                preferred_domain: profile?.preferred_domain || undefined,
                default_job_role: profile?.default_job_role || undefined,
                default_risk_profile: profile?.default_risk_profile || undefined,
                training_level: profile?.training_level || 1
              }}
              metrics={trainingStats || {
                total_sessions: 0,
                completed_sessions: 0,
                average_score: 0,
                best_score: 0
              }}
              loading={loading}
            />

            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <Link
                  href="/config"
                  className="flex items-center p-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Update Preferences
                </Link>
                
                <Link
                  href="/history"
                  className="flex items-center p-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Full History
                </Link>
                
                <Link
                  href="/contribute"
                  className="flex items-center p-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Contribute Scenarios
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}