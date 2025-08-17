import { SessionPersistence } from '../session-persistence'
import { SessionData } from '../../types'

// Mock Supabase client
const mockSupabase = {
  channel: jest.fn(() => ({
    on: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      }))
    }))
  })),
  removeChannel: jest.fn(),
  from: jest.fn(() => ({
    update: jest.fn(() => ({
      eq: jest.fn()
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
} as any

describe('SessionPersistence', () => {
  let sessionPersistence: SessionPersistence
  let mockSessionData: SessionData

  beforeEach(() => {
    sessionPersistence = new SessionPersistence(mockSupabase, {
      autoSave: true,
      syncInterval: 1000,
      enableRealtime: true
    })

    mockSessionData = {
      decisions_made: [
        {
          id: 'decision-1',
          session_id: 'session-1',
          state_id: 'state-1',
          decision_text: 'Test decision',
          timestamp: '2024-01-01T10:00:00Z',
          time_taken_ms: 5000,
          score_impact: 10,
          consequences: []
        }
      ],
      state_history: ['initial-state', 'state-1'],
      time_spent_seconds: 300,
      pause_count: 0,
      hints_used: 0,
      current_context: {}
    }

    jest.clearAllMocks()
  })

  afterEach(async () => {
    await sessionPersistence.cleanup()
  })

  describe('initializeSync', () => {
    it('should successfully initialize real-time sync', async () => {
      const mockChannel = {
        on: jest.fn(() => ({
          on: jest.fn(() => ({
            subscribe: jest.fn()
          }))
        }))
      }
      mockSupabase.channel.mockReturnValue(mockChannel)

      const result = await sessionPersistence.initializeSync('test-session-id')

      expect(result.success).toBe(true)
      expect(mockSupabase.channel).toHaveBeenCalledWith('session_test-session-id')
    })

    it('should handle initialization errors', async () => {
      mockSupabase.channel.mockImplementation(() => {
        throw new Error('Connection failed')
      })

      const result = await sessionPersistence.initializeSync('test-session-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection failed')
    })
  })

  describe('syncUpdate', () => {
    it('should successfully sync session update', async () => {
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const updateData = { is_paused: true }
      const result = await sessionPersistence.syncUpdate('session-id', updateData)

      expect(result.success).toBe(true)
      expect(mockSupabase.from().update).toHaveBeenCalledWith(updateData)
    })

    it('should handle sync errors', async () => {
      const mockError = { message: 'Sync failed' }
      mockSupabase.from().update().eq.mockResolvedValue({
        error: mockError
      })

      const result = await sessionPersistence.syncUpdate('session-id', { is_paused: true })

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('saveSessionState', () => {
    it('should save session state without conflicts', async () => {
      const currentSession = {
        session_data: mockSessionData,
        updated_at: '2024-01-01T09:00:00Z',
        current_state_id: 'state-1'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: currentSession,
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await sessionPersistence.saveSessionState(
        'session-id',
        mockSessionData,
        'state-2'
      )

      expect(result.success).toBe(true)
      expect(result.conflictResolved).toBeFalsy()
    })

    it('should resolve conflicts when server data is newer', async () => {
      const serverSessionData: SessionData = {
        ...mockSessionData,
        decisions_made: [
          ...mockSessionData.decisions_made,
          {
            id: 'decision-2',
            session_id: 'session-1',
            state_id: 'state-2',
            decision_text: 'Server decision',
            timestamp: '2024-01-01T10:30:00Z',
            time_taken_ms: 3000,
            score_impact: 5,
            consequences: []
          }
        ]
      }

      const currentSession = {
        session_data: serverSessionData,
        updated_at: new Date(Date.now() + 10000).toISOString(), // Future timestamp
        current_state_id: 'state-2'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: currentSession,
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await sessionPersistence.saveSessionState(
        'session-id',
        mockSessionData
      )

      expect(result.success).toBe(true)
      expect(result.conflictResolved).toBe(true)
    })
  })

  describe('loadSessionState', () => {
    it('should successfully load session state', async () => {
      const sessionData = {
        session_data: mockSessionData,
        current_state_id: 'state-1'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: sessionData,
        error: null
      })

      const result = await sessionPersistence.loadSessionState('session-id')

      expect(result.success).toBe(true)
      expect(result.sessionData).toEqual(mockSessionData)
      expect(result.currentStateId).toBe('state-1')
    })

    it('should handle load errors', async () => {
      const mockError = { message: 'Session not found' }
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await sessionPersistence.loadSessionState('session-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
      expect(result.sessionData).toBeNull()
    })
  })

  describe('createCheckpoint', () => {
    it('should successfully create a checkpoint', async () => {
      const sessionData = {
        session_data: mockSessionData,
        current_state_id: 'state-1'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: sessionData,
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await sessionPersistence.createCheckpoint('session-id', 'checkpoint-1')

      expect(result.success).toBe(true)
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        recovery_data: {
          checkpoints: [expect.objectContaining({
            name: 'checkpoint-1',
            session_data: mockSessionData,
            current_state_id: 'state-1'
          })],
          last_checkpoint: 'checkpoint-1'
        }
      })
    })
  })

  describe('restoreFromCheckpoint', () => {
    it('should successfully restore from checkpoint', async () => {
      const recoveryData = {
        checkpoints: [
          {
            name: 'checkpoint-1',
            timestamp: '2024-01-01T10:00:00Z',
            session_data: mockSessionData,
            current_state_id: 'state-1'
          }
        ]
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { recovery_data: recoveryData },
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await sessionPersistence.restoreFromCheckpoint('session-id', 'checkpoint-1')

      expect(result.success).toBe(true)
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        session_data: mockSessionData,
        current_state_id: 'state-1'
      })
    })

    it('should fail when checkpoint not found', async () => {
      const recoveryData = {
        checkpoints: []
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { recovery_data: recoveryData },
        error: null
      })

      const result = await sessionPersistence.restoreFromCheckpoint('session-id', 'nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Checkpoint not found')
    })
  })

  describe('queueUpdate', () => {
    it('should queue updates for later synchronization', () => {
      sessionPersistence.queueUpdate('session-1', { is_paused: true })
      sessionPersistence.queueUpdate('session-1', { current_state_id: 'state-2' })

      const status = sessionPersistence.getSyncStatus()
      expect(status.pendingUpdates).toBe(1) // Should merge updates for same session
    })
  })

  describe('getSyncStatus', () => {
    it('should return current sync status', () => {
      const status = sessionPersistence.getSyncStatus()

      expect(status).toHaveProperty('isConnected')
      expect(status).toHaveProperty('pendingUpdates')
      expect(status).toHaveProperty('lastSyncTime')
      expect(typeof status.pendingUpdates).toBe('number')
    })
  })
})