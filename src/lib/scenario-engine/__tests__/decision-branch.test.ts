import { DecisionBranchHandler } from '../decision-branch'
import { ScenarioStateManager } from '../scenario-state'
import { ScenarioConfig, ScenarioState, Decision, DecisionBranch, Consequence } from '../../types'

describe('DecisionBranchHandler', () => {
  let mockConfig: ScenarioConfig
  let stateManager: ScenarioStateManager
  let branchHandler: DecisionBranchHandler

  beforeEach(() => {
    const mockConsequences: Consequence[] = [
      {
        id: 'c1',
        type: 'direct',
        description: 'Immediate impact',
        impact_score: 75,
        probability: 0.9
      }
    ]

    const state1: ScenarioState = {
      id: 'state1',
      description: 'Initial crisis state',
      context: 'System failure detected',
      decisions: [
        {
          id: 'd1',
          text: 'Emergency shutdown',
          consequences: mockConsequences,
          nextStateId: 'state2',
          riskLevel: 'high'
        },
        {
          id: 'd2',
          text: 'Investigate first',
          consequences: mockConsequences,
          nextStateId: 'state3',
          riskLevel: 'low'
        }
      ],
      timeLimit: 300,
      environmentalFactors: ['high stress'],
      characters: [],
      riskLevel: 'high',
      criticalityScore: 85
    }

    const state2: ScenarioState = {
      id: 'state2',
      description: 'After emergency shutdown',
      context: 'System is offline',
      decisions: [
        {
          id: 'd3',
          text: 'Begin recovery',
          consequences: mockConsequences,
          nextStateId: 'state4',
          riskLevel: 'medium'
        }
      ],
      timeLimit: 600,
      environmentalFactors: ['system offline'],
      characters: [],
      riskLevel: 'medium',
      criticalityScore: 60
    }

    const state3: ScenarioState = {
      id: 'state3',
      description: 'Investigation phase',
      context: 'Analyzing the problem',
      decisions: [],
      environmentalFactors: ['time pressure'],
      characters: [],
      riskLevel: 'low',
      criticalityScore: 40
    }

    const state4: ScenarioState = {
      id: 'state4',
      description: 'Recovery in progress',
      context: 'Systems coming back online',
      decisions: [],
      environmentalFactors: [],
      characters: [],
      riskLevel: 'low',
      criticalityScore: 20
    }

    const branches: DecisionBranch[] = [
      {
        fromStateId: 'state1',
        decisionId: 'd1',
        toStateId: 'state2',
        transitionEffects: ['System shutdown initiated', 'Alert sent to stakeholders']
      },
      {
        fromStateId: 'state1',
        decisionId: 'd2',
        toStateId: 'state3',
        conditions: { timePressure: { $lt: 0.5 } },
        transitionEffects: ['Investigation started', 'Team assembled']
      },
      {
        fromStateId: 'state2',
        decisionId: 'd3',
        toStateId: 'state4',
        transitionEffects: ['Recovery process initiated']
      }
    ]

    mockConfig = {
      id: 'scenario1',
      title: 'System Crisis',
      domain: 'IT',
      difficulty_level: 3,
      initialState: state1,
      states: {
        state1,
        state2,
        state3,
        state4
      },
      branches,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      version: '1.0',
      tags: ['crisis', 'IT']
    }

    stateManager = new ScenarioStateManager(state1)
    branchHandler = new DecisionBranchHandler(mockConfig, stateManager)
  })

  describe('decision processing', () => {
    it('should process valid decision successfully', async () => {
      const result = await branchHandler.processDecision('d1', 120000) // 2 minutes elapsed
      
      expect(result.success).toBe(true)
      expect(result.newState?.id).toBe('state2')
      expect(result.transitionEffects).toEqual(['System shutdown initiated', 'Alert sent to stakeholders'])
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid decision', async () => {
      const result = await branchHandler.processDecision('invalid', 120000)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid decision for current state')
      expect(result.newState).toBeUndefined()
    })

    it('should reject decision when branch conditions not met', async () => {
      // d2 has condition timePressure < 0.5, but we're passing high time pressure
      const result = await branchHandler.processDecision('d2', 200000) // High time pressure (200s / 300s = 0.67)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Branch conditions not met')
    })

    it('should accept decision when branch conditions are met', async () => {
      // d2 has condition timePressure < 0.5, passing low time pressure
      const result = await branchHandler.processDecision('d2', 100000) // Low time pressure (100s / 300s = 0.33)
      
      expect(result.success).toBe(true)
      expect(result.newState?.id).toBe('state3')
    })

    it('should handle missing target state', async () => {
      // Create a branch with invalid target state
      const invalidConfig = {
        ...mockConfig,
        branches: [
          {
            fromStateId: 'state1',
            decisionId: 'd1',
            toStateId: 'nonexistent',
            transitionEffects: []
          }
        ]
      }
      
      const invalidHandler = new DecisionBranchHandler(invalidConfig, stateManager)
      const result = await invalidHandler.processDecision('d1', 120000)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Target state not found')
    })
  })

  describe('condition evaluation', () => {
    it('should evaluate simple equality conditions', async () => {
      const configWithConditions = {
        ...mockConfig,
        branches: [
          {
            fromStateId: 'state1',
            decisionId: 'd1',
            toStateId: 'state2',
            conditions: { 'userContext.role': 'admin' },
            transitionEffects: []
          }
        ]
      }
      
      const handler = new DecisionBranchHandler(configWithConditions, stateManager)
      
      // Should succeed with matching context
      const result1 = await handler.processDecision('d1', 120000, { role: 'admin' })
      expect(result1.success).toBe(true)
      
      // Should fail with non-matching context
      stateManager.reset(mockConfig.initialState)
      const result2 = await handler.processDecision('d1', 120000, { role: 'user' })
      expect(result2.success).toBe(false)
    })

    it('should evaluate comparison operators', async () => {
      const configWithConditions = {
        ...mockConfig,
        branches: [
          {
            fromStateId: 'state1',
            decisionId: 'd1',
            toStateId: 'state2',
            conditions: { 
              'userContext.experience': { $gte: 5 },
              'userContext.score': { $lt: 100 }
            },
            transitionEffects: []
          }
        ]
      }
      
      const handler = new DecisionBranchHandler(configWithConditions, stateManager)
      
      // Should succeed with matching conditions
      const result1 = await handler.processDecision('d1', 120000, { experience: 7, score: 85 })
      expect(result1.success).toBe(true)
      
      // Should fail when conditions not met
      stateManager.reset(mockConfig.initialState)
      const result2 = await handler.processDecision('d1', 120000, { experience: 3, score: 85 })
      expect(result2.success).toBe(false)
    })

    it('should evaluate array conditions', async () => {
      const configWithConditions = {
        ...mockConfig,
        branches: [
          {
            fromStateId: 'state1',
            decisionId: 'd1',
            toStateId: 'state2',
            conditions: { 
              'userContext.skills': { $in: ['leadership', 'technical'] }
            },
            transitionEffects: []
          }
        ]
      }
      
      const handler = new DecisionBranchHandler(configWithConditions, stateManager)
      
      // Should succeed when value is in array
      const result1 = await handler.processDecision('d1', 120000, { skills: 'leadership' })
      expect(result1.success).toBe(true)
      
      // Should fail when value is not in array
      stateManager.reset(mockConfig.initialState)
      const result2 = await handler.processDecision('d1', 120000, { skills: 'communication' })
      expect(result2.success).toBe(false)
    })
  })

  describe('possible next states', () => {
    it('should return all possible next states', () => {
      const possibleStates = branchHandler.getPossibleNextStates()
      
      expect(possibleStates).toHaveLength(2)
      expect(possibleStates[0].decisionId).toBe('d1')
      expect(possibleStates[0].nextStateId).toBe('state2')
      expect(possibleStates[1].decisionId).toBe('d2')
      expect(possibleStates[1].nextStateId).toBe('state3')
    })

    it('should return empty array for terminal state', () => {
      stateManager.updateState(mockConfig.states.state3) // Terminal state with no decisions
      const possibleStates = branchHandler.getPossibleNextStates()
      
      expect(possibleStates).toHaveLength(0)
    })
  })

  describe('scenario validation', () => {
    it('should validate correct scenario configuration', () => {
      const validation = branchHandler.validateScenarioConfig()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing initial state', () => {
      const invalidConfig = {
        ...mockConfig,
        states: { ...mockConfig.states }
      }
      delete invalidConfig.states.state1
      
      const invalidHandler = new DecisionBranchHandler(invalidConfig, stateManager)
      const validation = invalidHandler.validateScenarioConfig()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Initial state not found in states collection')
    })

    it('should detect invalid branch references', () => {
      const invalidConfig = {
        ...mockConfig,
        branches: [
          {
            fromStateId: 'nonexistent',
            decisionId: 'd1',
            toStateId: 'state2',
            transitionEffects: []
          }
        ]
      }
      
      const invalidHandler = new DecisionBranchHandler(invalidConfig, stateManager)
      const validation = invalidHandler.validateScenarioConfig()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Branch references non-existent from state: nonexistent')
    })

    it('should detect orphaned states', () => {
      const configWithOrphan = {
        ...mockConfig,
        states: {
          ...mockConfig.states,
          orphan: {
            id: 'orphan',
            description: 'Orphaned state',
            context: 'No way to reach this',
            decisions: [],
            environmentalFactors: [],
            characters: [],
            riskLevel: 'low' as const,
            criticalityScore: 0
          }
        }
      }
      
      const handler = new DecisionBranchHandler(configWithOrphan, stateManager)
      const validation = handler.validateScenarioConfig()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Orphaned state found: orphan')
    })
  })

  describe('transition effects preview', () => {
    it('should preview transition effects without executing', () => {
      const effects = branchHandler.previewTransitionEffects('d1')
      
      expect(effects).toEqual(['System shutdown initiated', 'Alert sent to stakeholders'])
      
      // Verify state hasn't changed
      expect(stateManager.getCurrentState().id).toBe('state1')
    })

    it('should return empty array for invalid decision', () => {
      const effects = branchHandler.previewTransitionEffects('invalid')
      
      expect(effects).toEqual([])
    })
  })

  describe('error handling', () => {
    it('should handle exceptions gracefully', async () => {
      // Create a handler that will throw an error
      const faultyStateManager = {
        ...stateManager,
        isValidDecision: () => { throw new Error('Test error') }
      } as ScenarioStateManager
      
      const faultyHandler = new DecisionBranchHandler(mockConfig, faultyStateManager)
      const result = await faultyHandler.processDecision('d1', 120000)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Test error')
    })
  })
})