// Unit tests for configuration defaults
import {
  createDefaultConfiguration,
  getJobRolesForDomain,
  getRiskProfilesForJobRole,
  isConfigurationAvailable,
  AVAILABLE_DOMAINS,
  DEFAULT_USER_PREFERENCES
} from '../defaults'

describe('Configuration Defaults', () => {
  describe('createDefaultConfiguration', () => {
    it('should create default configuration with no parameters', () => {
      const config = createDefaultConfiguration()
      
      expect(config.domain).toBe('cybersecurity')
      expect(config.jobRole).toBeDefined()
      expect(config.riskProfile).toBeDefined()
      expect(config.preferences).toEqual(DEFAULT_USER_PREFERENCES)
    })

    it('should create configuration with specified domain', () => {
      const config = createDefaultConfiguration('healthcare')
      
      expect(config.domain).toBe('healthcare')
      expect(config.jobRole).toBeDefined()
      expect(config.riskProfile).toBeDefined()
    })

    it('should create configuration with specified domain and job role', () => {
      const config = createDefaultConfiguration('healthcare', 'emergency-physician')
      
      expect(config.domain).toBe('healthcare')
      expect(config.jobRole).toBe('emergency-physician')
      expect(config.riskProfile).toBeDefined()
    })

    it('should create configuration with all parameters specified', () => {
      const config = createDefaultConfiguration('finance', 'risk-manager', 'conservative')
      
      expect(config.domain).toBe('finance')
      expect(config.jobRole).toBe('risk-manager')
      expect(config.riskProfile).toBe('conservative')
    })

    it('should throw error for invalid domain', () => {
      expect(() => createDefaultConfiguration('invalid-domain')).toThrow('Invalid domain')
    })

    it('should throw error for invalid job role in domain', () => {
      expect(() => createDefaultConfiguration('cybersecurity', 'invalid-role')).toThrow('Invalid job role')
    })

    it('should set experience level based on domain requirements', () => {
      const cyberConfig = createDefaultConfiguration('cybersecurity')
      expect(cyberConfig.experienceLevel).toBe('intermediate')

      const aerospaceConfig = createDefaultConfiguration('aerospace')
      expect(aerospaceConfig.experienceLevel).toBe('senior')

      const healthcareConfig = createDefaultConfiguration('healthcare')
      expect(healthcareConfig.experienceLevel).toBe('intermediate') // default
    })
  })

  describe('getJobRolesForDomain', () => {
    it('should return job roles for valid domain', () => {
      const jobRoles = getJobRolesForDomain('cybersecurity')
      
      expect(jobRoles.length).toBeGreaterThan(0)
      expect(jobRoles.every(jr => jr.domain === 'cybersecurity')).toBe(true)
      expect(jobRoles.some(jr => jr.id === 'security-analyst')).toBe(true)
    })

    it('should return empty array for invalid domain', () => {
      const jobRoles = getJobRolesForDomain('invalid-domain')
      expect(jobRoles).toEqual([])
    })

    it('should return all expected job roles for each domain', () => {
      const cyberRoles = getJobRolesForDomain('cybersecurity')
      expect(cyberRoles.some(jr => jr.id === 'security-analyst')).toBe(true)
      expect(cyberRoles.some(jr => jr.id === 'incident-responder')).toBe(true)
      expect(cyberRoles.some(jr => jr.id === 'ciso')).toBe(true)

      const healthcareRoles = getJobRolesForDomain('healthcare')
      expect(healthcareRoles.some(jr => jr.id === 'emergency-physician')).toBe(true)
      expect(healthcareRoles.some(jr => jr.id === 'nurse-manager')).toBe(true)
    })
  })

  describe('getRiskProfilesForJobRole', () => {
    it('should return risk profiles for valid job role', () => {
      const profiles = getRiskProfilesForJobRole('cybersecurity', 'security-analyst')
      
      expect(profiles.length).toBeGreaterThan(0)
      expect(profiles.includes('conservative')).toBe(true)
      expect(profiles.includes('balanced')).toBe(true)
    })

    it('should return empty array for invalid domain', () => {
      const profiles = getRiskProfilesForJobRole('invalid-domain', 'security-analyst')
      expect(profiles).toEqual([])
    })

    it('should return empty array for invalid job role', () => {
      const profiles = getRiskProfilesForJobRole('cybersecurity', 'invalid-role')
      expect(profiles).toEqual([])
    })

    it('should return all profiles as fallback for invalid combinations', () => {
      const profiles = getRiskProfilesForJobRole('invalid-domain', 'invalid-role')
      expect(profiles).toEqual([])
    })

    it('should return correct profiles for specific job roles', () => {
      // Safety engineer should only support conservative
      const safetyProfiles = getRiskProfilesForJobRole('aerospace', 'safety-engineer')
      expect(safetyProfiles).toEqual(['conservative'])

      // CISO should support all profiles
      const cisoProfiles = getRiskProfilesForJobRole('cybersecurity', 'ciso')
      expect(cisoProfiles).toEqual(['conservative', 'balanced', 'aggressive'])
    })
  })

  describe('isConfigurationAvailable', () => {
    it('should return true for valid combinations', () => {
      expect(isConfigurationAvailable('cybersecurity', 'security-analyst', 'balanced')).toBe(true)
      expect(isConfigurationAvailable('healthcare', 'emergency-physician', 'aggressive')).toBe(true)
      expect(isConfigurationAvailable('aerospace', 'safety-engineer', 'conservative')).toBe(true)
    })

    it('should return false for invalid domain', () => {
      expect(isConfigurationAvailable('invalid-domain', 'security-analyst', 'balanced')).toBe(false)
    })

    it('should return false for invalid job role', () => {
      expect(isConfigurationAvailable('cybersecurity', 'invalid-role', 'balanced')).toBe(false)
    })

    it('should return false for incompatible risk profile', () => {
      expect(isConfigurationAvailable('aerospace', 'safety-engineer', 'aggressive')).toBe(false)
      expect(isConfigurationAvailable('cybersecurity', 'security-analyst', 'aggressive')).toBe(false)
    })

    it('should return false for inactive domain', () => {
      // This test assumes we might have inactive domains in the future
      // For now, all domains are active, so we'll test the logic
      const originalDomains = [...AVAILABLE_DOMAINS]
      
      // Temporarily modify a domain to be inactive
      const cyberDomain = AVAILABLE_DOMAINS.find(d => d.id === 'cybersecurity')
      if (cyberDomain) {
        cyberDomain.isActive = false
        expect(isConfigurationAvailable('cybersecurity', 'security-analyst', 'balanced')).toBe(false)
        cyberDomain.isActive = true // restore
      }
    })
  })

  describe('AVAILABLE_DOMAINS structure', () => {
    it('should have all required domains', () => {
      const domainIds = AVAILABLE_DOMAINS.map(d => d.id)
      expect(domainIds).toContain('cybersecurity')
      expect(domainIds).toContain('healthcare')
      expect(domainIds).toContain('aerospace')
      expect(domainIds).toContain('finance')
    })

    it('should have valid structure for each domain', () => {
      AVAILABLE_DOMAINS.forEach(domain => {
        expect(domain.id).toBeDefined()
        expect(domain.name).toBeDefined()
        expect(domain.description).toBeDefined()
        expect(Array.isArray(domain.jobRoles)).toBe(true)
        expect(domain.jobRoles.length).toBeGreaterThan(0)
        expect(typeof domain.isActive).toBe('boolean')
      })
    })

    it('should have valid job roles for each domain', () => {
      AVAILABLE_DOMAINS.forEach(domain => {
        domain.jobRoles.forEach(jobRole => {
          expect(jobRole.id).toBeDefined()
          expect(jobRole.name).toBeDefined()
          expect(jobRole.description).toBeDefined()
          expect(jobRole.domain).toBe(domain.id)
          expect(Array.isArray(jobRole.responsibilities)).toBe(true)
          expect(Array.isArray(jobRole.riskProfiles)).toBe(true)
          expect(jobRole.riskProfiles.length).toBeGreaterThan(0)
          
          // Validate risk profiles are valid
          jobRole.riskProfiles.forEach(profile => {
            expect(['conservative', 'balanced', 'aggressive']).toContain(profile)
          })
        })
      })
    })

    it('should have consistent domain references in job roles', () => {
      AVAILABLE_DOMAINS.forEach(domain => {
        domain.jobRoles.forEach(jobRole => {
          expect(jobRole.domain).toBe(domain.id)
        })
      })
    })
  })

  describe('DEFAULT_USER_PREFERENCES', () => {
    it('should have all required preference fields', () => {
      expect(DEFAULT_USER_PREFERENCES.scenarioComplexity).toBeDefined()
      expect(DEFAULT_USER_PREFERENCES.timeConstraints).toBeDefined()
      expect(DEFAULT_USER_PREFERENCES.feedbackDetail).toBeDefined()
      expect(typeof DEFAULT_USER_PREFERENCES.visualizations).toBe('boolean')
      expect(typeof DEFAULT_USER_PREFERENCES.notifications).toBe('boolean')
      expect(typeof DEFAULT_USER_PREFERENCES.autoSave).toBe('boolean')
    })

    it('should have valid default values', () => {
      expect(['simple', 'moderate', 'complex']).toContain(DEFAULT_USER_PREFERENCES.scenarioComplexity)
      expect(['relaxed', 'moderate', 'strict']).toContain(DEFAULT_USER_PREFERENCES.timeConstraints)
      expect(['brief', 'detailed', 'comprehensive']).toContain(DEFAULT_USER_PREFERENCES.feedbackDetail)
    })
  })
})