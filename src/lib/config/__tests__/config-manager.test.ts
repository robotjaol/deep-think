// Unit tests for ConfigurationManager
import { ConfigurationManager } from '../config-manager'
import { createDefaultConfiguration } from '../defaults'
import type { UserConfiguration, ConfigurationUpdatePayload } from '../types'

// Mock functions
const mockSingle = jest.fn()
const mockUpsert = jest.fn()
const mockUpdate = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    single: mockSingle,
    upsert: mockUpsert,
    update: mockUpdate.mockReturnThis()
  }))
}

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager
  let mockUserId: string

  beforeEach(() => {
    configManager = new ConfigurationManager(mockSupabaseClient as any)
    mockUserId = 'test-user-id'
    jest.clearAllMocks()
    
    // Reset mock implementations
    mockSingle.mockReset()
    mockUpsert.mockReset()
    mockUpdate.mockReset()
    mockEq.mockReset()
    mockSelect.mockReset()
  })

  describe('getUserConfiguration', () => {
    it('should return existing configuration from database', async () => {
      const mockProfile = {
        preferred_domain: 'cybersecurity',
        default_job_role: 'security-analyst',
        default_risk_profile: 'conservative' // Changed to match the first available profile
      }

      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null
      })

      const result = await configManager.getUserConfiguration(mockUserId)

      expect(result.domain).toBe('cybersecurity')
      expect(result.jobRole).toBe('security-analyst')
      expect(result.riskProfile).toBe('conservative')
    })

    it('should create and return default configuration when none exists', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // No data found
      })

      mockUpsert.mockResolvedValue({
        error: null
      })

      const result = await configManager.getUserConfiguration(mockUserId)

      expect(result.domain).toBeDefined()
      expect(result.jobRole).toBeDefined()
      expect(result.riskProfile).toBeDefined()
      expect(mockUpsert).toHaveBeenCalled()
    })

    it('should return default configuration on database error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'SOME_ERROR', message: 'Database error' }
      })

      const result = await configManager.getUserConfiguration(mockUserId)

      expect(result.domain).toBeDefined()
      expect(result.jobRole).toBeDefined()
      expect(result.riskProfile).toBeDefined()
    })

    it('should handle incomplete profile data', async () => {
      const incompleteProfile = {
        preferred_domain: 'cybersecurity',
        default_job_role: null,
        default_risk_profile: 'balanced'
      }

      mockSingle.mockResolvedValue({
        data: incompleteProfile,
        error: null
      })

      mockUpsert.mockResolvedValue({
        error: null
      })

      const result = await configManager.getUserConfiguration(mockUserId)

      expect(result.domain).toBeDefined()
      expect(result.jobRole).toBeDefined()
      expect(result.riskProfile).toBeDefined()
    })
  })

  describe('saveUserConfiguration', () => {
    it('should save valid configuration to database', async () => {
      const validConfig: UserConfiguration = {
        domain: 'cybersecurity',
        jobRole: 'security-analyst',
        riskProfile: 'conservative'
      }

      mockUpsert.mockResolvedValue({
        error: null
      })

      await expect(configManager.saveUserConfiguration(mockUserId, validConfig))
        .resolves.not.toThrow()

      expect(mockUpsert).toHaveBeenCalledWith({
        id: mockUserId,
        preferred_domain: 'cybersecurity',
        default_job_role: 'security-analyst',
        default_risk_profile: 'conservative',
        updated_at: expect.any(String)
      })
    })

    it('should save configuration with preferences', async () => {
      const configWithPreferences: UserConfiguration = {
        domain: 'healthcare',
        jobRole: 'emergency-physician',
        riskProfile: 'aggressive',
        preferences: {
          scenarioComplexity: 'complex',
          timeConstraints: 'strict',
          feedbackDetail: 'comprehensive',
          visualizations: true,
          notifications: false,
          autoSave: true
        }
      }

      mockUpsert.mockResolvedValue({
        error: null
      })

      mockEq.mockResolvedValue({
        error: null
      })

      await expect(configManager.saveUserConfiguration(mockUserId, configWithPreferences))
        .resolves.not.toThrow()

      expect(mockUpsert).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalled()
    })

    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        domain: 'invalid-domain',
        jobRole: 'security-analyst',
        riskProfile: 'balanced'
      } as UserConfiguration

      await expect(configManager.saveUserConfiguration(mockUserId, invalidConfig))
        .rejects.toThrow('Invalid configuration')
    })

    it('should handle database errors gracefully', async () => {
      const validConfig: UserConfiguration = {
        domain: 'cybersecurity',
        jobRole: 'security-analyst',
        riskProfile: 'conservative'
      }

      mockUpsert.mockResolvedValue({
        error: { message: 'Database error' }
      })

      await expect(configManager.saveUserConfiguration(mockUserId, validConfig))
        .rejects.toThrow()
    })
  })

  describe('updateUserConfiguration', () => {
    it('should update configuration with partial data', async () => {
      const currentConfig: UserConfiguration = {
        domain: 'cybersecurity',
        jobRole: 'security-analyst',
        riskProfile: 'conservative'
      }

      const updates: ConfigurationUpdatePayload = {
        riskProfile: 'balanced'
      }

      // Mock getting current configuration
      mockSingle.mockResolvedValue({
        data: {
          preferred_domain: currentConfig.domain,
          default_job_role: currentConfig.jobRole,
          default_risk_profile: currentConfig.riskProfile
        },
        error: null
      })

      // Mock saving updated configuration
      mockUpsert.mockResolvedValue({
        error: null
      })

      const result = await configManager.updateUserConfiguration(mockUserId, updates)

      expect(result.domain).toBe('cybersecurity')
      expect(result.jobRole).toBe('security-analyst')
      expect(result.riskProfile).toBe('balanced')
    })

    it('should merge preferences correctly', async () => {
      const currentConfig: UserConfiguration = {
        domain: 'cybersecurity',
        jobRole: 'security-analyst',
        riskProfile: 'conservative',
        preferences: {
          scenarioComplexity: 'moderate',
          timeConstraints: 'moderate',
          feedbackDetail: 'detailed',
          visualizations: true,
          notifications: true,
          autoSave: true
        }
      }

      const updates: ConfigurationUpdatePayload = {
        preferences: {
          scenarioComplexity: 'complex',
          visualizations: false
        }
      }

      // Mock getting current configuration - first call for user_profiles
      mockSingle.mockResolvedValueOnce({
        data: {
          preferred_domain: currentConfig.domain,
          default_job_role: currentConfig.jobRole,
          default_risk_profile: currentConfig.riskProfile
        },
        error: null
      })
      
      // Mock getting user preferences - second call for users table
      mockSingle.mockResolvedValueOnce({
        data: {
          profile: {
            preferences: currentConfig.preferences,
            experienceLevel: currentConfig.experienceLevel
          }
        },
        error: null
      })

      mockUpsert.mockResolvedValue({
        error: null
      })

      const result = await configManager.updateUserConfiguration(mockUserId, updates)

      expect(result.preferences?.scenarioComplexity).toBe('complex')
      expect(result.preferences?.visualizations).toBe(false)
      expect(result.preferences?.timeConstraints).toBe('moderate') // unchanged
      expect(result.preferences?.notifications).toBe(true) // unchanged
    })

    it('should reject invalid updates', async () => {
      const invalidUpdates: ConfigurationUpdatePayload = {
        domain: 'invalid-domain'
      }

      // Mock getting current configuration
      mockSingle.mockResolvedValue({
        data: {
          preferred_domain: 'cybersecurity',
          default_job_role: 'security-analyst',
          default_risk_profile: 'conservative'
        },
        error: null
      })

      await expect(configManager.updateUserConfiguration(mockUserId, invalidUpdates))
        .rejects.toThrow('Invalid configuration update')
    })
  })

  describe('validateConfiguration', () => {
    it('should validate correct configuration', () => {
      const validConfig: UserConfiguration = {
        domain: 'cybersecurity',
        jobRole: 'security-analyst',
        riskProfile: 'conservative'
      }

      const result = configManager.validateConfiguration(validConfig)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid configuration', () => {
      const invalidConfig: UserConfiguration = {
        domain: 'invalid-domain',
        jobRole: 'security-analyst',
        riskProfile: 'conservative'
      }

      const result = configManager.validateConfiguration(invalidConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject incompatible combinations', () => {
      const incompatibleConfig: UserConfiguration = {
        domain: 'aerospace',
        jobRole: 'safety-engineer',
        riskProfile: 'aggressive' // safety engineer only supports conservative
      }

      const result = configManager.validateConfiguration(incompatibleConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('aggressive'))).toBe(true)
    })
  })

  describe('helper methods', () => {
    it('should return available domains', () => {
      const domains = configManager.getAvailableDomains()
      expect(domains.length).toBeGreaterThan(0)
      expect(domains.every(d => d.isActive)).toBe(true)
    })

    it('should return job roles for domain', () => {
      const jobRoles = configManager.getJobRolesForDomain('cybersecurity')
      expect(jobRoles.length).toBeGreaterThan(0)
      expect(jobRoles.every(jr => jr.domain === 'cybersecurity')).toBe(true)
    })

    it('should return risk profiles for job role', () => {
      const riskProfiles = configManager.getRiskProfilesForJobRole('cybersecurity', 'security-analyst')
      expect(riskProfiles.length).toBeGreaterThan(0)
      expect(riskProfiles.includes('conservative')).toBe(true)
    })

    it('should check configuration availability', () => {
      expect(configManager.isConfigurationAvailable('cybersecurity', 'security-analyst', 'conservative')).toBe(true)
      expect(configManager.isConfigurationAvailable('invalid-domain', 'security-analyst', 'conservative')).toBe(false)
    })

    it('should provide configuration suggestions', () => {
      const suggestions = configManager.getConfigurationSuggestions({
        domain: 'cybersecurity'
      })

      expect(suggestions.domains.length).toBeGreaterThan(0)
      expect(suggestions.jobRoles.length).toBeGreaterThan(0)
      expect(suggestions.riskProfiles).toEqual(['conservative', 'balanced', 'aggressive'])
    })

    it('should provide filtered suggestions based on partial config', () => {
      const suggestions = configManager.getConfigurationSuggestions({
        domain: 'cybersecurity',
        jobRole: 'security-analyst'
      })

      expect(suggestions.domains.length).toBeGreaterThan(0)
      expect(suggestions.jobRoles.length).toBeGreaterThan(0)
      expect(suggestions.riskProfiles.length).toBeGreaterThan(0)
      expect(suggestions.riskProfiles.length).toBeLessThanOrEqual(3)
    })
  })

  describe('resetUserConfiguration', () => {
    it('should reset to default configuration', async () => {
      mockUpsert.mockResolvedValue({
        error: null
      })

      const result = await configManager.resetUserConfiguration(mockUserId)

      expect(result.domain).toBeDefined()
      expect(result.jobRole).toBeDefined()
      expect(result.riskProfile).toBeDefined()
      expect(mockUpsert).toHaveBeenCalled()
    })

    it('should handle reset errors', async () => {
      mockUpsert.mockResolvedValue({
        error: { message: 'Database error' }
      })

      await expect(configManager.resetUserConfiguration(mockUserId))
        .rejects.toThrow()
    })
  })

  describe('getConfigurationHistory', () => {
    it('should return empty array for now', async () => {
      const history = await configManager.getConfigurationHistory(mockUserId)
      expect(history).toEqual([])
    })
  })
})