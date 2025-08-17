// Data transformation and validation utilities for Deep-Think
import { z } from 'zod'
import type {
  ScenarioConfig,
  ScenarioState,
  Decision,
  TrainingSession,
  SessionDecision,
  ScoreResult,
  GenerationContext,
  UserProfile,
  LearningResource
} from './types'
import {
  ScenarioConfigSchema,
  ScenarioStateSchema,
  DecisionSchema,
  TrainingSessionSchema,
  SessionDecisionSchema,
  ScoreResultSchema,
  GenerationContextSchema,
  UserProfileSchema,
  LearningResourceSchema
} from './validation'

// Validation result type
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: string[]
}

// Generic validation function
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data)
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues?.map(err => `${err.path.join('.')}: ${err.message}`) || ['Validation error']
      }
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    }
  }
}

// Specific validation functions
export function validateScenarioConfig(data: unknown): ValidationResult<ScenarioConfig> {
  return validateData(ScenarioConfigSchema, data)
}

export function validateScenarioState(data: unknown): ValidationResult<ScenarioState> {
  return validateData(ScenarioStateSchema, data)
}

export function validateDecision(data: unknown): ValidationResult<Decision> {
  return validateData(DecisionSchema, data)
}

export function validateTrainingSession(data: unknown): ValidationResult<TrainingSession> {
  return validateData(TrainingSessionSchema, data)
}

export function validateSessionDecision(data: unknown): ValidationResult<SessionDecision> {
  return validateData(SessionDecisionSchema, data)
}

export function validateScoreResult(data: unknown): ValidationResult<ScoreResult> {
  return validateData(ScoreResultSchema, data)
}

export function validateGenerationContext(data: unknown): ValidationResult<GenerationContext> {
  return validateData(GenerationContextSchema, data)
}

export function validateUserProfile(data: unknown): ValidationResult<UserProfile> {
  return validateData(UserProfileSchema, data)
}

export function validateLearningResource(data: unknown): ValidationResult<LearningResource> {
  return validateData(LearningResourceSchema, data)
}

// Data transformation utilities
export function sanitizeScenarioConfig(config: Partial<ScenarioConfig>): Partial<ScenarioConfig> {
  return {
    ...config,
    title: config.title?.trim(),
    domain: config.domain?.trim().toLowerCase(),
    tags: config.tags?.map(tag => tag.trim().toLowerCase()).filter(Boolean) || [],
    difficulty_level: Math.max(1, Math.min(5, config.difficulty_level || 1))
  }
}

export function sanitizeUserInput(input: string): string {
  return input.trim().replace(/[<>]/g, '').substring(0, 1000)
}

export function normalizeDecisionText(text: string): string {
  return text.trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?-]/g, '')
    .trim()
    .substring(0, 300)
}

export function calculateScenarioComplexity(scenario: ScenarioConfig): number {
  const stateCount = Object.keys(scenario.states).length
  const branchCount = scenario.branches.length
  const avgDecisionsPerState = Object.values(scenario.states)
    .reduce((sum, state) => sum + state.decisions.length, 0) / stateCount
  
  return Math.round((stateCount * 0.3 + branchCount * 0.4 + avgDecisionsPerState * 0.3) * 10) / 10
}

export function extractScenarioKeywords(scenario: ScenarioConfig): string[] {
  const keywords = new Set<string>()
  
  // Add domain and tags
  keywords.add(scenario.domain.toLowerCase())
  scenario.tags.forEach(tag => keywords.add(tag.toLowerCase()))
  
  // Extract keywords from states
  Object.values(scenario.states).forEach(state => {
    // Simple keyword extraction from description and context
    const text = `${state.description} ${state.context}`.toLowerCase()
    const words = text.match(/\b[a-z]{3,}\b/g) || []
    words.forEach(word => {
      if (!['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use'].includes(word)) {
        keywords.add(word)
      }
    })
  })
  
  return Array.from(keywords).slice(0, 20)
}

export function formatTimeSpent(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
}

export function calculateAverageDecisionTime(decisions: SessionDecision[]): number {
  if (decisions.length === 0) return 0
  
  const totalTime = decisions.reduce((sum, decision) => sum + decision.time_taken_ms, 0)
  return Math.round(totalTime / decisions.length)
}

export function groupDecisionsByRiskLevel(decisions: Decision[]): Record<string, Decision[]> {
  return decisions.reduce((groups, decision) => {
    const level = decision.riskLevel
    if (!groups[level]) {
      groups[level] = []
    }
    groups[level].push(decision)
    return groups
  }, {} as Record<string, Decision[]>)
}

export function filterResourcesByRelevance(
  resources: LearningResource[],
  keywords: string[],
  minRelevance: number = 0.3
): LearningResource[] {
  return resources
    .map(resource => ({
      resource,
      relevance: calculateResourceRelevance(resource, keywords)
    }))
    .filter(({ relevance }) => relevance >= minRelevance)
    .sort((a, b) => b.relevance - a.relevance)
    .map(({ resource }) => resource)
}

function calculateResourceRelevance(resource: LearningResource, keywords: string[]): number {
  const resourceKeywords = [
    ...resource.tags,
    ...resource.relevance_keywords,
    resource.domain || ''
  ].map(k => k.toLowerCase())
  
  const matches = keywords.filter(keyword => 
    resourceKeywords.some(rk => rk.includes(keyword.toLowerCase()))
  )
  
  return matches.length / Math.max(keywords.length, 1)
}

// Type guards
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidDateTime(dateTime: string): boolean {
  const date = new Date(dateTime)
  return !isNaN(date.getTime()) && dateTime === date.toISOString()
}

// Data conversion utilities
export function convertToTrainingSessionData(rawData: any): Partial<TrainingSession> {
  return {
    id: rawData.id,
    user_id: rawData.user_id,
    scenario_id: rawData.scenario_id,
    configuration: rawData.configuration || {},
    started_at: rawData.started_at,
    completed_at: rawData.completed_at || undefined,
    final_score: rawData.final_score || undefined,
    session_data: rawData.session_data || {
      decisions_made: [],
      state_history: [],
      time_spent_seconds: 0,
      pause_count: 0,
      hints_used: 0,
      current_context: {}
    },
    current_state_id: rawData.current_state_id || undefined,
    is_paused: rawData.is_paused || false
  }
}

export function convertToScenarioConfig(rawData: any): Partial<ScenarioConfig> {
  return {
    id: rawData.id,
    title: rawData.title,
    domain: rawData.domain,
    difficulty_level: rawData.difficulty_level || 1,
    initialState: rawData.config?.initialState,
    states: rawData.config?.states || {},
    branches: rawData.config?.branches || [],
    created_by: rawData.created_by,
    is_active: rawData.is_active !== false,
    created_at: rawData.created_at,
    version: rawData.config?.version || '1.0.0',
    tags: rawData.config?.tags || []
  }
}