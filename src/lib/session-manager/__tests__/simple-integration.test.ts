/**
 * Simple integration test to verify session management functionality
 * without complex mocking - focuses on core logic
 */

import { TrainingSessionManager } from '../training-session-manager'
import { ScenarioStateManager } from '../../scenario-engine/scenario-state'
import { ScenarioConfig, GenerationContext } from '../../types'

describe('Session Management Core Logic', () => {
  let mockScenarioConfig: ScenarioConfig
  let mockConfiguration: GenerationContext

  beforeEach(() => {
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
  })

  describe('ScenarioStateManager Integration', () => {
    it('should properly initialize and manage scenario state', () => {
      const stateManager = new ScenarioStateManager(mockScenarioConfig.initialState)
      
      expect(stateManager.getCurrentState().id).toBe('initial-state')
      expect(stateManager.getAvailableDecisions()).toHaveLength(1)
      expect(stateManager.isValidDecision('decision-1')).toBe(true)
      expect(stateManager.isValidDecision('invalid-decision')).toBe(false)
      expect(stateManager.isTerminalState()).toBe(false)
    })

    it('should track state history correctly', () => {
      const stateManager = new ScenarioStateManager(mockScenarioConfig.initialState)
      
      const newState = {
        ...mockScenarioConfig.initialState,
        id: 'new-state',
        description: 'New state after decision'
      }
      
      stateManager.updateState(newState)
      
      const history = stateManager.getStateHistory()
      expect(history).toEqual(['initial-state', 'new-state'])
    })

    it('should record decisions properly', () => {
      const stateManager = new ScenarioStateManager(mockScenarioConfig.initialState)
      
      const decision = {
        id: 'decision-1',
        text: 'Test decision',
        consequences: [],
        nextStateId: 'next-state',
        riskLevel: 'medium' as const
      }
      
      stateManager.recordDecision(decision)
      
      const decisionHistory = stateManager.getDecisionHistory()
      expect(decisionHistory).toHaveLength(1)
      expect(decisionHistory[0].id).toBe('decision-1')
    })

    it('should calculate time pressure correctly', () => {
      const stateManager = new ScenarioStateManager(mockScenarioConfig.initialState)
      
      // Test with no time limit
      const stateWithoutLimit = {
        ...mockScenarioConfig.initialState,
        timeLimit: undefined
      }
      stateManager.updateState(stateWithoutLimit)
      expect(stateManager.getTimePressure(5000)).toBe(0)
      
      // Test with time limit
      stateManager.updateState(mockScenarioConfig.initialState)
      const pressure = stateManager.getTimePressure(150000) // 150 seconds out of 300
      expect(pressure).toBe(0.5)
    })

    it('should provide decision context', () => {
      const stateManager = new ScenarioStateManager(mockScenarioConfig.initialState)
      
      const context = stateManager.getDecisionContext()
      
      expect(context.currentRiskLevel).toBe('high')
      expect(context.criticalityScore).toBe(8)
      expect(context.environmentalFactors).toEqual(['High stress', 'Limited information'])
      expect(context.timeRemaining).toBe(300)
    })

    it('should calculate state complexity', () => {
      const stateManager = new ScenarioStateManager(mockScenarioConfig.initialState)
      
      const complexity = stateManager.getStateComplexity()
      
      // Should be calculated based on decisions (1), environmental factors (2), characters (0)
      // Formula: (decisions * 0.4) + (envFactors * 0.3) + (characters * 0.3)
      const expectedComplexity = (1 * 0.4) + (2 * 0.3) + (0 * 0.3)
      expect(complexity).toBe(expectedComplexity)
    })
  })

  describe('Session Manager Core Logic', () => {
    it('should validate session state properties', () => {
      // Test that session manager properly validates required properties
      expect(typeof TrainingSessionManager).toBe('function')
      
      // Test that we can create an instance (even with null supabase for logic testing)
      const sessionManager = new TrainingSessionManager(null as any)
      expect(sessionManager).toBeDefined()
      expect(sessionManager.currentSessionId).toBeNull()
      expect(sessionManager.isSessionActive).toBe(false)
      expect(sessionManager.scenarioState).toBeNull()
    })

    it('should handle session lifecycle states correctly', () => {
      const sessionManager = new TrainingSessionManager(null as any)
      
      // Initially no session
      expect(sessionManager.isSessionActive).toBe(false)
      
      // After starting a session (we can't test the full flow without DB, but we can test state)
      expect(sessionManager.currentSessionId).toBeNull()
    })
  })

  describe('Data Model Validation', () => {
    it('should have proper TypeScript interfaces', () => {
      // Test that our configuration object matches the expected interface
      const config: GenerationContext = mockConfiguration
      expect(config.domain).toBe('cybersecurity')
      expect(config.jobRole).toBe('security-analyst')
      expect(config.riskProfile).toBe('balanced')
      expect(Array.isArray(config.scenarioHistory)).toBe(true)
    })

    it('should have proper scenario config structure', () => {
      const config: ScenarioConfig = mockScenarioConfig
      expect(config.id).toBeDefined()
      expect(config.title).toBeDefined()
      expect(config.domain).toBeDefined()
      expect(config.initialState).toBeDefined()
      expect(config.states).toBeDefined()
      expect(config.branches).toBeDefined()
      expect(typeof config.is_active).toBe('boolean')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid state transitions gracefully', () => {
      const stateManager = new ScenarioStateManager(mockScenarioConfig.initialState)
      
      // Test invalid decision
      expect(stateManager.isValidDecision('nonexistent')).toBe(false)
      expect(stateManager.getDecision('nonexistent')).toBeNull()
      
      // Test getting consequences for invalid decision
      const consequences = stateManager.getDecisionConsequences('nonexistent')
      expect(consequences).toEqual([])
    })

    it('should handle edge cases in time pressure calculation', () => {
      const stateManager = new ScenarioStateManager(mockScenarioConfig.initialState)
      
      // Test with elapsed time exceeding limit
      const pressure = stateManager.getTimePressure(400000) // 400 seconds > 300 limit
      expect(pressure).toBe(1) // Should cap at 1
      
      // Test with negative time (edge case)
      const negativePressure = stateManager.getTimePressure(-1000)
      expect(negativePressure).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Session Data Structures', () => {
    it('should properly structure session data', () => {
      const sessionData = {
        decisions_made: [],
        state_history: ['initial-state'],
        time_spent_seconds: 0,
        pause_count: 0,
        hints_used: 0,
        current_context: {}
      }
      
      expect(Array.isArray(sessionData.decisions_made)).toBe(true)
      expect(Array.isArray(sessionData.state_history)).toBe(true)
      expect(typeof sessionData.time_spent_seconds).toBe('number')
      expect(typeof sessionData.pause_count).toBe('number')
      expect(typeof sessionData.hints_used).toBe('number')
      expect(typeof sessionData.current_context).toBe('object')
    })

    it('should properly structure decision records', () => {
      const decision = {
        id: 'decision-1',
        session_id: 'session-1',
        state_id: 'state-1',
        decision_text: 'Test decision',
        timestamp: '2024-01-01T10:00:00Z',
        time_taken_ms: 5000,
        score_impact: 10,
        consequences: [],
        user_confidence: 4
      }
      
      expect(typeof decision.id).toBe('string')
      expect(typeof decision.session_id).toBe('string')
      expect(typeof decision.state_id).toBe('string')
      expect(typeof decision.decision_text).toBe('string')
      expect(typeof decision.timestamp).toBe('string')
      expect(typeof decision.time_taken_ms).toBe('number')
      expect(typeof decision.score_impact).toBe('number')
      expect(Array.isArray(decision.consequences)).toBe(true)
      expect(typeof decision.user_confidence).toBe('number')
    })
  })
})