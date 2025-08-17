'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth-context'
import { profileClient, type ProfileUpdateData, type ProfileError } from './profile-client'
import type { UserProfile } from '../types'

interface ProfileContextType {
  profile: UserProfile | null
  loading: boolean
  error: ProfileError | null
  updateProfile: (updates: ProfileUpdateData) => Promise<void>
  refreshProfile: () => Promise<void>
  hasCompletedOnboarding: boolean
  trainingStats: {
    total_sessions: number
    completed_sessions: number
    average_score: number
    best_score: number
    recent_sessions_count: number
  } | null
  recentSessions: any[] | null
  progressData: Array<{
    date: string
    score: number
    session_count: number
  }> | null
  domainPerformance: Array<{
    domain: string
    average_score: number
    session_count: number
  }> | null
  clearError: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

interface ProfileProviderProps {
  children: React.ReactNode
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ProfileError | null>(null)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [trainingStats, setTrainingStats] = useState<any>(null)
  const [recentSessions, setRecentSessions] = useState<any[] | null>(null)
  const [progressData, setProgressData] = useState<any[] | null>(null)
  const [domainPerformance, setDomainPerformance] = useState<any[] | null>(null)

  // Load profile when user changes
  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id)
    } else {
      // Clear profile data when user logs out
      setProfile(null)
      setHasCompletedOnboarding(false)
      setTrainingStats(null)
      setRecentSessions(null)
      setProgressData(null)
      setDomainPerformance(null)
    }
  }, [user?.id])

  const loadProfile = async (userId: string) => {
    setLoading(true)
    setError(null)

    try {
      // Load profile
      const { profile, error: profileError } = await profileClient.getProfile(userId)
      
      if (profileError) {
        setError(profileError)
      } else {
        setProfile(profile)
        
        // Check onboarding status
        const completed = !!(
          profile?.preferred_domain && 
          profile?.default_job_role && 
          profile?.default_risk_profile
        )
        setHasCompletedOnboarding(completed)
      }

      // Load training stats
      const { stats, error: statsError } = await profileClient.getTrainingStats(userId)
      if (!statsError) {
        setTrainingStats(stats)
      }

      // Load recent sessions
      const { sessions, error: sessionsError } = await profileClient.getRecentSessions(userId, 5)
      if (!sessionsError) {
        setRecentSessions(sessions)
      }

      // Load progress data
      const { progressData: progress, error: progressError } = await profileClient.getProgressData(userId, 30)
      if (!progressError) {
        setProgressData(progress)
      }

      // Load domain performance
      const { domainPerformance: domains, error: domainsError } = await profileClient.getDomainPerformance(userId)
      if (!domainsError) {
        setDomainPerformance(domains)
      }

    } catch (err: any) {
      setError({ message: err.message || 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: ProfileUpdateData) => {
    if (!user?.id) {
      setError({ message: 'User not authenticated' })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { profile: updatedProfile, error } = await profileClient.updateProfile(user.id, updates)
      
      if (error) {
        setError(error)
      } else {
        setProfile(updatedProfile)
        
        // Update onboarding status
        const completed = !!(
          updatedProfile?.preferred_domain && 
          updatedProfile?.default_job_role && 
          updatedProfile?.default_risk_profile
        )
        setHasCompletedOnboarding(completed)
      }
    } catch (err: any) {
      setError({ message: err.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value: ProfileContextType = {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
    hasCompletedOnboarding,
    trainingStats,
    recentSessions,
    progressData,
    domainPerformance,
    clearError,
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}