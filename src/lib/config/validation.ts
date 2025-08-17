// Configuration validation schemas and functions
import { z } from 'zod'
import { RiskProfileSchema } from '../validation'
import type { 
  UserConfiguration, 
  UserPreferences, 
  ConfigurationValidationResult,
  DomainConfig,
  JobRoleConfig
} from './types'
import type { RiskProfile } from '../types'

// Validation schemas
export const ExperienceLevelSchema = z.enum(['entry', 'intermediate', 'senior'])

export const UserPreferencesSchema = z.object({
  scenarioComplexity: z.enum(['simple', 'moderate', 'complex']).default('moderate'),
  timeConstraints: z.enum(['relaxed', 'moderate', 'strict']).default('moderate'),
  feedbackDetail: z.enum(['brief', 'detailed', 'comprehensive']).default('detailed'),
  visualizations: z.boolean().default(true),
  notifications: z.boolean().default(true),
  autoSave: z.boolean().default(true)
})

export const UserConfigurationSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  jobRole: z.string().min(1, 'Job role is required'),
  riskProfile: RiskProfileSchema,
  experienceLevel: ExperienceLevelSchema.optional(),
  preferences: UserPreferencesSchema.optional()
})

export const DomainConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  jobRoles: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    domain: z.string().min(1),
    responsibilities: z.array(z.string()),
    riskProfiles: z.array(RiskProfileSchema),
    requiredSkills: z.array(z.string()).optional()
  })),
  isActive: z.boolean().default(true),
  requiredExperience: ExperienceLevelSchema.optional()
})

export const ConfigurationUpdatePayloadSchema = z.object({
  domain: z.string().min(1).optional(),
  jobRole: z.string().min(1).optional(),
  riskProfile: RiskProfileSchema.optional(),
  experienceLevel: ExperienceLevelSchema.optional(),
  preferences: UserPreferencesSchema.partial().optional()
})

// Validation functions
export function validateUserConfiguration(config: unknown): ConfigurationValidationResult {
  try {
    UserConfigurationSchema.parse(config)
    return {
      isValid: true,
      errors: [],
      warnings: []
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`),
        warnings: []
      }
    }
    return {
      isValid: false,
      errors: ['Unknown validation error'],
      warnings: []
    }
  }
}

export function validateConfigurationCombination(
  domain: string, 
  jobRole: string, 
  riskProfile: RiskProfile,
  availableDomains: DomainConfig[]
): ConfigurationValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Find the domain configuration
  const domainConfig = availableDomains.find(d => d.id === domain)
  if (!domainConfig) {
    errors.push(`Domain '${domain}' is not available`)
    return { isValid: false, errors, warnings, suggestions }
  }

  if (!domainConfig.isActive) {
    errors.push(`Domain '${domain}' is currently inactive`)
  }

  // Find the job role configuration
  const jobRoleConfig = domainConfig.jobRoles.find(jr => jr.id === jobRole)
  if (!jobRoleConfig) {
    errors.push(`Job role '${jobRole}' is not available in domain '${domain}'`)
    const availableRoles = domainConfig.jobRoles.map(jr => jr.name).join(', ')
    suggestions.push(`Available roles in ${domain}: ${availableRoles}`)
    return { isValid: false, errors, warnings, suggestions }
  }

  // Validate risk profile compatibility
  if (!jobRoleConfig.riskProfiles.includes(riskProfile)) {
    errors.push(`Risk profile '${riskProfile}' is not compatible with job role '${jobRole}'`)
    const compatibleProfiles = jobRoleConfig.riskProfiles.join(', ')
    suggestions.push(`Compatible risk profiles for ${jobRole}: ${compatibleProfiles}`)
  }

  // Add warnings for potentially suboptimal combinations
  if (riskProfile === 'aggressive' && jobRole.toLowerCase().includes('compliance')) {
    warnings.push('Aggressive risk profile may not align well with compliance roles')
  }

  if (riskProfile === 'conservative' && jobRole.toLowerCase().includes('innovation')) {
    warnings.push('Conservative risk profile may limit innovation-focused scenarios')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

export function validatePreferences(preferences: unknown): ConfigurationValidationResult {
  try {
    UserPreferencesSchema.parse(preferences)
    return {
      isValid: true,
      errors: [],
      warnings: []
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`),
        warnings: []
      }
    }
    return {
      isValid: false,
      errors: ['Unknown validation error'],
      warnings: []
    }
  }
}