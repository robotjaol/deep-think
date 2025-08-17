// Scoring system exports
export { ScoreCalculator } from './score-calculator'
export { ImpactAnalyzer } from './impact-analyzer'
export { FeedbackGenerator } from './feedback-generator'
export { ResourceMatcher } from './resource-matcher'

// Re-export types for convenience
export type {
  DecisionImpactAnalysis,
  StakeholderImpactAnalysis,
  StakeholderGroup,
  StakeholderGroupImpact,
  CascadeAnalysis,
  CascadeChain,
  AmplificationFactor,
  CompoundingEffect,
  RiskAssessment,
  TimelineImpactAnalysis,
  ContextualFactorAnalysis,
  ImprovementOpportunity,
  RiskLevel
} from './impact-analyzer'

export type {
  SessionFeedback,
  OverallAssessment,
  PerformanceAnalysis,
  LearningRecommendation,
  ImprovementPlan,
  Goal,
  PracticeExercise,
  Milestone,
  DetailedInsight
} from './feedback-generator'

export type {
  RankedResource,
  PersonalizedRecommendation,
  UserLearningPreferences
} from './resource-matcher'

// Re-export commonly used types from main types file
export type {
  ScoreResult,
  ScoreBreakdown,
  SessionDecision,
  LearningResource,
  RiskProfile,
  ResourceType
} from '../types'

// Import types for internal use
import type { SessionDecision, RiskProfile } from '../types'

// Utility function to create a complete scoring system instance
export function createScoringSystem() {
  const { ScoreCalculator } = require('./score-calculator')
  const { ImpactAnalyzer } = require('./impact-analyzer')
  const { FeedbackGenerator } = require('./feedback-generator')
  const { ResourceMatcher } = require('./resource-matcher')
  
  const scoreCalculator = new ScoreCalculator()
  const impactAnalyzer = new ImpactAnalyzer()
  const feedbackGenerator = new FeedbackGenerator()
  const resourceMatcher = new ResourceMatcher()

  return {
    scoreCalculator,
    impactAnalyzer,
    feedbackGenerator,
    resourceMatcher,
    
    // Convenience method for complete session analysis
    analyzeSession: async (
      sessionDecisions: SessionDecision[],
      scenarioContext: any,
      userRiskProfile: RiskProfile,
      userTrainingLevel: number = 1,
      scenarioDifficulty: number = 1
    ) => {
      // Calculate scores
      const scoreResult = scoreCalculator.calculateSessionScore(
        sessionDecisions,
        userRiskProfile,
        scenarioDifficulty
      )

      // Generate feedback
      const feedback = feedbackGenerator.generateSessionFeedback(
        scoreResult,
        sessionDecisions,
        scenarioContext,
        userRiskProfile,
        userTrainingLevel
      )

      // Find relevant resources
      const resources = resourceMatcher.findRelevantResources(
        sessionDecisions,
        scoreResult,
        userRiskProfile,
        userTrainingLevel
      )

      return {
        scoreResult,
        feedback,
        resources
      }
    }
  }
}