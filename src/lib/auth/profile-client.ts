import { createClientComponentClient } from '../supabase'
import { Database } from '../../types/supabase'
import type { UserProfile } from '../types'

export interface ProfileUpdateData {
  preferred_domain?: string
  default_job_role?: string
  default_risk_profile?: 'conservative' | 'balanced' | 'aggressive'
}

export interface ProfileError {
  message: string
  status?: number
}

export class ProfileClient {
  private supabase = createClientComponentClient()

  /**
   * Get user profile by user ID
   */
  async getProfile(userId: string): Promise<{ profile: UserProfile | null; error: ProfileError | null }> {
    try {
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { profile: null, error: { message: 'Profile not found', status: 404 } }
        }
        return { profile: null, error: { message: error.message, status: 400 } }
      }

      return { profile, error: null }
    } catch (error: any) {
      return { profile: null, error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<{ profile: UserProfile | null; error: ProfileError | null }> {
    try {
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { profile: null, error: { message: error.message, status: 400 } }
      }

      return { profile, error: null }
    } catch (error: any) {
      return { profile: null, error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Get user's training statistics
   */
  async getTrainingStats(userId: string): Promise<{ 
    stats: {
      total_sessions: number
      completed_sessions: number
      average_score: number
      best_score: number
      recent_sessions_count: number
    } | null
    error: ProfileError | null 
  }> {
    try {
      const { data: stats, error } = await this.supabase
        .rpc('get_user_training_stats', { user_uuid: userId })

      if (error) {
        return { stats: null, error: { message: error.message, status: 400 } }
      }

      return { stats: stats?.[0] || null, error: null }
    } catch (error: any) {
      return { stats: null, error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Update user statistics after completing a training session
   */
  async updateUserStats(userId: string, sessionScore: number): Promise<{ error: ProfileError | null }> {
    try {
      const { error } = await this.supabase
        .rpc('update_user_stats', { 
          user_uuid: userId, 
          session_score: sessionScore 
        })

      if (error) {
        return { error: { message: error.message, status: 400 } }
      }

      return { error: null }
    } catch (error: any) {
      return { error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Get user's recent training sessions
   */
  async getRecentSessions(userId: string, limit: number = 10): Promise<{
    sessions: any[] | null
    error: ProfileError | null
  }> {
    try {
      const { data: sessions, error } = await this.supabase
        .from('training_sessions')
        .select(`
          id,
          scenario_id,
          started_at,
          completed_at,
          final_score,
          scenarios (
            title,
            domain
          )
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit)

      if (error) {
        return { sessions: null, error: { message: error.message, status: 400 } }
      }

      return { sessions, error: null }
    } catch (error: any) {
      return { sessions: null, error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Get user's progress data over time for visualization
   */
  async getProgressData(userId: string, days: number = 30): Promise<{
    progressData: Array<{
      date: string
      score: number
      session_count: number
    }> | null
    error: ProfileError | null
  }> {
    try {
      const { data: progressData, error } = await this.supabase
        .rpc('get_user_training_stats', { 
          user_uuid: userId
        })

      if (error) {
        return { progressData: null, error: { message: error.message, status: 400 } }
      }

      return { progressData: null, error: null }
    } catch (error: any) {
      return { progressData: null, error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Get user's performance by domain
   */
  async getDomainPerformance(userId: string): Promise<{
    domainPerformance: Array<{
      domain: string
      average_score: number
      session_count: number
    }> | null
    error: ProfileError | null
  }> {
    try {
      const { data: domainPerformance, error } = await this.supabase
        .rpc('get_user_training_stats', { user_uuid: userId })

      if (error) {
        return { domainPerformance: null, error: { message: error.message, status: 400 } }
      }

      return { domainPerformance: null, error: null }
    } catch (error: any) {
      return { domainPerformance: null, error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Delete user profile and all associated data
   */
  async deleteProfile(userId: string): Promise<{ error: ProfileError | null }> {
    try {
      // Delete user profile (cascade will handle related records)
      const { error } = await this.supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        return { error: { message: error.message, status: 400 } }
      }

      return { error: null }
    } catch (error: any) {
      return { error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Check if user has completed onboarding (has set preferences)
   */
  async hasCompletedOnboarding(userId: string): Promise<{ completed: boolean; error: ProfileError | null }> {
    try {
      const { profile, error } = await this.getProfile(userId)

      if (error) {
        return { completed: false, error }
      }

      const completed = !!(
        profile?.preferred_domain && 
        profile?.default_job_role && 
        profile?.default_risk_profile
      )

      return { completed, error: null }
    } catch (error: any) {
      return { completed: false, error: { message: error.message || 'An unexpected error occurred' } }
    }
  }
}

// Export singleton instance
export const profileClient = new ProfileClient()