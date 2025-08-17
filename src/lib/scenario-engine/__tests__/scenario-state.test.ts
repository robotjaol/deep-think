import { ScenarioStateManager } from '../scenario-state'
import { ScenarioState, Decision, Consequence, Character } from '../../types'

describe('ScenarioStateManager', () => {
  let mockState: ScenarioState
  let stateManager: ScenarioStateManager

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

    const mockDecisions: Decision[] = [
      {
        id: 'd1',
        text: 'Take immediate action',
        consequences: mockConsequences,
        nextStateId: 'state2',
        riskLevel: 'high'
      },
      {
        id: 'd2',
        text: 'Wait and assess',
        consequences: mockConsequences,
        nextStateId: 'state3',
        riskLevel: 'low'
      }
    ]

    const mockCharacters: Character[] = [
      {
        id: 'char1',
        name: 'Crisis Manager',
        role: 'Incident Commander',
        personality_traits: ['decisive', 'calm'],
        communication_style: 'direct',
        expertise_areas: ['crisis management']
      }
    ]

    mockState = {
      id: 'state1',
      description: 'A critical system failure has occurred',
      context: 'Production servers are down',
      decisions: mockDecisions,
      timeLimit: 300, // 5 minutes
      environmentalFactors: ['high stress', 'media attention'],
      characters: mockCharacters,
      riskLevel: 'high',
      criticalityScore: 85
    }

    stateManager = new ScenarioStateManager(mockState)
  })

  describe('initialization', () => {
    it('should initialize with the provided state', () => {
      const currentState = stateManager.getCurrentState()
      expect(currentState).toEqual(mockState)
    })

    it('should add initial state to history', () => {
      const history = stateManager.getStateHistory()
      expect(history).toEqual(['state1'])
    })

    it('should start with empty decision history', () => {
      const decisionHistory = stateManager.getDecisionHistory()
      expect(decisionHistory).toEqual([])
    })
  })

  describe('decision management', () => {
    it('should return available decisions', () => {
      const decisions = stateManager.getAvailableDecisions()
      expect(decisions).toHaveLength(2)
      expect(decisions[0].id).toBe('d1')
      expect(decisions[1].id).toBe('d2')
    })

    it('should validate decisions correctly', () => {
      expect(stateManager.isValidDecision('d1')).toBe(true)
      expect(stateManager.isValidDecision('d2')).toBe(true)
      expect(stateManager.isValidDecision('invalid')).toBe(false)
    })

    it('should get decision by ID', () => {
      const decision = stateManager.getDecision('d1')
      expect(decision).toBeTruthy()
      expect(decision!.text).toBe('Take immediate action')
    })

    it('should return null for invalid decision ID', () => {
      const decision = stateManager.getDecision('invalid')
      expect(decision).toBeNull()
    })

    it('should record decisions', () => {
      const decision = stateManager.getDecision('d1')!
      stateManager.recordDecision(decision)
      
      const history = stateManager.getDecisionHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual(decision)
    })
  })

  describe('state transitions', () => {
    it('should update state correctly', () => {
      const newState: ScenarioState = {
        ...mockState,
        id: 'state2',
        description: 'New state after decision'
      }

      stateManager.updateState(newState)
      
      const currentState = stateManager.getCurrentState()
      expect(currentState.id).toBe('state2')
      
      const history = stateManager.getStateHistory()
      expect(history).toEqual(['state1', 'state2'])
    })
  })

  describe('time pressure calculation', () => {
    it('should calculate time pressure correctly', () => {
      // 150 seconds elapsed out of 300 second limit = 0.5 pressure
      const pressure = stateManager.getTimePressure(150000)
      expect(pressure).toBe(0.5)
    })

    it('should cap time pressure at 1.0', () => {
      // 400 seconds elapsed out of 300 second limit = should cap at 1.0
      const pressure = stateManager.getTimePressure(400000)
      expect(pressure).toBe(1.0)
    })

    it('should return 0 for states without time limit', () => {
      const stateWithoutTimeLimit: ScenarioState = {
        ...mockState,
        timeLimit: undefined
      }
      const manager = new ScenarioStateManager(stateWithoutTimeLimit)
      
      const pressure = manager.getTimePressure(150000)
      expect(pressure).toBe(0)
    })
  })

  describe('decision context', () => {
    it('should provide complete decision context', () => {
      const context = stateManager.getDecisionContext()
      
      expect(context.currentRiskLevel).toBe('high')
      expect(context.criticalityScore).toBe(85)
      expect(context.environmentalFactors).toEqual(['high stress', 'media attention'])
      expect(context.availableCharacters).toHaveLength(1)
      expect(context.timeRemaining).toBe(300)
    })
  })

  describe('terminal state detection', () => {
    it('should detect non-terminal state', () => {
      expect(stateManager.isTerminalState()).toBe(false)
    })

    it('should detect terminal state', () => {
      const terminalState: ScenarioState = {
        ...mockState,
        decisions: []
      }
      const terminalManager = new ScenarioStateManager(terminalState)
      
      expect(terminalManager.isTerminalState()).toBe(true)
    })
  })

  describe('consequence retrieval', () => {
    it('should get consequences for valid decision', () => {
      const consequences = stateManager.getDecisionConsequences('d1')
      expect(consequences).toHaveLength(1)
      expect(consequences[0].type).toBe('direct')
    })

    it('should return empty array for invalid decision', () => {
      const consequences = stateManager.getDecisionConsequences('invalid')
      expect(consequences).toEqual([])
    })
  })

  describe('state complexity calculation', () => {
    it('should calculate state complexity correctly', () => {
      const complexity = stateManager.getStateComplexity()
      // 2 decisions * 0.4 + 2 environmental factors * 0.3 + 1 character * 0.3 = 1.7
      expect(complexity).toBe(1.7)
    })
  })

  describe('reset functionality', () => {
    it('should reset to initial state', () => {
      // Make some changes
      const decision = stateManager.getDecision('d1')!
      stateManager.recordDecision(decision)
      
      const newState: ScenarioState = { ...mockState, id: 'state2' }
      stateManager.updateState(newState)
      
      // Reset
      stateManager.reset(mockState)
      
      // Verify reset
      expect(stateManager.getCurrentState().id).toBe('state1')
      expect(stateManager.getStateHistory()).toEqual(['state1'])
      expect(stateManager.getDecisionHistory()).toEqual([])
    })
  })

  describe('immutability', () => {
    it('should return copies of state data', () => {
      const state1 = stateManager.getCurrentState()
      const state2 = stateManager.getCurrentState()
      
      expect(state1).toEqual(state2)
      expect(state1).not.toBe(state2) // Different objects
    })

    it('should return copies of decisions', () => {
      const decisions1 = stateManager.getAvailableDecisions()
      const decisions2 = stateManager.getAvailableDecisions()
      
      expect(decisions1).toEqual(decisions2)
      expect(decisions1).not.toBe(decisions2) // Different arrays
      expect(decisions1[0]).not.toBe(decisions2[0]) // Different objects
    })
  })
})