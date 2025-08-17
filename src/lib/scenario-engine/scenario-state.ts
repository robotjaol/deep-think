import { ScenarioState, Decision, Consequence, Character } from '../types'

/**
 * ScenarioState class manages the current state of a crisis scenario
 * and provides decision branching logic
 */
export class ScenarioStateManager {
  private state: ScenarioState
  private stateHistory: string[] = []
  private decisionHistory: Decision[] = []

  constructor(initialState: ScenarioState) {
    this.state = initialState
    this.stateHistory.push(initialState.id)
  }

  /**
   * Get the current scenario state
   */
  getCurrentState(): ScenarioState {
    return { ...this.state }
  }

  /**
   * Get available decisions for the current state
   */
  getAvailableDecisions(): Decision[] {
    return this.state.decisions.map(decision => ({ ...decision }))
  }

  /**
   * Check if a decision is valid for the current state
   */
  isValidDecision(decisionId: string): boolean {
    return this.state.decisions.some(decision => decision.id === decisionId)
  }

  /**
   * Get decision by ID from current state
   */
  getDecision(decisionId: string): Decision | null {
    const decision = this.state.decisions.find(d => d.id === decisionId)
    return decision ? { ...decision } : null
  }

  /**
   * Update the current state (used by DecisionBranch for state transitions)
   */
  updateState(newState: ScenarioState): void {
    this.state = newState
    this.stateHistory.push(newState.id)
  }

  /**
   * Record a decision that was made
   */
  recordDecision(decision: Decision): void {
    this.decisionHistory.push({ ...decision })
  }

  /**
   * Get the history of states visited
   */
  getStateHistory(): string[] {
    return [...this.stateHistory]
  }

  /**
   * Get the history of decisions made
   */
  getDecisionHistory(): Decision[] {
    return this.decisionHistory.map(decision => ({ ...decision }))
  }

  /**
   * Calculate time pressure based on time limit and elapsed time
   */
  getTimePressure(elapsedTimeMs: number): number {
    if (!this.state.timeLimit) return 0
    
    const timeLimit = this.state.timeLimit * 1000 // Convert to milliseconds
    const pressure = Math.min(Math.max(elapsedTimeMs / timeLimit, 0), 1)
    return pressure
  }

  /**
   * Get contextual information for decision making
   */
  getDecisionContext(): {
    currentRiskLevel: string
    criticalityScore: number
    environmentalFactors: string[]
    availableCharacters: Character[]
    timeRemaining?: number
  } {
    return {
      currentRiskLevel: this.state.riskLevel,
      criticalityScore: this.state.criticalityScore,
      environmentalFactors: [...this.state.environmentalFactors],
      availableCharacters: this.state.characters.map(char => ({ ...char })),
      timeRemaining: this.state.timeLimit
    }
  }

  /**
   * Check if the scenario has reached a terminal state
   */
  isTerminalState(): boolean {
    return this.state.decisions.length === 0
  }

  /**
   * Get consequences for a specific decision
   */
  getDecisionConsequences(decisionId: string): Consequence[] {
    const decision = this.getDecision(decisionId)
    return decision ? decision.consequences.map(c => ({ ...c })) : []
  }

  /**
   * Calculate the complexity score of current state
   */
  getStateComplexity(): number {
    const decisionCount = this.state.decisions.length
    const environmentalFactors = this.state.environmentalFactors.length
    const characterCount = this.state.characters.length
    
    // Weighted complexity calculation
    return (decisionCount * 0.4) + (environmentalFactors * 0.3) + (characterCount * 0.3)
  }

  /**
   * Reset to initial state (for testing or replay)
   */
  reset(initialState: ScenarioState): void {
    this.state = initialState
    this.stateHistory = [initialState.id]
    this.decisionHistory = []
  }
}