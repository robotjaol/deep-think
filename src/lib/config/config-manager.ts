// Configuration manager for user context and preferences
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/supabase'
import type { 
  UserConfiguration, 
  UserPreferences,
  ConfigurationStorage, 
  ConfigurationUpdatePayload,
  ConfigurationValidationResult
} from './types'
import { 
  createDefaultConfiguration, 
  AVAILABLE_DOMAINS,
  isConfigurationAvailable 
} from './defaults'
import { 
  validateUserConfiguration, 
  validateConfigurationCombination,
  UserConfigurationSchema 
} from './validation'

export class ConfigurationManager {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get user configuration, creating default if none exists
   */
  async getUserConfiguration(userId: string): Promise<UserConfiguration> {
    try {
      // First try to get from user_profiles table
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .select('preferred_domain, default_job_role, default_risk_profile')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (profile && profile.preferred_domain && profile.default_job_role && profile.default_risk_profile) {
        // Try to get preferences from user profile
        const { data: userProfile } = await this.supabase
          .from('users')
          .select('profile')
          .eq('id', userId)
          .single()

        const profileData = userProfile?.profile as any
        const preferences = profileData?.preferences
        const experienceLevel = profileData?.experienceLevel

        // Return existing configuration
        return {
          domain: profile.preferred_domain,
          jobRole: profile.default_job_role,
          riskProfile: profile.default_risk_profile,
          experienceLevel,
          preferences
        }
      }

      // Create and return default configuration
      const defaultConfig = createDefaultConfiguration()
      await this.saveUserConfiguration(userId, defaultConfig, true)
      return defaultConfig

    } catch (error) {
      console.error('Error getting user configuration:', error)
      // Return default configuration as fallback
      return createDefaultConfiguration()
    }
  }

  /**
   * Save user configuration to database
   */
  async saveUserConfiguration(
    userId: string, 
    configuration: UserConfiguration,
    isDefault: boolean = false
  ): Promise<void> {
    try {
      // Validate configuration first
      const validation = this.validateConfiguration(configuration)
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
      }

      // Update user_profiles table
      const { error } = await this.supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          preferred_domain: configuration.domain,
          default_job_role: configuration.jobRole,
          default_risk_profile: configuration.riskProfile,
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw new Error(error.message || 'Database error')
      }

      // Store preferences in user profile if provided
      if (configuration.preferences) {
        const { error: profileError } = await this.supabase
          .from('users')
          .update({
            profile: {
              preferences: configuration.preferences as any,
              experienceLevel: configuration.experienceLevel
            } as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (profileError) {
          console.warn('Failed to save user preferences:', profileError)
          // Don't throw here, just warn as preferences are optional
        }
      }

    } catch (error) {
      console.error('Error saving user configuration:', error)
      throw error
    }
  }

  /**
   * Update user configuration with partial data
   */
  async updateUserConfiguration(
    userId: string, 
    updates: ConfigurationUpdatePayload
  ): Promise<UserConfiguration> {
    try {
      // Get current configuration
      const currentConfig = await this.getUserConfiguration(userId)

      // Merge updates
      const updatedConfig: UserConfiguration = {
        ...currentConfig,
        ...updates,
        preferences: updates.preferences 
          ? { ...(currentConfig.preferences || {}), ...updates.preferences } as UserPreferences
          : currentConfig.preferences
      }

      // Validate the updated configuration
      const validation = this.validateConfiguration(updatedConfig)
      if (!validation.isValid) {
        throw new Error(`Invalid configuration update: ${validation.errors.join(', ')}`)
      }

      // Save updated configuration
      await this.saveUserConfiguration(userId, updatedConfig)
      return updatedConfig

    } catch (error) {
      console.error('Error updating user configuration:', error)
      throw error
    }
  }

  /**
   * Validate a configuration
   */
  validateConfiguration(configuration: UserConfiguration): ConfigurationValidationResult {
    // Basic schema validation
    const schemaValidation = validateUserConfiguration(configuration)
    if (!schemaValidation.isValid) {
      return schemaValidation
    }

    // Validate combination compatibility
    return validateConfigurationCombination(
      configuration.domain,
      configuration.jobRole,
      configuration.riskProfile,
      AVAILABLE_DOMAINS
    )
  }

  /**
   * Get available domains
   */
  getAvailableDomains() {
    return AVAILABLE_DOMAINS.filter(domain => domain.isActive)
  }

  /**
   * Get job roles for a specific domain
   */
  getJobRolesForDomain(domainId: string) {
    const domain = AVAILABLE_DOMAINS.find(d => d.id === domainId && d.isActive)
    return domain?.jobRoles || []
  }

  /**
   * Get compatible risk profiles for a job role
   */
  getRiskProfilesForJobRole(domainId: string, jobRoleId: string) {
    const domain = AVAILABLE_DOMAINS.find(d => d.id === domainId)
    const jobRole = domain?.jobRoles.find(jr => jr.id === jobRoleId)
    return jobRole?.riskProfiles || []
  }

  /**
   * Check if a configuration is available
   */
  isConfigurationAvailable(domainId: string, jobRoleId: string, riskProfile: string) {
    return isConfigurationAvailable(domainId, jobRoleId, riskProfile as any)
  }

  /**
   * Get configuration suggestions based on partial input
   */
  getConfigurationSuggestions(partialConfig: Partial<UserConfiguration>) {
    const suggestions = {
      domains: this.getAvailableDomains(),
      jobRoles: partialConfig.domain ? this.getJobRolesForDomain(partialConfig.domain) : [],
      riskProfiles: (partialConfig.domain && partialConfig.jobRole) 
        ? this.getRiskProfilesForJobRole(partialConfig.domain, partialConfig.jobRole)
        : ['conservative', 'balanced', 'aggressive']
    }

    return suggestions
  }

  /**
   * Reset user configuration to defaults
   */
  async resetUserConfiguration(userId: string): Promise<UserConfiguration> {
    try {
      const defaultConfig = createDefaultConfiguration()
      await this.saveUserConfiguration(userId, defaultConfig, true)
      return defaultConfig
    } catch (error) {
      console.error('Error resetting user configuration:', error)
      throw error
    }
  }

  /**
   * Get user's configuration history (if we want to track changes)
   */
  async getConfigurationHistory(userId: string): Promise<ConfigurationStorage[]> {
    // This would require a separate table to track configuration history
    // For now, return empty array as this is not implemented in the current schema
    return []
  }
}