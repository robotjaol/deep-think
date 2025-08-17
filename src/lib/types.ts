// Core data types for Deep-Think application
import { z } from 'zod'

// Export all types for external use

// Risk Profile Types
export type RiskProfile = 'conservative' | 'balanced' | 'aggressive'
export type ResourceType = 'paper' | 'textbook' | 'video' | 'case-study'

// User-related interfaces
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
  profile: Record<string, any>
}

export interface UserProfile {
  id: string
  preferred_domain?: string | null
  default_job_role?: string | null
  default_risk_profile?: RiskProfile | null
  training_level: number
  total_scenarios_completed: number
  average_score: number
  created_at: string
  updated_at: string
}

// Scenario Engine Core Types
export interface Consequence {
  id: string
  type: 'direct' | 'second-order'
  description: string
  impact_score: number
  delay_minutes?: number
  probability: number
}

export interface Decision {
  id: string
  text: string
  consequences: Consequence[]
  nextStateId: string
  timeWeight?: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface Character {
  id: string
  name: string
  role: string
  personality_traits: string[]
  communication_style: string
  expertise_areas: string[]
}

export interface ScenarioState {
  id: string
  description: string
  context: string
  decisions: Decision[]
  timeLimit?: number
  environmentalFactors: string[]
  characters: Character[]
  riskLevel: 'low' | 'medium' | 'high'
  criticalityScore: number
}

export interface DecisionBranch {
  fromStateId: string
  decisionId: string
  toStateId: string
  conditions?: Record<string, any>
  transitionEffects: string[]
}

export interface ScenarioConfig {
  id: string
  title: string
  domain: string
  difficulty_level: number
  initialState: ScenarioState
  states: Record<string, ScenarioState>
  branches: DecisionBranch[]
  created_by?: string
  is_active: boolean
  created_at: string
  version: string
  tags: string[]
}

// AI Generation Types
export interface GenerationContext {
  domain: string
  jobRole: string
  riskProfile: RiskProfile
  scenarioHistory: string[]
  userPreferences?: Record<string, any>
}

export interface GeneratedContent {
  scenario: string
  characters: Character[]
  environmentalFactors: string[]
  adaptiveElements: string[]
  suggestedDecisions: Omit<Decision, 'id'>[]
}

// Scoring and Feedback Types
export interface ScoreBreakdown {
  category: string
  score: number
  maxScore: number
  explanation: string
  improvementSuggestions: string[]
}

export interface ScoreResult {
  totalScore: number
  directImpact: number
  secondOrderEffects: number
  riskManagement: number
  timeEfficiency: number
  breakdown: ScoreBreakdown[]
  percentile?: number
}

export interface LearningResource {
  id: string
  title: string
  type: ResourceType
  url?: string
  domain?: string
  tags: string[]
  relevance_keywords: string[]
  created_at: string
  description?: string
  difficulty_level?: number
  estimated_time_minutes?: number
}

// Session and Training Types
export interface TrainingSession {
  id: string
  user_id: string
  scenario_id: string
  configuration: GenerationContext
  started_at: string
  completed_at?: string
  final_score?: number
  session_data: SessionData
  current_state_id?: string
  is_paused: boolean
}

export interface SessionData {
  decisions_made: SessionDecision[]
  state_history: string[]
  time_spent_seconds: number
  pause_count: number
  hints_used: number
  current_context: Record<string, any>
}

export interface SessionDecision {
  id: string
  session_id: string
  state_id: string
  decision_text: string
  timestamp: string
  time_taken_ms: number
  score_impact: number
  consequences: Consequence[]
  user_confidence?: number
}