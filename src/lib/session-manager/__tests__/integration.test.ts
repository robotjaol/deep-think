import { TrainingSessionManager, SessionPersistence, SessionRecovery } from '../index'
import { ScenarioConfig, GenerationContext, SessionData } from '../../types'

// Mock Supabase client with more comprehensive mocking
const createMockSupabase = () => {
  const mockData = {
    sessions: new Map(),
    decisions: new Map(),
    nextId: 1
  }

  return {
    from: jest.fn((table: string) => {
      switch (table) {
        case 'training_sessions':
          return {
            insert: jest.fn((data: any) => ({
              select: jest.fn(() => ({
                single: jest.fn(() => {
                  const id = `session-${mockData.nextId++}`
                  mockData.sessions.set(id, { ...data, id })
                  return Promise.resolve({ data: { id }, error: null })
                })
              }))
            })),
            update: jest.fn((updates: any) => ({
              eq: jest.fn((field: string, value: any) => {
                const session = mockData.sessions.get(value)
                if (session) {
                  mockData.sessions.set(value, { ...session, ...updates })
                }
                return Promise.resolve({ error: null })
              })
            })),
            select: jest.fn((fields: string) => ({
              eq: jest.fn((field: string, value: any) => ({
                single: jest.fn(() => {
                  const session = mockData.sessions.get(value)
                  return Promise.resolve({ 
                    data: session || null, 
                    error: session ? null : { message: 'Not found' }
                  })
                }),
                order: jest.fn(() => Promise.resolve({ data: Array.from(mockData.sessions.values()), error: null }))
              })),
              is: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: Array.from(mockData.sessions.values()), error: null }))
              }))
            }))
          }
        case 'decisions':
          return {
            insert: jest.fn((data: any) => ({
              select: jest.fn(() => ({
                single: jest.fn(() => {
                  const id = `decision-${mockData.nextId++}`
                  mockData.decisions.set(id, { ...data, id })
                  return Promise.resolve({ data: { id }, error: null })
                })
              }))
            })),
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => {
                  const decisions = Array.from(mockData.decisions.values())
                  return Promise.resolve({ data: decisions, error: null })
                })
              }))
            }))
          }
        case 'user_profiles':
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { total_scenarios_completed: 5, average_score: 75 },
                  error: null
                }))
              }))
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ error: null }))
            }))
          }
        default:
          return {}
      }
    }),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        on: jest.fn(() => ({
          subscribe: jest.fn()
        }))
      }))
    })),
    removeChannel: jest.fn()
  } as any
}

describe('Session Management Integration', () => {
  let mockSupabase: any
  let sessionManager: TrainingSessionManager
  let sessionPersistence: SessionPersistence
  let sessionRecovery: SessionRecovery
  let mockScenarioConfig: ScenarioConfig
  let mockConfiguration: GenerationContext

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    sessionManager = new TrainingSessionManager(mockSupabase)
    sessionPersistence = new SessionPersistence(mockSupabase)
    sessionRecovery = new SessionRecovery(mockSupabase)

    mockScenarioConfig = {
      id: 'integration-scenario',
      title: 'Integration Test Scenario',
      domain: 'cybersecurity',
      difficulty_level: 2,
      initialState: {
        id: 'initial-state',
        description: 'A critical security incident has occurred',
        context: 'Multiple systems are showing signs of compromise',
        decisions: [
          {
            id: 'decision-1',
            text: 'Isolate affected systems immediately',
            consequences: [
              {
                id: 'consequence-1',
                type: 'direct',
                description: 'Systems are isolated but business operations are disrupted',
                impact_score: -5,
                probability: 0.9
              }
            ],
            nextStateId: 'isolation-state',
            riskLevel: 'high'
          },
          {
            id: 'decision-2',
            text: 'Investigate further before taking action',
            consequences: [
              {
                id: 'consequence-2',
                type: 'direct',
                description: 'More information gathered but potential for spread increases',
                impact_score: 3,
                probability: 0.7
              }
            ],
            nextStateId: 'investigation-state',
            riskLevel: 'medium'
          }
        ],
        timeLimit: 300,
        environmentalFactors: ['High stress environment', 'Limited visibility'],
        characters: [
          {
            id: 'ciso',
            name: 'Sarah Chen',
            role: 'CISO',
            personality_traits: ['decisive', 'experienced'],
            communication_style: 'direct',
            expertise_areas: ['incident response', 'risk management']
          }
        ],
        riskLevel: 'high',
        criticalityScore: 9
      },
      states: {
        'initial-state': {
          id: 'initial-state',
          description: 'A critical security incident has occurred',
          context: 'Multiple systems are showing signs of compromise',
          decisions: [],
          environmentalFactors: ['High stress environment', 'Limited visibility'],
          characters: [],
          riskLevel: 'high',
          criticalityScore: 9
        },
        'isolation-state': {
          id: 'isolation-state',
          description: 'Systems have been isolated',
          context: 'Business operations are disrupted but threat is contained',
          decisions: [],
          environmentalFactors: ['Business pressure', 'Containment achieved'],
          characters: [],
          riskLevel: 'medium',
          criticalityScore: 6
        },
        'investigation-state': {
          id: 'investigation-state',
          description: 'Investigation is underway',
          context: 'More information is being gathered about the threat',
          decisions: [],
          environmentalFactors: ['Time pressure', 'Evolving threat'],
          characters: [],
          riskLevel: 'high',
          criticalityScore: 8
        }
      },
      branches: [
        {
          fromStateId: 'initial-state',
          decisionId: 'decision-1',
          toStateId: 'isolation-state',
          transitionEffects: ['Systems isolated', 'Business impact']
        },
        {
          fromStateId: 'initial-state',
          decisionId: 'decision-2',
          toStateId: 'investigation-state',
          transitionEffects: ['Investigation started', 'Risk maintained']
        }
      ],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      version: '1.0',
      tags: ['cybersecurity', 'incident-response']
    }

    mockConfiguration = {
      domain: 'cybersecurity',
      jobRole: 'security-analyst',
      riskProfile: 'balanced',
      scenarioHistory: []
    }
  })

  afterEach(async () => {
    await sessionPersistence.cleanup()
  })

  describe('Complete Session Lifecycle', () => {
    it('should handle a complete session from start to finish', async () => {
      const userId = 'test-user-id'
      const scenarioId = 'test-scenario-id'

      // 1. Start a new session
      const startResult = await sessionManager.startSession(
        userId,
        scenarioId,
        mockConfiguration,
        mockScenarioConfig
      )

      expect(startResult.success).toBe(true)
      expect(startResult.sessionId).toBeDefined()

      const sessionId = startResult.sessionId

      // 2. Initialize persistence
      const syncResult = await sessionPersistence.initializeSync(sessionId)
      expect(syncResult.success).toBe(true)

      // 3. Record a decision
      const decisionResult = await sessionManager.recordDecision(
        'initial-state',
        'Isolate affected systems immediately',
        5000, // 5 seconds
        15,   // Score impact
        [
          {
            id: 'consequence-1',
            type: 'direct',
            description: 'Systems isolated successfully',
            impact_score: 10,
            probability: 0.9
          }
        ],
        4 // User confidence
      )

      expect(decisionResult.success).toBe(true)

      // 4. Update session state
      const stateUpdateResult = await sessionManager.updateCurrentState('isolation-state')
      expect(stateUpdateResult.success).toBe(true)

      // 5. Create a checkpoint
      const checkpointResult = await sessionPersistence.createCheckpoint(sessionId, 'after-first-decision')
      expect(checkpointResult.success).toBe(true)

      // 6. Pause the session
      const pauseResult = await sessionManager.pauseSession()
      expect(pauseResult.success).toBe(true)

      // 7. Check if session can be recovered
      const recoveryCheck = await sessionRecovery.canRecoverSession(sessionId)
      expect(recoveryCheck.canRecover).toBe(true)

      // 8. Resume the session
      const resumeResult = await sessionManager.resumeSession(sessionId, mockScenarioConfig)
      expect(resumeResult.success).toBe(true)

      // 9. Record another decision
      const secondDecisionResult = await sessionManager.recordDecision(
        'isolation-state',
        'Begin recovery procedures',
        3000,
        20,
        [
          {
            id: 'consequence-2',
            type: 'second-order',
            description: 'Recovery initiated with minimal data loss',
            impact_score: 25,
            probability: 0.8
          }
        ],
        5
      )

      expect(secondDecisionResult.success).toBe(true)

      // 10. Get session metrics
      const metrics = await sessionManager.getSessionMetrics()
      expect(metrics).toBeDefined()
      expect(metrics!.decisionsCount).toBe(2)
      expect(metrics!.totalTime).toBeGreaterThan(0)

      // 11. Complete the session
      const finalScore = 85
      const completeResult = await sessionManager.completeSession(finalScore)
      expect(completeResult.success).toBe(true)

      // 12. Verify session is no longer recoverable
      const finalRecoveryCheck = await sessionRecovery.canRecoverSession(sessionId)
      expect(finalRecoveryCheck.canRecover).toBe(false)
      expect(finalRecoveryCheck.reason).toBe('Session already completed')
    })

    it('should handle session recovery after interruption', async () => {
      const userId = 'test-user-id'
      const scenarioId = 'test-scenario-id'

      // Start and partially complete a session
      const startResult = await sessionManager.startSession(
        userId,
        scenarioId,
        mockConfiguration,
        mockScenarioConfig
      )

      const sessionId = startResult.sessionId

      // Record some decisions
      await sessionManager.recordDecision(
        'initial-state',
        'Investigate further',
        4000,
        10,
        [],
        3
      )

      await sessionManager.updateCurrentState('investigation-state')

      // Simulate session interruption (don't complete properly)
      // Create a new session manager to simulate restart
      const newSessionManager = new TrainingSessionManager(mockSupabase)
      const newSessionRecovery = new SessionRecovery(mockSupabase)

      // Find recoverable sessions
      const recoverableSessions = await newSessionRecovery.findRecoverableSessions(userId)
      expect(recoverableSessions.length).toBeGreaterThan(0)

      const recoverableSession = recoverableSessions.find(s => s.sessionId === sessionId)
      expect(recoverableSession).toBeDefined()
      expect(recoverableSession!.progress).toBeGreaterThan(0)

      // Recover the session
      const recoveryResult = await newSessionRecovery.recoverSession(
        sessionId,
        mockScenarioConfig,
        newSessionManager
      )

      expect(recoveryResult.success).toBe(true)

      // Continue with the recovered session
      const continuedDecisionResult = await newSessionManager.recordDecision(
        'investigation-state',
        'Escalate to incident response team',
        2000,
        15,
        [],
        4
      )

      expect(continuedDecisionResult.success).toBe(true)

      // Complete the recovered session
      const completeResult = await newSessionManager.completeSession(78)
      expect(completeResult.success).toBe(true)
    })

    it('should handle session abandonment', async () => {
      const userId = 'test-user-id'
      const scenarioId = 'test-scenario-id'

      // Start a session
      const startResult = await sessionManager.startSession(
        userId,
        scenarioId,
        mockConfiguration,
        mockScenarioConfig
      )

      const sessionId = startResult.sessionId

      // Record a decision
      await sessionManager.recordDecision(
        'initial-state',
        'Test decision',
        1000,
        5,
        [],
        2
      )

      // Abandon the session
      const abandonResult = await sessionRecovery.abandonSession(
        sessionId,
        'User decided to quit'
      )

      expect(abandonResult.success).toBe(true)

      // Verify session cannot be recovered
      const recoveryCheck = await sessionRecovery.canRecoverSession(sessionId)
      expect(recoveryCheck.canRecover).toBe(false)
      expect(recoveryCheck.reason).toBe('Session already completed')
    })

    it('should handle session persistence with conflict resolution', async () => {
      const userId = 'test-user-id'
      const scenarioId = 'test-scenario-id'

      // Start a session
      const startResult = await sessionManager.startSession(
        userId,
        scenarioId,
        mockConfiguration,
        mockScenarioConfig
      )

      const sessionId = startResult.sessionId

      // Create session data
      const sessionData: SessionData = {
        decisions_made: [
          {
            id: 'decision-1',
            session_id: sessionId,
            state_id: 'initial-state',
            decision_text: 'Test decision',
            timestamp: '2024-01-01T10:00:00Z',
            time_taken_ms: 3000,
            score_impact: 10,
            consequences: []
          }
        ],
        state_history: ['initial-state', 'investigation-state'],
        time_spent_seconds: 180,
        pause_count: 1,
        hints_used: 0,
        current_context: { test: 'data' }
      }

      // Save session state
      const saveResult = await sessionPersistence.saveSessionState(
        sessionId,
        sessionData,
        'investigation-state'
      )

      expect(saveResult.success).toBe(true)

      // Load session state
      const loadResult = await sessionPersistence.loadSessionState(sessionId)
      expect(loadResult.success).toBe(true)
      expect(loadResult.sessionData).toBeDefined()
      expect(loadResult.currentStateId).toBe('investigation-state')
    })

    it('should provide accurate recovery statistics', async () => {
      const userId = 'test-user-id'

      // Create multiple sessions in different states
      const sessions = []
      
      // Active session
      const activeResult = await sessionManager.startSession(
        userId,
        'scenario-1',
        mockConfiguration,
        mockScenarioConfig
      )
      sessions.push(activeResult.sessionId)

      // Completed session
      const completedResult = await sessionManager.startSession(
        userId,
        'scenario-2',
        mockConfiguration,
        mockScenarioConfig
      )
      await sessionManager.completeSession(80)

      // Abandoned session
      const abandonedResult = await sessionManager.startSession(
        userId,
        'scenario-3',
        mockConfiguration,
        mockScenarioConfig
      )
      await sessionRecovery.abandonSession(abandonedResult.sessionId, 'Test abandonment')

      // Get recovery stats
      const stats = await sessionRecovery.getRecoveryStats(userId)

      expect(stats.totalSessions).toBeGreaterThan(0)
      expect(stats.recoverableSessions).toBeGreaterThan(0)
      expect(stats.abandonedSessions).toBeGreaterThan(0)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid session operations gracefully', async () => {
      // Try to pause non-existent session
      const pauseResult = await sessionManager.pauseSession()
      expect(pauseResult.success).toBe(false)
      expect(pauseResult.error).toBe('No active session')

      // Try to record decision without session
      const decisionResult = await sessionManager.recordDecision(
        'state-1',
        'Test',
        1000,
        5,
        []
      )
      expect(decisionResult.success).toBe(false)
      expect(decisionResult.error).toBe('No active session')

      // Try to complete non-existent session
      const completeResult = await sessionManager.completeSession(75)
      expect(completeResult.success).toBe(false)
      expect(completeResult.error).toBe('No active session')
    })

    it('should handle recovery of non-existent sessions', async () => {
      const recoveryCheck = await sessionRecovery.canRecoverSession('non-existent-session')
      expect(recoveryCheck.canRecover).toBe(false)
      expect(recoveryCheck.reason).toBe('Session not found')
    })

    it('should handle cleanup of old sessions', async () => {
      const userId = 'test-user-id'

      // Create a session (it will be considered "old" based on our mock)
      const startResult = await sessionManager.startSession(
        userId,
        'old-scenario',
        mockConfiguration,
        mockScenarioConfig
      )

      // Clean up old sessions
      const cleanupResult = await sessionRecovery.cleanupOldSessions(userId, 1) // 1 hour
      expect(cleanupResult.error).toBeUndefined()
    })
  })
})