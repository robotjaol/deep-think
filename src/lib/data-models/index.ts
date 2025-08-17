// Central export for all data models, validation schemas, and utilities
export * from '../types'
export * from '../validation'
export * from '../data-utils'

// Re-export commonly used types for convenience
export type {
  ScenarioConfig,
  ScenarioState,
  Decision,
  Consequence,
  Character,
  TrainingSession,
  SessionDecision,
  SessionData,
  ScoreResult,
  ScoreBreakdown,
  GenerationContext,
  GeneratedContent,
  UserProfile,
  LearningResource,
  RiskProfile,
  ResourceType
} from '../types'

// Re-export commonly used validation schemas
export {
  ScenarioConfigSchema,
  ScenarioStateSchema,
  DecisionSchema,
  ConsequenceSchema,
  CharacterSchema,
  TrainingSessionSchema,
  SessionDecisionSchema,
  ScoreResultSchema,
  GenerationContextSchema,
  UserProfileSchema,
  LearningResourceSchema,
  RiskProfileSchema,
  ResourceTypeSchema,
  RiskLevelSchema
} from '../validation'

// Re-export commonly used utility functions
export {
  validateScenarioConfig,
  validateScenarioState,
  validateDecision,
  validateTrainingSession,
  validateUserProfile,
  sanitizeScenarioConfig,
  sanitizeUserInput,
  normalizeDecisionText,
  calculateScenarioComplexity,
  extractScenarioKeywords,
  formatTimeSpent,
  calculateAverageDecisionTime,
  groupDecisionsByRiskLevel,
  filterResourcesByRelevance,
  isValidUUID,
  isValidEmail,
  isValidDateTime,
  convertToTrainingSessionData,
  convertToScenarioConfig
} from '../data-utils'