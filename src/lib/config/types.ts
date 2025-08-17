// Configuration types for user context management
import { RiskProfile } from '../types'

// Domain configuration
export interface DomainConfig {
  id: string
  name: string
  description: string
  jobRoles: JobRoleConfig[]
  isActive: boolean
  requiredExperience?: 'entry' | 'intermediate' | 'senior'
}

// Job role configuration
export interface JobRoleConfig {
  id: string
  name: string
  description: string
  domain: string
  responsibilities: string[]
  riskProfiles: RiskProfile[]
  requiredSkills?: string[]
}

// User configuration context
export interface UserConfiguration {
  domain: string
  jobRole: string
  riskProfile: RiskProfile
  experienceLevel?: 'entry' | 'intermediate' | 'senior'
  preferences?: UserPreferences
}

// User preferences
export interface UserPreferences {
  scenarioComplexity: 'simple' | 'moderate' | 'complex'
  timeConstraints: 'relaxed' | 'moderate' | 'strict'
  feedbackDetail: 'brief' | 'detailed' | 'comprehensive'
  visualizations: boolean
  notifications: boolean
  autoSave: boolean
}

// Configuration validation result
export interface ConfigurationValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions?: string[]
}

// Configuration storage interface
export interface ConfigurationStorage {
  userId: string
  configuration: UserConfiguration
  isDefault: boolean
  lastUsed: string
  createdAt: string
  updatedAt: string
}

// Configuration update payload
export interface ConfigurationUpdatePayload {
  domain?: string
  jobRole?: string
  riskProfile?: RiskProfile
  experienceLevel?: 'entry' | 'intermediate' | 'senior'
  preferences?: Partial<UserPreferences>
}