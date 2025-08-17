import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'
import { TrainingSession, SessionData, ScenarioConfig } from '../types'
import { TrainingSessionManager } from './training-session-manager'

export interface RecoverableSession {
  sessionId: string
  scenarioTitle: string
  domain: string
  startedAt: string
  lastActivity: string
  progress: number
  currentStateId: string
  isPaused: boolean
  timeSpent: number
}

export interface RecoveryOptions {
  maxAgeHours: number
  includeCompleted: boolean
  sortBy: 'recent' | 'progress' | 'time_spent'
}

/**
 * SessionRecovery handles finding and restoring interrupted training sessions
 */
export class SessionRecovery {
  private supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  /**
   * Find all recoverable sessions for a user
   */
  async findRecoverableSessions(
    userId: string,
    options: Partial<RecoveryOptions> = {}
  ): Promise<RecoverableSession[]> {
    const opts: RecoveryOptions = {
      maxAgeHours: 24,
      includeCompleted: false,
      sortBy: 'recent',
      ...options
    }

    try {
      let query = this.supabase
        .from('training_sessions')
        .select(`
          id,
          started_at,
          current_state_id,
          is_paused,
          time_spent_seconds,
          session_data,
          recovery_data,
          scenarios (
            title,
            domain,
            config
          )
        `)
        .eq('user_id', userId)

      if (!opts.includeCompleted) {
        query = query.is('completed_at', null)
      }

      // Filter by age
      const maxAge = new Date()
      maxAge.setHours(maxAge.getHours() - opts.maxAgeHours)
      query = query.gte('started_at', maxAge.toISOString())

      const { data: sessions, error } = await query

      if (error) {
        console.error('Error finding recoverable sessions:', error)
        return []
      }

      if (!sessions) return []

      const recoverableSessions: RecoverableSession[] = sessions.map(session => {
        const sessionData = session.session_data as SessionData
        const scenarioConfig = (session.scenarios as any)?.config as ScenarioConfig
        
        // Calculate progress based on decisions made vs total possible states
        let progress = 0
        if (scenarioConfig && sessionData.decisions_made) {
          const totalStates = Object.keys(scenarioConfig.states || {}).length
          const visitedStates = sessionData.state_history?.length || 1
          progress = Math.min((visitedStates / totalStates) * 100, 100)
        }

        // Determine last activity time
        const lastDecisionTime = sessionData.decisions_made?.length > 0
          ? sessionData.decisions_made[sessionData.decisions_made.length - 1].timestamp
          : session.started_at

        return {
          sessionId: session.id,
          scenarioTitle: (session.scenarios as any)?.title || 'Unknown Scenario',
          domain: (session.scenarios as any)?.domain || 'Unknown',
          startedAt: session.started_at,
          lastActivity: lastDecisionTime,
          progress: Math.round(progress),
          currentStateId: session.current_state_id || '',
          isPaused: session.is_paused || false,
          timeSpent: session.time_spent_seconds || 0
        }
      })

      // Sort based on options
      return this.sortRecoverableSessions(recoverableSessions, opts.sortBy)
    } catch (error) {
      console.error('Unexpected error finding recoverable sessions:', error)
      return []
    }
  }

  /**
   * Check if a specific session can be recovered
   */
  async canRecoverSession(sessionId: string): Promise<{
    canRecover: boolean
    reason?: string
    session?: RecoverableSession
  }> {
    try {
      const { data: session, error } = await this.supabase
        .from('training_sessions')
        .select(`
          *,
          scenarios (
            title,
            domain,
            config,
            is_active
          )
        `)
        .eq('id', sessionId)
        .single()

      if (error || !session) {
        return {
          canRecover: false,
          reason: 'Session not found'
        }
      }

      if (session.completed_at) {
        return {
          canRecover: false,
          reason: 'Session already completed'
        }
      }

      const scenario = session.scenarios as any
      if (!scenario?.is_active) {
        return {
          canRecover: false,
          reason: 'Scenario is no longer active'
        }
      }

      // Check if session is too old (more than 7 days)
      const sessionAge = Date.now() - new Date(session.started_at).getTime()
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
      
      if (sessionAge > maxAge) {
        return {
          canRecover: false,
          reason: 'Session is too old to recover'
        }
      }

      // Check if session data is corrupted
      const sessionData = session.session_data as SessionData
      if (!sessionData || !session.current_state_id) {
        return {
          canRecover: false,
          reason: 'Session data is corrupted'
        }
      }

      // Create recoverable session info
      const scenarioConfig = scenario.config as ScenarioConfig
      let progress = 0
      if (scenarioConfig && sessionData.decisions_made) {
        const totalStates = Object.keys(scenarioConfig.states || {}).length
        const visitedStates = sessionData.state_history?.length || 1
        progress = Math.min((visitedStates / totalStates) * 100, 100)
      }

      const lastDecisionTime = sessionData.decisions_made?.length > 0
        ? sessionData.decisions_made[sessionData.decisions_made.length - 1].timestamp
        : session.started_at

      return {
        canRecover: true,
        session: {
          sessionId: session.id,
          scenarioTitle: scenario.title,
          domain: scenario.domain,
          startedAt: session.started_at,
          lastActivity: lastDecisionTime,
          progress: Math.round(progress),
          currentStateId: session.current_state_id,
          isPaused: session.is_paused || false,
          timeSpent: session.time_spent_seconds || 0
        }
      }
    } catch (error) {
      console.error('Error checking session recovery:', error)
      return {
        canRecover: false,
        reason: 'Unexpected error occurred'
      }
    }
  }

  /**
   * Recover a session using TrainingSessionManager
   */
  async recoverSession(
    sessionId: string,
    scenarioConfig: ScenarioConfig,
    sessionManager: TrainingSessionManager
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if session can be recovered
      const { canRecover, reason } = await this.canRecoverSession(sessionId)
      if (!canRecover) {
        return { success: false, error: reason }
      }

      // Use session manager to resume the session
      const result = await sessionManager.resumeSession(sessionId, scenarioConfig)
      
      if (result.success) {
        // Log recovery event
        await this.logRecoveryEvent(sessionId, 'recovered')
      }

      return result
    } catch (error) {
      console.error('Error recovering session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Abandon a session that cannot be recovered
   */
  async abandonSession(
    sessionId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('training_sessions')
        .update({
          completed_at: new Date().toISOString(),
          session_data: {
            abandoned: true,
            abandon_reason: reason,
            abandon_timestamp: new Date().toISOString()
          }
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error abandoning session:', error)
        return { success: false, error: error.message }
      }

      // Log abandonment event
      await this.logRecoveryEvent(sessionId, 'abandoned', reason)

      return { success: true }
    } catch (error) {
      console.error('Unexpected error abandoning session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Clean up old sessions automatically
   */
  async cleanupOldSessions(
    userId?: string,
    maxAgeHours: number = 168 // 7 days
  ): Promise<{ cleaned: number; error?: string }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours)

      let query = this.supabase
        .from('training_sessions')
        .update({
          completed_at: new Date().toISOString(),
          session_data: {
            abandoned: true,
            abandon_reason: 'Automatic cleanup - session too old',
            abandon_timestamp: new Date().toISOString()
          }
        })
        .is('completed_at', null)
        .lt('started_at', cutoffDate.toISOString())

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { error, count } = await query

      if (error) {
        console.error('Error cleaning up old sessions:', error)
        return { cleaned: 0, error: error.message }
      }

      return { cleaned: count || 0 }
    } catch (error) {
      console.error('Unexpected error cleaning up sessions:', error)
      return {
        cleaned: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get recovery statistics for a user
   */
  async getRecoveryStats(userId: string): Promise<{
    totalSessions: number
    recoverableSessions: number
    abandonedSessions: number
    averageRecoveryTime: number
  }> {
    try {
      const { data: sessions, error } = await this.supabase
        .from('training_sessions')
        .select('completed_at, session_data, started_at')
        .eq('user_id', userId)

      if (error || !sessions) {
        return {
          totalSessions: 0,
          recoverableSessions: 0,
          abandonedSessions: 0,
          averageRecoveryTime: 0
        }
      }

      const totalSessions = sessions.length
      const recoverableSessions = sessions.filter(s => !s.completed_at).length
      const abandonedSessions = sessions.filter(s => {
        const sessionData = s.session_data as any
        return sessionData?.abandoned === true
      }).length

      // Calculate average recovery time (time between start and completion for recovered sessions)
      const recoveredSessions = sessions.filter(s => {
        const sessionData = s.session_data as any
        return s.completed_at && !sessionData?.abandoned
      })

      let averageRecoveryTime = 0
      if (recoveredSessions.length > 0) {
        const totalRecoveryTime = recoveredSessions.reduce((sum, session) => {
          const startTime = new Date(session.started_at).getTime()
          const endTime = new Date(session.completed_at!).getTime()
          return sum + (endTime - startTime)
        }, 0)
        averageRecoveryTime = totalRecoveryTime / recoveredSessions.length
      }

      return {
        totalSessions,
        recoverableSessions,
        abandonedSessions,
        averageRecoveryTime: Math.round(averageRecoveryTime / 1000) // Convert to seconds
      }
    } catch (error) {
      console.error('Error getting recovery stats:', error)
      return {
        totalSessions: 0,
        recoverableSessions: 0,
        abandonedSessions: 0,
        averageRecoveryTime: 0
      }
    }
  }

  /**
   * Private helper methods
   */
  private sortRecoverableSessions(
    sessions: RecoverableSession[],
    sortBy: 'recent' | 'progress' | 'time_spent'
  ): RecoverableSession[] {
    switch (sortBy) {
      case 'recent':
        return sessions.sort((a, b) => 
          new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        )
      case 'progress':
        return sessions.sort((a, b) => b.progress - a.progress)
      case 'time_spent':
        return sessions.sort((a, b) => b.timeSpent - a.timeSpent)
      default:
        return sessions
    }
  }

  private async logRecoveryEvent(
    sessionId: string,
    eventType: 'recovered' | 'abandoned',
    details?: string
  ): Promise<void> {
    try {
      // This could be expanded to use a dedicated logging table
      const { data: session } = await this.supabase
        .from('training_sessions')
        .select('recovery_data')
        .eq('id', sessionId)
        .single()

      if (session) {
        const recoveryData = session.recovery_data as any || {}
        const events = recoveryData.events || []
        
        events.push({
          type: eventType,
          timestamp: new Date().toISOString(),
          details
        })

        await this.supabase
          .from('training_sessions')
          .update({
            recovery_data: {
              ...recoveryData,
              events
            }
          })
          .eq('id', sessionId)
      }
    } catch (error) {
      console.error('Error logging recovery event:', error)
    }
  }
}