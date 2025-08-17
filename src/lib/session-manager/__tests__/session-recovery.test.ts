import { SessionRecovery } from '../session-recovery'
import { TrainingSessionManager } from '../training-session-manager'
import { ScenarioConfig } from '../../types'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        gte: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      is: jest.fn(() => ({
        lt: jest.fn(() => ({
          eq: jest.fn()
        }))
      })),
      lt: jest.fn()
    })),
    update: jest.fn(() => ({
      eq: jest.fn(),
      is: jest.fn(() => ({
        lt: jest.fn()
      }))
    }))
  }))
} as any

describe('SessionRecovery', () => {
  let sessionRecovery: SessionRecovery
  let mockScenarioConfig: ScenarioConfig

  beforeEach(() => {
    sessionRecovery = new SessionRecovery(mockSupabase)
    
    mockScenarioConfig = {
      id: 'test-scenario',
      title: 'Test Crisis Scenario',
      domain: 'cybersecurity',
      difficulty_level: 1,
      initialState: {
        id: 'initial-state',
        description: 'Test scenario',
        context: 'Test context',
        decisions: [],
        environmentalFactors: [],
        characters: [],
        riskLevel: 'medium',
        criticalityScore: 5
      },
      states: {
        'initial-state': {
          id: 'initial-state',
          description: 'Test scenario',
          context: 'Test context',
          decisions: [],
          environmentalFactors: [],
          characters: [],
          riskLevel: 'medium',
          criticalityScore: 5
        },
        'state-2': {
          id: 'state-2',
          description: 'Second state',
          context: 'Second context',
          decisions: [],
          environmentalFactors: [],
          characters: [],
          riskLevel: 'medium',
          criticalityScore: 5
        }
      },
      branches: [],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      version: '1.0',
      tags: []
    }

    jest.clearAllMocks()
  })

  describe('findRecoverableSessions', () => {
    it('should find recoverable sessions for a user', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          started_at: '2024-01-01T10:00:00Z',
          current_state_id: 'state-1',
          is_paused: false,
          time_spent_seconds: 300,
          session_data: {
            decisions_made: [
              {
                id: 'decision-1',
                timestamp: '2024-01-01T10:05:00Z'
              }
            ],
            state_history: ['initial-state', 'state-1']
          },
          scenarios: {
            title: 'Test Scenario',
            domain: 'cybersecurity',
            config: mockScenarioConfig
          }
        }
      ]

      mockSupabase.from().select().eq().is().gte.mockResolvedValue({
        data: mockSessions,
        error: null
      })

      const result = await sessionRecovery.findRecoverableSessions('user-id')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        sessionId: 'session-1',
        scenarioTitle: 'Test Scenario',
        domain: 'cybersecurity',
        isPaused: false,
        timeSpent: 300
      })
    })

    it('should handle database errors when finding sessions', async () => {
      mockSupabase.from().select().eq().is().gte.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await sessionRecovery.findRecoverableSessions('user-id')

      expect(result).toEqual([])
    })

    it('should sort sessions by different criteria', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          started_at: '2024-01-01T10:00:00Z',
          current_state_id: 'state-1',
          is_paused: false,
          time_spent_seconds: 100,
          session_data: {
            decisions_made: [{ timestamp: '2024-01-01T10:05:00Z' }],
            state_history: ['initial-state']
          },
          scenarios: {
            title: 'Scenario 1',
            domain: 'cybersecurity',
            config: mockScenarioConfig
          }
        },
        {
          id: 'session-2',
          started_at: '2024-01-01T11:00:00Z',
          current_state_id: 'state-2',
          is_paused: false,
          time_spent_seconds: 200,
          session_data: {
            decisions_made: [{ timestamp: '2024-01-01T11:05:00Z' }],
            state_history: ['initial-state', 'state-2']
          },
          scenarios: {
            title: 'Scenario 2',
            domain: 'healthcare',
            config: mockScenarioConfig
          }
        }
      ]

      mockSupabase.from().select().eq().is().gte.mockResolvedValue({
        data: mockSessions,
        error: null
      })

      // Test sorting by time spent
      const resultByTime = await sessionRecovery.findRecoverableSessions('user-id', {
        sortBy: 'time_spent'
      })

      expect(resultByTime[0].sessionId).toBe('session-2') // Higher time spent first
      expect(resultByTime[1].sessionId).toBe('session-1')
    })
  })

  describe('canRecoverSession', () => {
    it('should confirm session can be recovered', async () => {
      const mockSession = {
        id: 'session-1',
        completed_at: null,
        started_at: '2024-01-01T10:00:00Z',
        current_state_id: 'state-1',
        session_data: {
          decisions_made: [],
          state_history: ['initial-state']
        },
        scenarios: {
          title: 'Test Scenario',
          domain: 'cybersecurity',
          is_active: true,
          config: mockScenarioConfig
        }
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockSession,
        error: null
      })

      const result = await sessionRecovery.canRecoverSession('session-1')

      expect(result.canRecover).toBe(true)
      expect(result.session).toBeDefined()
      expect(result.session?.sessionId).toBe('session-1')
    })

    it('should reject completed sessions', async () => {
      const mockSession = {
        id: 'session-1',
        completed_at: '2024-01-01T12:00:00Z',
        started_at: '2024-01-01T10:00:00Z'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockSession,
        error: null
      })

      const result = await sessionRecovery.canRecoverSession('session-1')

      expect(result.canRecover).toBe(false)
      expect(result.reason).toBe('Session already completed')
    })

    it('should reject sessions with inactive scenarios', async () => {
      const mockSession = {
        id: 'session-1',
        completed_at: null,
        started_at: '2024-01-01T10:00:00Z',
        scenarios: {
          is_active: false
        }
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockSession,
        error: null
      })

      const result = await sessionRecovery.canRecoverSession('session-1')

      expect(result.canRecover).toBe(false)
      expect(result.reason).toBe('Scenario is no longer active')
    })

    it('should reject sessions that are too old', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10) // 10 days ago

      const mockSession = {
        id: 'session-1',
        completed_at: null,
        started_at: oldDate.toISOString(),
        current_state_id: 'state-1',
        session_data: { decisions_made: [] },
        scenarios: {
          is_active: true
        }
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockSession,
        error: null
      })

      const result = await sessionRecovery.canRecoverSession('session-1')

      expect(result.canRecover).toBe(false)
      expect(result.reason).toBe('Session is too old to recover')
    })
  })

  describe('recoverSession', () => {
    it('should successfully recover a session', async () => {
      const mockSession = {
        id: 'session-1',
        completed_at: null,
        started_at: '2024-01-01T10:00:00Z',
        current_state_id: 'state-1',
        session_data: {
          decisions_made: [],
          state_history: ['initial-state']
        },
        scenarios: {
          title: 'Test Scenario',
          domain: 'cybersecurity',
          is_active: true,
          config: mockScenarioConfig
        }
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockSession,
        error: null
      })

      const mockSessionManager = {
        resumeSession: jest.fn().mockResolvedValue({ success: true })
      } as any

      const result = await sessionRecovery.recoverSession(
        'session-1',
        mockScenarioConfig,
        mockSessionManager
      )

      expect(result.success).toBe(true)
      expect(mockSessionManager.resumeSession).toHaveBeenCalledWith('session-1', mockScenarioConfig)
    })

    it('should fail to recover unrecoverable session', async () => {
      const mockSession = {
        id: 'session-1',
        completed_at: '2024-01-01T12:00:00Z'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockSession,
        error: null
      })

      const mockSessionManager = {} as any

      const result = await sessionRecovery.recoverSession(
        'session-1',
        mockScenarioConfig,
        mockSessionManager
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session already completed')
    })
  })

  describe('abandonSession', () => {
    it('should successfully abandon a session', async () => {
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await sessionRecovery.abandonSession('session-1', 'User requested')

      expect(result.success).toBe(true)
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        completed_at: expect.any(String),
        session_data: {
          abandoned: true,
          abandon_reason: 'User requested',
          abandon_timestamp: expect.any(String)
        }
      })
    })

    it('should handle database errors when abandoning', async () => {
      const mockError = { message: 'Update failed' }
      mockSupabase.from().update().eq.mockResolvedValue({
        error: mockError
      })

      const result = await sessionRecovery.abandonSession('session-1', 'User requested')

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('cleanupOldSessions', () => {
    it('should clean up old sessions', async () => {
      mockSupabase.from().update().is().lt.mockResolvedValue({
        error: null,
        count: 3
      })

      const result = await sessionRecovery.cleanupOldSessions('user-id', 168)

      expect(result.cleaned).toBe(3)
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        completed_at: expect.any(String),
        session_data: {
          abandoned: true,
          abandon_reason: 'Automatic cleanup - session too old',
          abandon_timestamp: expect.any(String)
        }
      })
    })
  })

  describe('getRecoveryStats', () => {
    it('should return recovery statistics', async () => {
      const mockSessions = [
        {
          completed_at: null,
          session_data: {},
          started_at: '2024-01-01T10:00:00Z'
        },
        {
          completed_at: '2024-01-01T12:00:00Z',
          session_data: { abandoned: true },
          started_at: '2024-01-01T10:00:00Z'
        },
        {
          completed_at: '2024-01-01T11:00:00Z',
          session_data: {},
          started_at: '2024-01-01T10:00:00Z'
        }
      ]

      mockSupabase.from().select().eq.mockResolvedValue({
        data: mockSessions,
        error: null
      })

      const result = await sessionRecovery.getRecoveryStats('user-id')

      expect(result.totalSessions).toBe(3)
      expect(result.recoverableSessions).toBe(1)
      expect(result.abandonedSessions).toBe(1)
      expect(typeof result.averageRecoveryTime).toBe('number')
    })

    it('should handle database errors when getting stats', async () => {
      mockSupabase.from().select().eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await sessionRecovery.getRecoveryStats('user-id')

      expect(result.totalSessions).toBe(0)
      expect(result.recoverableSessions).toBe(0)
      expect(result.abandonedSessions).toBe(0)
      expect(result.averageRecoveryTime).toBe(0)
    })
  })
})