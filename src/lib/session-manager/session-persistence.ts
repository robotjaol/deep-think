import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'
import { TrainingSession, SessionData } from '../types'

export interface SessionSyncOptions {
  autoSave: boolean
  syncInterval: number // milliseconds
  enableRealtime: boolean
}

export interface SessionUpdateEvent {
  type: 'state_change' | 'decision_made' | 'pause' | 'resume' | 'complete'
  sessionId: string
  data: any
  timestamp: string
}

/**
 * SessionPersistence handles real-time synchronization of session data
 * with automatic saving and conflict resolution
 */
export class SessionPersistence {
  private supabase: SupabaseClient<Database>
  private channel: RealtimeChannel | null = null
  private syncInterval: NodeJS.Timeout | null = null
  private pendingUpdates: Map<string, any> = new Map()
  private lastSyncTime: Date = new Date()
  private options: SessionSyncOptions

  constructor(
    supabase: SupabaseClient<Database>,
    options: Partial<SessionSyncOptions> = {}
  ) {
    this.supabase = supabase
    this.options = {
      autoSave: true,
      syncInterval: 5000, // 5 seconds
      enableRealtime: true,
      ...options
    }
  }

  /**
   * Initialize real-time synchronization for a session
   */
  async initializeSync(
    sessionId: string,
    onUpdate?: (event: SessionUpdateEvent) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.options.enableRealtime) {
        // Set up real-time subscription
        this.channel = this.supabase
          .channel(`session_${sessionId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'training_sessions',
              filter: `id=eq.${sessionId}`
            },
            (payload) => {
              if (onUpdate) {
                onUpdate({
                  type: 'state_change',
                  sessionId,
                  data: payload.new,
                  timestamp: new Date().toISOString()
                })
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'decisions',
              filter: `session_id=eq.${sessionId}`
            },
            (payload) => {
              if (onUpdate) {
                onUpdate({
                  type: 'decision_made',
                  sessionId,
                  data: payload.new,
                  timestamp: new Date().toISOString()
                })
              }
            }
          )
          .subscribe()
      }

      if (this.options.autoSave) {
        // Set up periodic sync
        this.syncInterval = setInterval(() => {
          this.syncPendingUpdates()
        }, this.options.syncInterval)
      }

      return { success: true }
    } catch (error) {
      console.error('Error initializing session sync:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Queue a session update for synchronization
   */
  queueUpdate(sessionId: string, updateData: Partial<TrainingSession>): void {
    const existingUpdate = this.pendingUpdates.get(sessionId) || {}
    this.pendingUpdates.set(sessionId, {
      ...existingUpdate,
      ...updateData,
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Immediately sync a session update
   */
  async syncUpdate(
    sessionId: string,
    updateData: Partial<TrainingSession>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('training_sessions')
        .update(updateData as any)
        .eq('id', sessionId)

      if (error) {
        console.error('Error syncing session update:', error)
        return { success: false, error: error.message }
      }

      this.lastSyncTime = new Date()
      return { success: true }
    } catch (error) {
      console.error('Unexpected error syncing session update:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Sync all pending updates
   */
  async syncPendingUpdates(): Promise<void> {
    if (this.pendingUpdates.size === 0) return

    const updates = Array.from(this.pendingUpdates.entries())
    this.pendingUpdates.clear()

    for (const [sessionId, updateData] of updates) {
      try {
        await this.syncUpdate(sessionId, updateData)
      } catch (error) {
        console.error(`Error syncing update for session ${sessionId}:`, error)
        // Re-queue failed update
        this.pendingUpdates.set(sessionId, updateData)
      }
    }
  }

  /**
   * Save session state with conflict resolution
   */
  async saveSessionState(
    sessionId: string,
    sessionData: SessionData,
    currentStateId?: string
  ): Promise<{ success: boolean; error?: string; conflictResolved?: boolean }> {
    try {
      // Get current session from database to check for conflicts
      const { data: currentSession, error: fetchError } = await this.supabase
        .from('training_sessions')
        .select('session_data, updated_at')
        .eq('id', sessionId)
        .single()

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      // Check for conflicts
      const serverUpdatedAt = new Date(currentSession.updated_at)
      const hasConflict = serverUpdatedAt > this.lastSyncTime

      let finalSessionData = sessionData
      let conflictResolved = false

      if (hasConflict) {
        // Resolve conflicts by merging data
        const serverSessionData = currentSession.session_data as unknown as SessionData
        finalSessionData = this.resolveSessionDataConflict(serverSessionData, sessionData)
        conflictResolved = true
      }

      // Update session
      const updateData: any = {
        session_data: finalSessionData
      }

      if (currentStateId) {
        updateData.current_state_id = currentStateId
      }

      const { error: updateError } = await this.supabase
        .from('training_sessions')
        .update(updateData as any)
        .eq('id', sessionId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      this.lastSyncTime = new Date()
      return { success: true, conflictResolved }
    } catch (error) {
      console.error('Error saving session state:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Load session state from database
   */
  async loadSessionState(sessionId: string): Promise<{
    sessionData: SessionData | null
    currentStateId: string | null
    success: boolean
    error?: string
  }> {
    try {
      const { data, error } = await this.supabase
        .from('training_sessions')
        .select('session_data')
        .eq('id', sessionId)
        .single()

      if (error) {
        return {
          sessionData: null,
          currentStateId: null,
          success: false,
          error: error.message
        }
      }

      return {
        sessionData: data.session_data as unknown as SessionData,
        currentStateId: null,
        success: true
      }
    } catch (error) {
      console.error('Error loading session state:', error)
      return {
        sessionData: null,
        currentStateId: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a session backup/checkpoint
   */
  async createCheckpoint(
    sessionId: string,
    checkpointName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: session, error: fetchError } = await this.supabase
        .from('training_sessions')
        .select('session_data')
        .eq('id', sessionId)
        .single()

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      const checkpoint = {
        name: checkpointName,
        timestamp: new Date().toISOString(),
        session_data: session.session_data,
        current_state_id: null
      }

      // Store checkpoint in recovery_data
      const { error: updateError } = await this.supabase
        .from('training_sessions')
        .update({
          session_data: {
            checkpoints: [checkpoint],
            last_checkpoint: checkpointName
          }
        } as any)
        .eq('id', sessionId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error creating checkpoint:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Restore from a checkpoint
   */
  async restoreFromCheckpoint(
    sessionId: string,
    checkpointName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: session, error: fetchError } = await this.supabase
        .from('training_sessions')
        .select('session_data')
        .eq('id', sessionId)
        .single()

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      const recoveryData = session.session_data as any
      const checkpoint = recoveryData?.checkpoints?.find(
        (cp: any) => cp.name === checkpointName
      )

      if (!checkpoint) {
        return { success: false, error: 'Checkpoint not found' }
      }

      // Restore session state from checkpoint
      const { error: updateError } = await this.supabase
        .from('training_sessions')
        .update({
          session_data: checkpoint.session_data
        } as any)
        .eq('id', sessionId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error restoring from checkpoint:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel)
      this.channel = null
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    // Sync any remaining pending updates
    await this.syncPendingUpdates()
  }

  /**
   * Private helper methods
   */
  private resolveSessionDataConflict(
    serverData: SessionData,
    clientData: SessionData
  ): SessionData {
    // Merge strategy: prefer client data for most fields, but merge arrays
    return {
      decisions_made: this.mergeDecisions(serverData.decisions_made, clientData.decisions_made),
      state_history: this.mergeArrays(serverData.state_history, clientData.state_history),
      time_spent_seconds: Math.max(serverData.time_spent_seconds, clientData.time_spent_seconds),
      pause_count: Math.max(serverData.pause_count, clientData.pause_count),
      hints_used: Math.max(serverData.hints_used, clientData.hints_used),
      current_context: { ...serverData.current_context, ...clientData.current_context }
    }
  }

  private mergeDecisions(
    serverDecisions: any[],
    clientDecisions: any[]
  ): any[] {
    const merged = [...serverDecisions]
    
    for (const clientDecision of clientDecisions) {
      const existingIndex = merged.findIndex(d => d.id === clientDecision.id)
      if (existingIndex >= 0) {
        // Update existing decision with client data
        merged[existingIndex] = clientDecision
      } else {
        // Add new decision
        merged.push(clientDecision)
      }
    }
    
    return merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  private mergeArrays<T>(serverArray: T[], clientArray: T[]): T[] {
    // For simple arrays like state_history, prefer the longer one
    return serverArray.length >= clientArray.length ? serverArray : clientArray
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isConnected: boolean
    pendingUpdates: number
    lastSyncTime: Date
  } {
    return {
      isConnected: this.channel?.state === 'joined',
      pendingUpdates: this.pendingUpdates.size,
      lastSyncTime: this.lastSyncTime
    }
  }
}