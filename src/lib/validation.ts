// Zod validation schemas for Deep-Think data models
import { z } from 'zod'

// Base validation schemas
export const RiskProfileSchema = z.enum(['conservative', 'balanced', 'aggressive'])
export const ResourceTypeSchema = z.enum(['paper', 'textbook', 'video', 'case-study'])
export const RiskLevelSchema = z.enum(['low', 'medium', 'high'])

// User validation schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  profile: z.record(z.string(), z.any()).default({})
})

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  preferred_domain: z.string().optional().nullable(),
  default_job_role: z.string().optional().nullable(),
  default_risk_profile: RiskProfileSchema.optional().nullable(),
  training_level: z.number().int().min(1).max(10).default(1),
  total_scenarios_completed: z.number().int().min(0).default(0),
  average_score: z.number().min(0).max(100).default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Scenario Engine validation schemas
export const ConsequenceSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['direct', 'second-order']),
  description: z.string().min(1).max(500),
  impact_score: z.number().min(-100).max(100),
  delay_minutes: z.number().int().min(0).optional(),
  probability: z.number().min(0).max(1)
})

export const DecisionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(300),
  consequences: z.array(ConsequenceSchema).min(1),
  nextStateId: z.string().uuid(),
  timeWeight: z.number().min(0).max(2).optional(),
  riskLevel: RiskLevelSchema
})

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  personality_traits: z.array(z.string()).max(10),
  communication_style: z.string().min(1).max(100),
  expertise_areas: z.array(z.string()).max(10)
})

export const ScenarioStateSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(1000),
  context: z.string().min(1).max(2000),
  decisions: z.array(DecisionSchema).min(1).max(6),
  timeLimit: z.number().int().min(30).max(600).optional(),
  environmentalFactors: z.array(z.string()).max(10),
  characters: z.array(CharacterSchema).max(5),
  riskLevel: RiskLevelSchema,
  criticalityScore: z.number().min(1).max(10)
})

export const DecisionBranchSchema = z.object({
  fromStateId: z.string().uuid(),
  decisionId: z.string().uuid(),
  toStateId: z.string().uuid(),
  conditions: z.record(z.string(), z.any()).optional(),
  transitionEffects: z.array(z.string()).max(5)
})

export const ScenarioConfigSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  domain: z.string().min(1).max(100),
  difficulty_level: z.number().int().min(1).max(5),
  initialState: ScenarioStateSchema,
  states: z.record(z.string().uuid(), ScenarioStateSchema),
  branches: z.array(DecisionBranchSchema).min(1),
  created_by: z.string().uuid().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  tags: z.array(z.string()).max(10)
})

// AI Generation validation schemas
export const GenerationContextSchema = z.object({
  domain: z.string().min(1).max(100),
  jobRole: z.string().min(1).max(100),
  riskProfile: RiskProfileSchema,
  scenarioHistory: z.array(z.string()).max(20),
  userPreferences: z.record(z.string(), z.any()).optional()
})

export const GeneratedContentSchema = z.object({
  scenario: z.string().min(1).max(2000),
  characters: z.array(CharacterSchema).max(5),
  environmentalFactors: z.array(z.string()).max(10),
  adaptiveElements: z.array(z.string()).max(10),
  suggestedDecisions: z.array(DecisionSchema.omit({ id: true })).min(2).max(6)
})

// Scoring validation schemas
export const ScoreBreakdownSchema = z.object({
  category: z.string().min(1).max(100),
  score: z.number().min(0),
  maxScore: z.number().min(0),
  explanation: z.string().min(1).max(500),
  improvementSuggestions: z.array(z.string()).max(5)
})

export const ScoreResultSchema = z.object({
  totalScore: z.number().min(0).max(100),
  directImpact: z.number().min(0).max(100),
  secondOrderEffects: z.number().min(0).max(100),
  riskManagement: z.number().min(0).max(100),
  timeEfficiency: z.number().min(0).max(100),
  breakdown: z.array(ScoreBreakdownSchema).min(1),
  percentile: z.number().min(0).max(100).optional()
})

export const LearningResourceSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  type: ResourceTypeSchema,
  url: z.string().url().optional(),
  domain: z.string().max(100).optional(),
  tags: z.array(z.string()).max(10),
  relevance_keywords: z.array(z.string()).max(20),
  created_at: z.string().datetime(),
  description: z.string().max(500).optional(),
  difficulty_level: z.number().int().min(1).max(5).optional(),
  estimated_time_minutes: z.number().int().min(1).max(480).optional()
})

// Session validation schemas
export const SessionDecisionSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  state_id: z.string().uuid(),
  decision_text: z.string().min(1).max(300),
  timestamp: z.string().datetime(),
  time_taken_ms: z.number().int().min(0),
  score_impact: z.number().min(-100).max(100),
  consequences: z.array(ConsequenceSchema),
  user_confidence: z.number().min(1).max(5).optional()
})

export const SessionDataSchema = z.object({
  decisions_made: z.array(SessionDecisionSchema),
  state_history: z.array(z.string().uuid()),
  time_spent_seconds: z.number().int().min(0),
  pause_count: z.number().int().min(0),
  hints_used: z.number().int().min(0),
  current_context: z.record(z.string(), z.any())
})

export const TrainingSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  scenario_id: z.string().uuid(),
  configuration: GenerationContextSchema,
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  final_score: z.number().min(0).max(100).optional(),
  session_data: SessionDataSchema,
  current_state_id: z.string().uuid().optional(),
  is_paused: z.boolean().default(false)
})

// Input validation schemas for API endpoints
export const CreateScenarioInputSchema = ScenarioConfigSchema.omit({
  id: true,
  created_at: true,
  created_by: true
})

export const UpdateUserProfileInputSchema = UserProfileSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial()

export const StartTrainingSessionInputSchema = z.object({
  scenario_id: z.string().uuid(),
  configuration: GenerationContextSchema
})

export const MakeDecisionInputSchema = z.object({
  session_id: z.string().uuid(),
  decision_id: z.string().uuid(),
  user_confidence: z.number().min(1).max(5).optional()
})