import { TrainingSessionManager } from '../training-session-manager'
import { ScenarioConfig, GenerationContext } from '../../types'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn()
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      is: jest.fn(() => ({
        order: jest.fn()
      }))
    }))
  }))
} as any

describe('TrainingSessionManager', () => {
  let sessionManager: TrainingSessionManager
  let mockScenarioConfig: ScenarioConfig
  let mockConfiguration: GenerationContext

  beforeEach(() => {
    sessionManager = new TrainingSessionManager(mockSupabase)
    
    mockScenarioConfig = {
      id: 'test-scenario',
      title: 'Test Crisis Scenario',
      domain: 'cybersecurity',
      difficulty_level: 1,
      initialState: {
        id: 'initial-state',
        description: 'A critical security breach has been detected',
        context: 'Your company\'s main server has been compromised',
        decisions: [
          {
            id: 'decision-1',
            text: 'Immediately shut down all systems',
            consequences: [],
            nextStateId: 'state-2',
            riskLevel: 'high'
          }
        ],
        timeLimit: 300,
        environmentalFactors: ['High stress', 'Limited information'],
        characters: [],
        riskLevel: 'high',
        criticalityScore: 8
      },
      states: {
        'initial-state': {
          id: 'initial-state',
          description: 'A critical security breach has been detected',
          context: 'Your company\'s main server has been compromised',
          decisions: [],
          environmentalFactors: [],
          characters: [],
          riskLevel: 'high',
          criticalityScore: 8
        }
      },
      branches: [],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      version: '1.0',
      tags: ['cybersecurity', 'crisis']
    }

    mockConfiguration = {
      domain: 'cybersecurity',
      jobRole: 'security-analyst',
      riskProfile: 'balanced',
      scenarioHistory: []
    }

    jest.clearAllMocks()
  })

  describe('startSession', () => {
    it('should successfully start a new training session', async () => {
      const mockSessionId = 'test-session-id'
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: mockSessionId },
        error: null
      })

      const result = await sessionManager.startSession(
        'user-id',
        'scenario-id',
        mockConfiguration,
        mockScenarioConfig
      )

      expect(result.success).toBe(true)
      expect(result.sessionId).toBe(mockSessionId)
      expect(mockSupabase.from).toHaveBeenCalledWith('training_sessions')
    })

    it('should handle database errors when starting session', async () => {
      const mockError = { message: 'Database connection failed' }
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await sessionManager.startSession(
        'user-id',
        'scenario-id',
        mockConfiguration,
        mockScenarioConfig
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('pauseSession', () => {
    it('should successfully pause an active session', async () => {
      // First start a session
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-session-id' },
        error: null
      })

      await sessionManager.startSession(
        'user-id',
        'scenario-id',
        mockConfiguration,
        mockScenarioConfig
      )

      // Mock successful pause
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await sessionManager.pauseSession()

      expect(result.success).toBe(true)
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        is_paused: true,
        paused_at: expect.any(String)
      })
    })

    it('should fail to pause when no active session', async () => {
      const result = await sessionManager.pauseSession()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No active session')
    })
  })

  describe('recordDecision', () => {
    it('should successfully record a decision', async () => {
      // Start a session first
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-session-id' },
        error: null
      })

      await sessionManager.startSession(
        'user-id',
        'scenario-id',
        mockConfiguration,
        mockScenarioConfig
      )

      // Mock successful decision recording
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'decision-id' },
        error: null
      })

      // Mock session data update
      mockSupabase.from().select().eq().order().single.mockResolvedValue({
        data: [],
        error: null
      })
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await sessionManager.recordDecision(
        'state-1',
        'Test decision',
        5000,
        10,
        [{ type: 'direct', description: 'Immediate effect', impact_score: 5 }],
        4
      )

      expect(result.success).toBe(true)
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        session_id: 'test-session-id',
        state_id: 'state-1',
        decision_text: 'Test decision',
        time_taken: 5000,
        score_impact: 10,
        consequences: [{ type: 'direct', description: 'Immediate effect', impact_score: 5 }],
        user_confidence: 4
      })
    })

    it('should fail to record decision when no active session', async () => {
      const result = await sessionManager.recordDecision(
        'state-1',
        'Test decision',
        5000,
        10,
        []
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('No active session')
    })
  })

  describe('completeSession', () => {
    it('should successfully complete a session', async () => {
      // Start a session first
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-session-id' },
        error: null
      })

      await sessionManager.startSession(
        'user-id',
        'scenario-id',
        mockConfiguration,
        mockScenarioConfig
      )

      // Mock successful completion
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      // Mock user stats update
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { user_id: 'user-id' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { total_scenarios_completed: 5, average_score: 75 },
          error: null
        })

      const result = await sessionManager.completeSession(85)

      expect(result.success).toBe(true)
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        completed_at: expect.any(String),
        final_score: 85,
        time_spent_seconds: expect.any(Number),
        is_paused: false
      })
    })

    it('should fail to complete when no active session', async () => {
      const result = await sessionManager.completeSession(85)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No active session')
    })
  })

  describe('resumeSession', () => {
    it('should successfully resume a paused session', async () => {
      const mockSessionData = {
        id: 'test-session-id',
        completed_at: null,
        current_state_id: 'initial-state',
        session_data: {
          decisions_made: [],
          state_history: ['initial-state'],
          time_spent_seconds: 100,
          pause_count: 1,
          hints_used: 0,
          current_context: {}
        },
        time_spent_seconds: 100
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockSessionData,
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await sessionManager.resumeSession('test-session-id', mockScenarioConfig)

      expect(result.success).toBe(true)
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        is_paused: false,
        resumed_at: expect.any(String)
      })
    })

    it('should fail to resume completed session', async () => {
      const mockSessionData = {
        id: 'test-session-id',
        completed_at: '2024-01-01T12:00:00Z',
        current_state_id: 'initial-state'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockSessionData,
        error: null
      })

      const result = await sessionManager.resumeSession('test-session-id', mockScenarioConfig)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session already completed')
    })
  })

  describe('getActiveSessions', () => {
    it('should return active sessions for a user', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          user_id: 'user-id',
          started_at: '2024-01-01T10:00:00Z',
          scenarios: {
            title: 'Test Scenario',
            domain: 'cybersecurity',
            difficulty_level: 1
          }
        }
      ]

      mockSupabase.from().select().eq().is().order.mockResolvedValue({
        data: mockSessions,
        error: null
      })

      const result = await sessionManager.getActiveSessions('user-id')

      expect(result).toEqual(mockSessions)
      expect(mockSupabase.from().select).toHaveBeenCalledWith(`
          *,
          scenarios (
            title,
            domain,
            difficulty_level
          )
        `)
    })

    it('should handle database errors when fetching active sessions', async () => {
      mockSupabase.from().select().eq().is().order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await sessionManager.getActiveSessions('user-id')

      expect(result).toEqual([])
    })
  })
})