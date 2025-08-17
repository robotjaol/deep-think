import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'
import { TrainingSession, SessionData, SessionDecision, GenerationContext, ScenarioConfig } from '../types'
import { ScenarioStateManager } from '../scenario-engine/scenario-state'

export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned'

export interface SessionRecoveryData {
  currentStateId: string
  stateHistory: string[]
  decisionHistory: SessionDecision[]
  timeSpentSeconds: number
  pauseCount: number
  lastActivity: string
}

export interface SessionMetrics {
  totalTime: number
  averageDecisionTime: number
  pauseCount: number
  decisionsCount: number
  currentScore: number
}

/**
 * TrainingSessionManager handles the complete lifecycle of training sessions
 * including creation, persistence, pause/resume, and recovery functionality
 */
export class TrainingSessionManager {
  private supabase: SupabaseClient<Database>
  private sessionId: string | null = null
  private scenarioStateManager: ScenarioStateManager | null = null
  private startTime: Date | null = null
  private pauseTime: Date | null = null
  private totalPausedTime: number = 0

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  /**
   * Start a new training session
   */
  async startSession(
    userId: string,
    scenarioId: string,
    configuration: GenerationContext,
    scenarioConfig: ScenarioConfig
  ): Promise<{ sessionId: string; success: boolean; error?: string }> {
    try {
      // Initialize scenario state manager
      this.scenarioStateManager = new ScenarioStateManager(scenarioConfig.initialState)
      
      // Create session in database
      const { data, error } = await this.supabase
        .from('training_sessions')
        .insert({
          user_id: userId,
          scenario_id: scenarioId,
          configuration,
          session_data: {
            decisions_made: [],
            state_history: [scenarioConfig.initialState.id],
            time_spent_seconds: 0,
            pause_count: 0,
            hints_used: 0,
            current_context: {}
          } as SessionData
        } as any)
        .select('id')
        .single()

      if (error) {
        console.error('Error creating training session:', error)
        return { sessionId: '', success: false, error: error.message }
      }

      this.sessionId = data.id
      this.startTime = new Date()
      
      return { sessionId: data.id, success: true }
    } catch (error) {
      console.error('Unexpected error starting session:', error)
      return { 
        sessionId: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Resume an existing session
   */
  async resumeSession(
    sessionId: string,
    scenarioConfig: ScenarioConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get session data from database
      const { data: session, error } = await this.supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error || !session) {
        return { success: false, error: 'Session not found' }
      }

      if (session.completed_at) {
        return { success: false, error: 'Session already completed' }
      }

      this.sessionId = sessionId
      
      // Restore scenario state manager
      const currentState = scenarioConfig.states[scenarioConfig.initialState.id]
      if (!currentState) {
        return { success: false, error: 'Invalid session state' }
      }

      this.scenarioStateManager = new ScenarioStateManager(currentState)
      
      // Restore state history if available
      const sessionData = session.session_data as unknown as SessionData
      if (sessionData.state_history) {
        // Replay state history to restore scenario state manager
        for (const stateId of sessionData.state_history.slice(1)) {
          const state = scenarioConfig.states[stateId]
          if (state) {
            this.scenarioStateManager.updateState(state)
          }
        }
      }

      // Resume session in database
      await this.supabase
        .from('training_sessions')
        .update({ 
          session_data: session.session_data
        } as any)
        .eq('id', sessionId)

      this.startTime = new Date()
      this.totalPausedTime = 0

      return { success: true }
    } catch (error) {
      console.error('Error resuming session:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Pause the current session
   */
  async pauseSession(): Promise<{ success: boolean; error?: string }> {
    if (!this.sessionId) {
      return { success: false, error: 'No active session' }
    }

    try {
      this.pauseTime = new Date()
      
      // Update session in database
      const { error } = await this.supabase
        .from('training_sessions')
        .update({ 
          session_data: {}
        } as any)
        .eq('id', this.sessionId)

      if (error) {
        console.error('Error pausing session:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error pausing session:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Record a decision made during the session
   */
  async recordDecision(
    stateId: string,
    decisionText: string,
    timeTakenMs: number,
    scoreImpact: number,
    consequences: any[],
    userConfidence?: number
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.sessionId || !this.scenarioStateManager) {
      return { success: false, error: 'No active session' }
    }

    try {
      // Record decision in database
      const { data, error } = await this.supabase
        .from('decisions')
        .insert({
          session_id: this.sessionId,
          state_id: stateId,
          decision_text: decisionText,
          time_taken: timeTakenMs,
          score_impact: scoreImpact,
          consequences,
          user_confidence: userConfidence
        })
        .select('*')
        .single()

      if (error) {
        console.error('Error recording decision:', error)
        return { success: false, error: error.message }
      }

      // Update session data
      await this.updateSessionData()

      return { success: true }
    } catch (error) {
      console.error('Unexpected error recording decision:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Update the current state of the session
   */
  async updateCurrentState(newStateId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.sessionId) {
      return { success: false, error: 'No active session' }
    }

    try {
      const { error } = await this.supabase
        .from('training_sessions')
        .update({ session_data: {} } as any)
        .eq('id', this.sessionId)

      if (error) {
        console.error('Error updating session state:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error updating session state:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Complete the current session
   */
  async completeSession(finalScore: number): Promise<{ success: boolean; error?: string }> {
    if (!this.sessionId) {
      return { success: false, error: 'No active session' }
    }

    try {
      // Calculate final time spent
      const completedAt = new Date()
      let totalTimeSpent = this.totalPausedTime

      if (this.startTime && !this.pauseTime) {
        // Session was never paused, add current session time
        totalTimeSpent += Math.floor((completedAt.getTime() - this.startTime.getTime()) / 1000)
      } else if (this.startTime && this.pauseTime) {
        // Session was paused, add time from resume to completion
        totalTimeSpent += Math.floor((completedAt.getTime() - this.startTime.getTime()) / 1000)
      }

      // Update session as completed
      const { error } = await this.supabase
        .from('training_sessions')
        .update({
          completed_at: completedAt.toISOString(),
          final_score: finalScore,
          session_data: {}
        } as any)
        .eq('id', this.sessionId)

      if (error) {
        console.error('Error completing session:', error)
        return { success: false, error: error.message }
      }

      // Update user statistics
      await this.updateUserStats(finalScore)

      // Clear session state
      this.sessionId = null
      this.scenarioStateManager = null
      this.startTime = null
      this.pauseTime = null
      this.totalPausedTime = 0

      return { success: true }
    } catch (error) {
      console.error('Unexpected error completing session:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get current session metrics
   */
  async getSessionMetrics(): Promise<SessionMetrics | null> {
    if (!this.sessionId) {
      return null
    }

    try {
      // Get session data
      const { data: session, error: sessionError } = await this.supabase
        .from('training_sessions')
        .select('*')
        .eq('id', this.sessionId)
        .single()

      if (sessionError || !session) {
        return null
      }

      // Get decisions for this session
      const { data: decisions, error: decisionsError } = await this.supabase
        .from('decisions')
        .select('time_taken, score_impact')
        .eq('session_id', this.sessionId)

      if (decisionsError) {
        console.error('Error fetching decisions for metrics:', decisionsError)
        return null
      }

      const sessionData = session.session_data as unknown as SessionData
      const totalTime = this.calculateCurrentSessionTime()
      const averageDecisionTime = decisions && decisions.length > 0 
        ? decisions.reduce((sum, d) => sum + (d.time_taken || 0), 0) / decisions.length
        : 0
      const currentScore = decisions && decisions.length > 0
        ? decisions.reduce((sum, d) => sum + (d.score_impact || 0), 0)
        : 0

      return {
        totalTime,
        averageDecisionTime,
        pauseCount: sessionData.pause_count || 0,
        decisionsCount: decisions?.length || 0,
        currentScore
      }
    } catch (error) {
      console.error('Error calculating session metrics:', error)
      return null
    }
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<TrainingSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('training_sessions')
        .select(`
          *,
          scenarios (
            title,
            domain,
            difficulty_level
          )
        `)
        .eq('user_id', userId)
        .is('completed_at', null)
        .order('started_at', { ascending: false })

      if (error) {
        console.error('Error fetching active sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Unexpected error fetching active sessions:', error)
      return []
    }
  }

  /**
   * Create recovery data for session persistence
   */
  async createRecoveryData(): Promise<SessionRecoveryData | null> {
    if (!this.sessionId || !this.scenarioStateManager) {
      return null
    }

    try {
      const { data: decisions, error } = await this.supabase
        .from('decisions')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('Error fetching decisions for recovery:', error)
        return null
      }

      const recoveryData: SessionRecoveryData = {
        currentStateId: this.scenarioStateManager.getCurrentState().id,
        stateHistory: this.scenarioStateManager.getStateHistory(),
        decisionHistory: decisions?.map(d => ({
          id: d.id,
          session_id: d.session_id,
          state_id: d.state_id,
          decision_text: d.decision_text,
          timestamp: d.timestamp,
          time_taken_ms: d.time_taken || 0,
          score_impact: d.score_impact || 0,
          consequences: d.consequences as any[],
          user_confidence: d.user_confidence
        })) || [],
        timeSpentSeconds: this.calculateCurrentSessionTime(),
        pauseCount: 0, // Will be updated from database
        lastActivity: new Date().toISOString()
      }

      // Save recovery data to session
      await this.supabase
        .from('training_sessions')
        .update({
          session_data: recoveryData
        } as any)
        .eq('id', this.sessionId)

      return recoveryData
    } catch (error) {
      console.error('Error creating recovery data:', error)
      return null
    }
  }

  /**
   * Private helper methods
   */
  private async updateSessionData(): Promise<void> {
    if (!this.sessionId || !this.scenarioStateManager) return

    try {
      const { data: decisions, error } = await this.supabase
        .from('decisions')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('Error fetching decisions for session data update:', error)
        return
      }

      const sessionData: SessionData = {
        decisions_made: decisions?.map(d => ({
          id: d.id,
          session_id: d.session_id,
          state_id: d.state_id,
          decision_text: d.decision_text,
          timestamp: d.timestamp,
          time_taken_ms: d.time_taken || 0,
          score_impact: d.score_impact || 0,
          consequences: d.consequences as any[],
          user_confidence: d.user_confidence
        })) || [],
        state_history: this.scenarioStateManager.getStateHistory(),
        time_spent_seconds: this.calculateCurrentSessionTime(),
        pause_count: 0, // Will be updated by database trigger
        hints_used: 0,
        current_context: {}
      }

      await this.supabase
        .from('training_sessions')
        .update({ session_data: sessionData } as any)
        .eq('id', this.sessionId)
    } catch (error) {
      console.error('Error updating session data:', error)
    }
  }

  private calculateCurrentSessionTime(): number {
    if (!this.startTime) return this.totalPausedTime

    const now = new Date()
    const currentSessionTime = Math.floor((now.getTime() - this.startTime.getTime()) / 1000)
    return this.totalPausedTime + currentSessionTime
  }

  private async updateUserStats(sessionScore: number): Promise<void> {
    try {
      // This would typically call a database function to update user statistics
      // For now, we'll implement a simple version
      const { data: session } = await this.supabase
        .from('training_sessions')
        .select('user_id')
        .eq('id', this.sessionId)
        .single()

      if (!session) return

      // Update user profile statistics
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('total_scenarios_completed, average_score')
        .eq('id', session.user_id)
        .single()

      if (profile) {
        const newTotal = profile.total_scenarios_completed + 1
        const newAverage = ((profile.average_score * profile.total_scenarios_completed) + sessionScore) / newTotal

        await this.supabase
          .from('user_profiles')
          .update({
            total_scenarios_completed: newTotal,
            average_score: Math.round(newAverage * 100) / 100
          })
          .eq('id', session.user_id)
      }
    } catch (error) {
      console.error('Error updating user stats:', error)
    }
  }

  /**
   * Getters for current session state
   */
  get currentSessionId(): string | null {
    return this.sessionId
  }

  get isSessionActive(): boolean {
    return this.sessionId !== null && this.scenarioStateManager !== null
  }

  get scenarioState(): ScenarioStateManager | null {
    return this.scenarioStateManager
  }
}