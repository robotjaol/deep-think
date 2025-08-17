// Scenario Engine exports
export { ScenarioStateManager } from './scenario-state'
export { DecisionBranchHandler } from './decision-branch'
export { OutcomeCalculator } from './outcome-calculator'

// Re-export types for convenience
export type {
  ScenarioState,
  Decision,
  DecisionBranch,
  ScenarioConfig,
  Consequence,
  ScoreResult,
  ScoreBreakdown
} from '../types'