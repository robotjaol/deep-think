'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { HistoryView, TrainingSessionWithScenario } from '@/components/history'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export default function HistoryPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<TrainingSessionWithScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (user) {
      loadTrainingHistory()
    }
  }, [user])

  const loadTrainingHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('training_sessions')
        .select(`
          *,
          scenarios (
            title,
            domain,
            difficulty_level
          )
        `)
        .eq('user_id', user!.id)
        .order('started_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setSessions(data as unknown as TrainingSessionWithScenario[] || [])
    } catch (err) {
      console.error('Error loading training history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load training history')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to view your training history.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadTrainingHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Training History</h1>
          <p className="mt-2 text-gray-600">
            Review your past training sessions and analyze your decision-making progress.
          </p>
        </div>

        <HistoryView 
          sessions={sessions} 
          onRefresh={loadTrainingHistory}
        />
      </div>
    </div>
  )
}