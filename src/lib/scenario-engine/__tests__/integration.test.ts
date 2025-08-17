import { ScenarioStateManager } from '../scenario-state'
import { DecisionBranchHandler } from '../decision-branch'
import { OutcomeCalculator } from '../outcome-calculator'
import { ScenarioConfig, ScenarioState, Decision, DecisionBranch, Consequence } from '../../types'

describe('Scenario Engine Integration', () => {
  let scenarioConfig: ScenarioConfig
  let stateManager: ScenarioStateManager
  let branchHandler: DecisionBranchHandler
  let outcomeCalculator: OutcomeCalculator

  beforeEach(() => {
    // Create a complete scenario for integration testing
    const consequences: Consequence[] = [
      {
        id: 'c1',
        type: 'direct',
        description: 'Server goes offline',
        impact_score: 85,
        probability: 0.9
      },
      {
        id: 'c2',
        type: 'second-order',
        description: 'Customer complaints increase',
        impact_score: 70,
        probability: 0.8,
        delay_minutes: 30
      }
    ]

    const state1: ScenarioState = {
      id: 'crisis-start',
      description: 'Critical server failure detected',
      context: 'Production database server showing critical errors',
      decisions: [
        {
          id: 'immediate-restart',
          text: 'Restart server immediately',
          consequences,
          nextStateId: 'post-restart',
          riskLevel: 'high'
        },
        {
          id: 'investigate-first',
          text: 'Investigate root cause first',
          consequences: [
            {
              id: 'c3',
              type: 'direct',
              description: 'System remains unstable',
              impact_score: 60,
              probability: 0.7
            }
          ],
          nextStateId: 'investigation',
          riskLevel: 'medium'
        }
      ],
      timeLimit: 180, // 3 minutes
      environmentalFactors: ['high user load', 'peak business hours'],
      characters: [
        {
          id: 'ops-manager',
          name: 'Sarah Chen',
          role: 'Operations Manager',
          personality_traits: ['analytical', 'cautious'],
          communication_style: 'detailed',
          expertise_areas: ['infrastructure', 'incident response']
        }
      ],
      riskLevel: 'high',
      criticalityScore: 90
    }

    const state2: ScenarioState = {
      id: 'post-restart',
      description: 'Server restarted, monitoring stability',
      context: 'Server is back online but needs monitoring',
      decisions: [
        {
          id: 'monitor-closely',
          text: 'Monitor for 30 minutes',
          consequences: [
            {
              id: 'c4',
              type: 'direct',
              description: 'System appears stable',
              impact_score: 30,
              probability: 0.8
            }
          ],
          nextStateId: 'resolution',
          riskLevel: 'low'
        }
      ],
      timeLimit: 120,
      environmentalFactors: ['system recovery'],
      characters: [],
      riskLevel: 'medium',
      criticalityScore: 40
    }

    const state3: ScenarioState = {
      id: 'investigation',
      description: 'Investigating root cause',
      context: 'Team is analyzing logs and system metrics',
      decisions: [
        {
          id: 'found-issue',
          text: 'Apply targeted fix',
          consequences: [
            {
              id: 'c5',
              type: 'direct',
              description: 'Issue resolved properly',
              impact_score: 20,
              probability: 0.9
            }
          ],
          nextStateId: 'resolution',
          riskLevel: 'low'
        }
      ],
      timeLimit: 300,
      environmentalFactors: ['investigation in progress'],
      characters: [],
      riskLevel: 'low',
      criticalityScore: 30
    }

    const state4: ScenarioState = {
      id: 'resolution',
      description: 'Crisis resolved',
      context: 'System is stable and functioning normally',
      decisions: [], // Terminal state
      environmentalFactors: [],
      characters: [],
      riskLevel: 'low',
      criticalityScore: 10
    }

    const branches: DecisionBranch[] = [
      {
        fromStateId: 'crisis-start',
        decisionId: 'immediate-restart',
        toStateId: 'post-restart',
        transitionEffects: ['Server restart initiated', 'Monitoring alerts activated']
      },
      {
        fromStateId: 'crisis-start',
        decisionId: 'investigate-first',
        toStateId: 'investigation',
        transitionEffects: ['Investigation team assembled', 'Log analysis started']
      },
      {
        fromStateId: 'post-restart',
        decisionId: 'monitor-closely',
        toStateId: 'resolution',
        transitionEffects: ['Monitoring period completed', 'System declared stable']
      },
      {
        fromStateId: 'investigation',
        decisionId: 'found-issue',
        toStateId: 'resolution',
        transitionEffects: ['Root cause fix applied', 'System monitoring resumed']
      }
    ]

    scenarioConfig = {
      id: 'server-crisis-scenario',
      title: 'Critical Server Failure',
      domain: 'IT Operations',
      difficulty_level: 3,
      initialState: state1,
      states: {
        'crisis-start': state1,
        'post-restart': state2,
        'investigation': state3,
        'resolution': state4
      },
      branches,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      version: '1.0',
      tags: ['server', 'crisis', 'IT']
    }

    stateManager = new ScenarioStateManager(state1)
    branchHandler = new DecisionBranchHandler(scenarioConfig, stateManager)
    outcomeCalculator = new OutcomeCalculator()
  })

  describe('complete scenario execution', () => {
    it('should execute a complete scenario path successfully', async () => {
      // Track decisions and timing for scoring
      const decisions: Decision[] = []
      const timeTakenMs: number[] = []
      const timeLimitsMs: number[] = []

      // Initial state verification
      expect(stateManager.getCurrentState().id).toBe('crisis-start')
      expect(stateManager.isTerminalState()).toBe(false)

      // Decision 1: Choose immediate restart
      const decision1 = stateManager.getDecision('immediate-restart')!
      const startTime1 = Date.now()
      
      const result1 = await branchHandler.processDecision('immediate-restart', 90000) // 1.5 minutes
      expect(result1.success).toBe(true)
      expect(result1.newState?.id).toBe('post-restart')
      expect(result1.transitionEffects).toContain('Server restart initiated')

      decisions.push(decision1)
      timeTakenMs.push(90000)
      timeLimitsMs.push(180000)

      // Verify state transition
      expect(stateManager.getCurrentState().id).toBe('post-restart')
      expect(stateManager.getStateHistory()).toEqual(['crisis-start', 'post-restart'])

      // Decision 2: Monitor closely
      const decision2 = stateManager.getDecision('monitor-closely')!
      
      const result2 = await branchHandler.processDecision('monitor-closely', 60000) // 1 minute
      expect(result2.success).toBe(true)
      expect(result2.newState?.id).toBe('resolution')

      decisions.push(decision2)
      timeTakenMs.push(60000)
      timeLimitsMs.push(120000)

      // Verify terminal state reached
      expect(stateManager.getCurrentState().id).toBe('resolution')
      expect(stateManager.isTerminalState()).toBe(true)

      // Calculate final outcomes
      const outcomes = outcomeCalculator.calculateOutcomes(decisions, timeTakenMs, timeLimitsMs)
      
      expect(outcomes.totalScore).toBeGreaterThan(0)
      expect(outcomes.breakdown).toHaveLength(4)
      expect(outcomes.directImpact).toBeGreaterThan(0)
      expect(outcomes.secondOrderEffects).toBeGreaterThan(0)

      // Verify decision history
      const decisionHistory = stateManager.getDecisionHistory()
      expect(decisionHistory).toHaveLength(2)
      expect(decisionHistory[0].id).toBe('immediate-restart')
      expect(decisionHistory[1].id).toBe('monitor-closely')
    })

    it('should execute alternative scenario path', async () => {
      const decisions: Decision[] = []
      const timeTakenMs: number[] = []
      const timeLimitsMs: number[] = []

      // Decision 1: Choose investigation first
      const decision1 = stateManager.getDecision('investigate-first')!
      
      const result1 = await branchHandler.processDecision('investigate-first', 120000) // 2 minutes
      expect(result1.success).toBe(true)
      expect(result1.newState?.id).toBe('investigation')

      decisions.push(decision1)
      timeTakenMs.push(120000)
      timeLimitsMs.push(180000)

      // Decision 2: Apply targeted fix
      const decision2 = stateManager.getDecision('found-issue')!
      
      const result2 = await branchHandler.processDecision('found-issue', 180000) // 3 minutes
      expect(result2.success).toBe(true)
      expect(result2.newState?.id).toBe('resolution')

      decisions.push(decision2)
      timeTakenMs.push(180000)
      timeLimitsMs.push(300000)

      // Calculate outcomes for this path
      const outcomes = outcomeCalculator.calculateOutcomes(decisions, timeTakenMs, timeLimitsMs)
      
      // This path should have different scoring characteristics
      expect(outcomes.totalScore).toBeGreaterThan(0)
      expect(outcomes.riskManagement).toBeGreaterThan(60) // More conservative approach
    })
  })

  describe('scenario validation and error handling', () => {
    it('should validate scenario configuration before execution', () => {
      const validation = branchHandler.validateScenarioConfig()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should handle invalid decisions gracefully', async () => {
      const result = await branchHandler.processDecision('nonexistent-decision', 60000)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid decision for current state')
      
      // State should remain unchanged
      expect(stateManager.getCurrentState().id).toBe('crisis-start')
    })

    it('should prevent transitions from terminal states', async () => {
      // Navigate to terminal state
      await branchHandler.processDecision('immediate-restart', 90000)
      await branchHandler.processDecision('monitor-closely', 60000)
      
      expect(stateManager.isTerminalState()).toBe(true)
      
      // Try to make another decision (should fail)
      const result = await branchHandler.processDecision('any-decision', 30000)
      expect(result.success).toBe(false)
    })
  })

  describe('state complexity and context', () => {
    it('should calculate state complexity correctly', () => {
      const initialComplexity = stateManager.getStateComplexity()
      
      // Initial state has 2 decisions, 2 environmental factors, 1 character
      // Expected: (2 * 0.4) + (2 * 0.3) + (1 * 0.3) = 0.8 + 0.6 + 0.3 = 1.7
      expect(initialComplexity).toBe(1.7)
    })

    it('should provide comprehensive decision context', () => {
      const context = stateManager.getDecisionContext()
      
      expect(context.currentRiskLevel).toBe('high')
      expect(context.criticalityScore).toBe(90)
      expect(context.environmentalFactors).toContain('high user load')
      expect(context.availableCharacters).toHaveLength(1)
      expect(context.availableCharacters[0].name).toBe('Sarah Chen')
      expect(context.timeRemaining).toBe(180)
    })

    it('should calculate time pressure accurately', () => {
      // 90 seconds elapsed out of 180 second limit = 0.5 pressure
      const pressure = stateManager.getTimePressure(90000)
      expect(pressure).toBe(0.5)
    })
  })

  describe('consequence analysis', () => {
    it('should analyze consequence severity distribution', () => {
      const allDecisions = Object.values(scenarioConfig.states)
        .flatMap(state => state.decisions)
      
      const distribution = outcomeCalculator.getConsequenceSeverityDistribution(allDecisions)
      
      expect(distribution.low).toBeGreaterThanOrEqual(0)
      expect(distribution.medium).toBeGreaterThanOrEqual(0)
      expect(distribution.high).toBeGreaterThanOrEqual(0)
      expect(distribution.critical).toBeGreaterThanOrEqual(0)
      
      const total = distribution.low + distribution.medium + distribution.high + distribution.critical
      expect(total).toBeGreaterThan(0)
    })

    it('should preview transition effects without state changes', () => {
      const effects = branchHandler.previewTransitionEffects('immediate-restart')
      
      expect(effects).toContain('Server restart initiated')
      expect(effects).toContain('Monitoring alerts activated')
      
      // State should remain unchanged
      expect(stateManager.getCurrentState().id).toBe('crisis-start')
    })
  })

  describe('scenario reset and replay', () => {
    it('should support scenario reset for replay', async () => {
      // Make some decisions
      await branchHandler.processDecision('immediate-restart', 90000)
      await branchHandler.processDecision('monitor-closely', 60000)
      
      expect(stateManager.getCurrentState().id).toBe('resolution')
      expect(stateManager.getDecisionHistory()).toHaveLength(2)
      
      // Reset scenario
      stateManager.reset(scenarioConfig.initialState)
      
      expect(stateManager.getCurrentState().id).toBe('crisis-start')
      expect(stateManager.getDecisionHistory()).toHaveLength(0)
      expect(stateManager.getStateHistory()).toEqual(['crisis-start'])
    })
  })

  describe('performance and edge cases', () => {
    it('should handle rapid successive decisions', async () => {
      const startTime = Date.now()
      
      const result1 = await branchHandler.processDecision('immediate-restart', 1000)
      const result2 = await branchHandler.processDecision('monitor-closely', 1000)
      
      const endTime = Date.now()
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(100) // Should be very fast
    })

    it('should maintain data integrity with concurrent operations', () => {
      // Simulate concurrent access to state
      const state1 = stateManager.getCurrentState()
      const state2 = stateManager.getCurrentState()
      
      // Modify one copy
      state1.description = 'Modified'
      
      // Other copy should be unaffected (immutability)
      expect(state2.description).toBe('Critical server failure detected')
      expect(stateManager.getCurrentState().description).toBe('Critical server failure detected')
    })
  })
})