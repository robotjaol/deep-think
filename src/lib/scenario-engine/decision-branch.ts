import { DecisionBranch, ScenarioState, Decision, ScenarioConfig } from '../types'
import { ScenarioStateManager } from './scenario-state'

/**
 * DecisionBranchHandler manages state transitions based on user decisions
 */
export class DecisionBranchHandler {
  private scenarioConfig: ScenarioConfig
  private stateManager: ScenarioStateManager

  constructor(scenarioConfig: ScenarioConfig, stateManager: ScenarioStateManager) {
    this.scenarioConfig = scenarioConfig
    this.stateManager = stateManager
  }

  /**
   * Process a decision and transition to the next state
   */
  async processDecision(
    decisionId: string, 
    elapsedTimeMs: number,
    userContext?: Record<string, any>
  ): Promise<{
    success: boolean
    newState?: ScenarioState
    transitionEffects: string[]
    error?: string
  }> {
    try {
      // Validate decision
      if (!this.stateManager.isValidDecision(decisionId)) {
        return {
          success: false,
          transitionEffects: [],
          error: 'Invalid decision for current state'
        }
      }

      const decision = this.stateManager.getDecision(decisionId)!
      const currentState = this.stateManager.getCurrentState()

      // Find the appropriate branch
      const branch = this.findBranch(currentState.id, decisionId)
      if (!branch) {
        return {
          success: false,
          transitionEffects: [],
          error: 'No valid transition found for this decision'
        }
      }

      // Check branch conditions
      if (!this.evaluateConditions(branch, userContext, elapsedTimeMs)) {
        return {
          success: false,
          transitionEffects: [],
          error: 'Branch conditions not met'
        }
      }

      // Get the next state
      const nextState = this.scenarioConfig.states[branch.toStateId]
      if (!nextState) {
        return {
          success: false,
          transitionEffects: [],
          error: 'Target state not found'
        }
      }

      // Record the decision and update state
      this.stateManager.recordDecision(decision)
      this.stateManager.updateState(nextState)

      return {
        success: true,
        newState: nextState,
        transitionEffects: [...branch.transitionEffects]
      }
    } catch (error) {
      return {
        success: false,
        transitionEffects: [],
        error: error instanceof Error ? error.message : 'Unknown error during transition'
      }
    }
  }

  /**
   * Find the branch that matches the current state and decision
   */
  private findBranch(fromStateId: string, decisionId: string): DecisionBranch | null {
    return this.scenarioConfig.branches.find(
      branch => branch.fromStateId === fromStateId && branch.decisionId === decisionId
    ) || null
  }

  /**
   * Evaluate branch conditions to determine if transition is allowed
   */
  private evaluateConditions(
    branch: DecisionBranch, 
    userContext?: Record<string, any>,
    elapsedTimeMs?: number
  ): boolean {
    if (!branch.conditions) return true

    const context = {
      userContext: userContext || {},
      elapsedTimeMs,
      stateHistory: this.stateManager.getStateHistory(),
      decisionHistory: this.stateManager.getDecisionHistory(),
      timePressure: elapsedTimeMs ? this.stateManager.getTimePressure(elapsedTimeMs) : 0,
      ...(userContext || {}) // Also add user context at root level for backward compatibility
    }

    // Evaluate each condition
    for (const [key, expectedValue] of Object.entries(branch.conditions)) {
      const actualValue = this.getContextValue(context, key)
      
      if (!this.compareValues(actualValue, expectedValue)) {
        return false
      }
    }

    return true
  }

  /**
   * Get a value from the context using dot notation
   */
  private getContextValue(context: Record<string, any>, key: string): any {
    const keys = key.split('.')
    let value = context
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return undefined
      }
    }
    
    return value
  }

  /**
   * Compare values with support for different comparison operators
   */
  private compareValues(actual: any, expected: any): boolean {
    if (typeof expected === 'object' && expected !== null) {
      // Handle comparison operators
      if ('$gt' in expected) return actual > expected.$gt
      if ('$gte' in expected) return actual >= expected.$gte
      if ('$lt' in expected) return actual < expected.$lt
      if ('$lte' in expected) return actual <= expected.$lte
      if ('$eq' in expected) return actual === expected.$eq
      if ('$ne' in expected) return actual !== expected.$ne
      if ('$in' in expected) return Array.isArray(expected.$in) && expected.$in.includes(actual)
      if ('$nin' in expected) return Array.isArray(expected.$nin) && !expected.$nin.includes(actual)
    }
    
    // Direct comparison
    return actual === expected
  }

  /**
   * Get all possible next states from current state
   */
  getPossibleNextStates(): { decisionId: string; nextStateId: string; decision: Decision }[] {
    const currentState = this.stateManager.getCurrentState()
    const possibleStates: { decisionId: string; nextStateId: string; decision: Decision }[] = []

    for (const decision of currentState.decisions) {
      const branch = this.findBranch(currentState.id, decision.id)
      if (branch) {
        possibleStates.push({
          decisionId: decision.id,
          nextStateId: branch.toStateId,
          decision: { ...decision }
        })
      }
    }

    return possibleStates
  }

  /**
   * Validate the scenario configuration for consistency
   */
  validateScenarioConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check if initial state exists
    if (!this.scenarioConfig.states[this.scenarioConfig.initialState.id]) {
      errors.push('Initial state not found in states collection')
    }

    // Check branch consistency
    for (const branch of this.scenarioConfig.branches) {
      // Check if from state exists
      if (!this.scenarioConfig.states[branch.fromStateId]) {
        errors.push(`Branch references non-existent from state: ${branch.fromStateId}`)
      }

      // Check if to state exists
      if (!this.scenarioConfig.states[branch.toStateId]) {
        errors.push(`Branch references non-existent to state: ${branch.toStateId}`)
      }

      // Check if decision exists in from state
      const fromState = this.scenarioConfig.states[branch.fromStateId]
      if (fromState && !fromState.decisions.some(d => d.id === branch.decisionId)) {
        errors.push(`Branch references non-existent decision: ${branch.decisionId} in state: ${branch.fromStateId}`)
      }
    }

    // Check for orphaned states (states with no incoming branches except initial)
    const reachableStates = new Set([this.scenarioConfig.initialState.id])
    for (const branch of this.scenarioConfig.branches) {
      reachableStates.add(branch.toStateId)
    }

    for (const stateId of Object.keys(this.scenarioConfig.states)) {
      if (!reachableStates.has(stateId)) {
        errors.push(`Orphaned state found: ${stateId}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get transition effects for a specific decision without executing it
   */
  previewTransitionEffects(decisionId: string): string[] {
    const currentState = this.stateManager.getCurrentState()
    const branch = this.findBranch(currentState.id, decisionId)
    return branch ? [...branch.transitionEffects] : []
  }
}