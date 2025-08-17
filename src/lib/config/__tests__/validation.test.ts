// Unit tests for configuration validation
import { 
  validateUserConfiguration, 
  validateConfigurationCombination,
  validatePreferences,
  UserConfigurationSchema,
  UserPreferencesSchema
} from '../validation'
import { AVAILABLE_DOMAINS } from '../defaults'
import type { UserConfiguration, UserPreferences } from '../types'

describe('Configuration Validation', () => {
  describe('validateUserConfiguration', () => {
    it('should validate a complete valid configuration', () => {
      const validConfig: UserConfiguration = {
        domain: 'cybersecurity',
        jobRole: 'security-analyst',
        riskProfile: 'balanced',
        experienceLevel: 'intermediate',
        preferences: {
          scenarioComplexity: 'moderate',
          timeConstraints: 'moderate',
          feedbackDetail: 'detailed',
          visualizations: true,
          notifications: true,
          autoSave: true
        }
      }

      const result = validateUserConfiguration(validConfig)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate a minimal valid configuration', () => {
      const minimalConfig: UserConfiguration = {
        domain: 'healthcare',
        jobRole: 'emergency-physician',
        riskProfile: 'aggressive'
      }

      const result = validateUserConfiguration(minimalConfig)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject configuration with missing required fields', () => {
      const invalidConfig = {
        domain: 'cybersecurity',
        // missing jobRole and riskProfile
      }

      const result = validateUserConfiguration(invalidConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(error => error.includes('jobRole') || error.includes('Required'))).toBe(true)
      expect(result.errors.some(error => error.includes('riskProfile') || error.includes('Required'))).toBe(true)
    })

    it('should reject configuration with invalid risk profile', () => {
      const invalidConfig = {
        domain: 'cybersecurity',
        jobRole: 'security-analyst',
        riskProfile: 'invalid-profile'
      }

      const result = validateUserConfiguration(invalidConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('riskProfile'))).toBe(true)
    })

    it('should reject configuration with invalid experience level', () => {
      const invalidConfig = {
        domain: 'cybersecurity',
        jobRole: 'security-analyst',
        riskProfile: 'balanced',
        experienceLevel: 'invalid-level'
      }

      const result = validateUserConfiguration(invalidConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('experienceLevel'))).toBe(true)
    })
  })

  describe('validateConfigurationCombination', () => {
    it('should validate compatible domain, job role, and risk profile', () => {
      const result = validateConfigurationCombination(
        'cybersecurity',
        'security-analyst',
        'balanced',
        AVAILABLE_DOMAINS
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid domain', () => {
      const result = validateConfigurationCombination(
        'invalid-domain',
        'security-analyst',
        'balanced',
        AVAILABLE_DOMAINS
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('invalid-domain'))).toBe(true)
    })

    it('should reject job role not available in domain', () => {
      const result = validateConfigurationCombination(
        'cybersecurity',
        'emergency-physician', // healthcare role
        'balanced',
        AVAILABLE_DOMAINS
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('emergency-physician'))).toBe(true)
      expect(result.suggestions?.length).toBeGreaterThan(0)
    })

    it('should reject incompatible risk profile for job role', () => {
      const result = validateConfigurationCombination(
        'aerospace',
        'safety-engineer', // only supports conservative
        'aggressive',
        AVAILABLE_DOMAINS
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('aggressive'))).toBe(true)
      expect(result.suggestions?.some(suggestion => suggestion.includes('conservative'))).toBe(true)
    })

    it('should provide warnings for potentially suboptimal combinations', () => {
      const result = validateConfigurationCombination(
        'finance',
        'risk-manager', // risk-manager supports balanced and conservative, not aggressive
        'aggressive',
        AVAILABLE_DOMAINS
      )

      // This should be invalid because risk-manager doesn't support aggressive
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('aggressive'))).toBe(true)
    })

    it('should reject inactive domain', () => {
      const inactiveDomains = AVAILABLE_DOMAINS.map(d => ({ ...d, isActive: false }))
      
      const result = validateConfigurationCombination(
        'cybersecurity',
        'security-analyst',
        'balanced',
        inactiveDomains
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('inactive'))).toBe(true)
    })
  })

  describe('validatePreferences', () => {
    it('should validate complete valid preferences', () => {
      const validPreferences: UserPreferences = {
        scenarioComplexity: 'moderate',
        timeConstraints: 'strict',
        feedbackDetail: 'comprehensive',
        visualizations: true,
        notifications: false,
        autoSave: true
      }

      const result = validatePreferences(validPreferences)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate partial preferences with defaults', () => {
      const partialPreferences = {
        scenarioComplexity: 'simple',
        visualizations: false
      }

      const result = validatePreferences(partialPreferences)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid scenario complexity', () => {
      const invalidPreferences = {
        scenarioComplexity: 'invalid-complexity',
        timeConstraints: 'moderate',
        feedbackDetail: 'detailed',
        visualizations: true,
        notifications: true,
        autoSave: true
      }

      const result = validatePreferences(invalidPreferences)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('scenarioComplexity'))).toBe(true)
    })

    it('should reject invalid time constraints', () => {
      const invalidPreferences = {
        scenarioComplexity: 'moderate',
        timeConstraints: 'invalid-time',
        feedbackDetail: 'detailed',
        visualizations: true,
        notifications: true,
        autoSave: true
      }

      const result = validatePreferences(invalidPreferences)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('timeConstraints'))).toBe(true)
    })

    it('should reject invalid feedback detail level', () => {
      const invalidPreferences = {
        scenarioComplexity: 'moderate',
        timeConstraints: 'moderate',
        feedbackDetail: 'invalid-detail',
        visualizations: true,
        notifications: true,
        autoSave: true
      }

      const result = validatePreferences(invalidPreferences)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('feedbackDetail'))).toBe(true)
    })
  })

  describe('Schema validation', () => {
    it('should parse valid user configuration with schema', () => {
      const validConfig = {
        domain: 'cybersecurity',
        jobRole: 'security-analyst',
        riskProfile: 'balanced'
      }

      expect(() => UserConfigurationSchema.parse(validConfig)).not.toThrow()
    })

    it('should parse valid user preferences with schema', () => {
      const validPreferences = {
        scenarioComplexity: 'moderate',
        timeConstraints: 'moderate',
        feedbackDetail: 'detailed',
        visualizations: true,
        notifications: true,
        autoSave: true
      }

      expect(() => UserPreferencesSchema.parse(validPreferences)).not.toThrow()
    })

    it('should apply defaults for missing preference fields', () => {
      const partialPreferences = {
        scenarioComplexity: 'simple'
      }

      const parsed = UserPreferencesSchema.parse(partialPreferences)
      expect(parsed.timeConstraints).toBe('moderate') // default
      expect(parsed.feedbackDetail).toBe('detailed') // default
      expect(parsed.visualizations).toBe(true) // default
    })
  })
})