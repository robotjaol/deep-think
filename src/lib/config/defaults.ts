// Default configurations and domain/job role definitions
import type { DomainConfig, UserConfiguration, UserPreferences } from './types'
import type { RiskProfile } from '../types'

// Default user preferences
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  scenarioComplexity: 'moderate',
  timeConstraints: 'moderate',
  feedbackDetail: 'detailed',
  visualizations: true,
  notifications: true,
  autoSave: true
}

// Available domains and job roles
export const AVAILABLE_DOMAINS: DomainConfig[] = [
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Information security, threat response, and risk management',
    isActive: true,
    requiredExperience: 'intermediate',
    jobRoles: [
      {
        id: 'security-analyst',
        name: 'Security Analyst',
        description: 'Monitor and analyze security threats and incidents',
        domain: 'cybersecurity',
        responsibilities: [
          'Monitor security alerts and logs',
          'Investigate security incidents',
          'Implement security controls',
          'Report on security metrics'
        ],
        riskProfiles: ['conservative', 'balanced'],
        requiredSkills: ['SIEM', 'Incident Response', 'Risk Assessment']
      },
      {
        id: 'incident-responder',
        name: 'Incident Responder',
        description: 'Lead response to cybersecurity incidents and breaches',
        domain: 'cybersecurity',
        responsibilities: [
          'Coordinate incident response',
          'Contain security breaches',
          'Conduct forensic analysis',
          'Communicate with stakeholders'
        ],
        riskProfiles: ['balanced', 'aggressive'],
        requiredSkills: ['Digital Forensics', 'Crisis Management', 'Communication']
      },
      {
        id: 'ciso',
        name: 'Chief Information Security Officer',
        description: 'Strategic security leadership and decision-making',
        domain: 'cybersecurity',
        responsibilities: [
          'Set security strategy',
          'Manage security budget',
          'Board reporting',
          'Regulatory compliance'
        ],
        riskProfiles: ['conservative', 'balanced', 'aggressive'],
        requiredSkills: ['Strategic Planning', 'Risk Management', 'Leadership']
      }
    ]
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical emergency response and patient care decisions',
    isActive: true,
    jobRoles: [
      {
        id: 'emergency-physician',
        name: 'Emergency Physician',
        description: 'Provide immediate medical care in emergency situations',
        domain: 'healthcare',
        responsibilities: [
          'Diagnose emergency conditions',
          'Prioritize patient care',
          'Make rapid treatment decisions',
          'Coordinate with medical team'
        ],
        riskProfiles: ['balanced', 'aggressive'],
        requiredSkills: ['Emergency Medicine', 'Triage', 'Critical Thinking']
      },
      {
        id: 'nurse-manager',
        name: 'Nurse Manager',
        description: 'Oversee nursing staff and patient care coordination',
        domain: 'healthcare',
        responsibilities: [
          'Manage nursing staff',
          'Ensure patient safety',
          'Resource allocation',
          'Quality improvement'
        ],
        riskProfiles: ['conservative', 'balanced'],
        requiredSkills: ['Leadership', 'Patient Care', 'Resource Management']
      },
      {
        id: 'hospital-administrator',
        name: 'Hospital Administrator',
        description: 'Strategic healthcare operations and crisis management',
        domain: 'healthcare',
        responsibilities: [
          'Operational oversight',
          'Crisis management',
          'Resource planning',
          'Regulatory compliance'
        ],
        riskProfiles: ['conservative', 'balanced', 'aggressive'],
        requiredSkills: ['Healthcare Administration', 'Strategic Planning', 'Crisis Management']
      }
    ]
  },
  {
    id: 'aerospace',
    name: 'Aerospace',
    description: 'Aviation safety, space operations, and mission-critical decisions',
    isActive: true,
    requiredExperience: 'senior',
    jobRoles: [
      {
        id: 'flight-controller',
        name: 'Flight Controller',
        description: 'Monitor and control spacecraft or aircraft operations',
        domain: 'aerospace',
        responsibilities: [
          'Monitor flight systems',
          'Make go/no-go decisions',
          'Coordinate with mission team',
          'Handle anomalies'
        ],
        riskProfiles: ['conservative', 'balanced'],
        requiredSkills: ['Systems Engineering', 'Mission Operations', 'Problem Solving']
      },
      {
        id: 'mission-director',
        name: 'Mission Director',
        description: 'Overall mission leadership and critical decision authority',
        domain: 'aerospace',
        responsibilities: [
          'Mission oversight',
          'Strategic decisions',
          'Risk assessment',
          'Stakeholder communication'
        ],
        riskProfiles: ['conservative', 'balanced', 'aggressive'],
        requiredSkills: ['Leadership', 'Risk Management', 'Strategic Thinking']
      },
      {
        id: 'safety-engineer',
        name: 'Safety Engineer',
        description: 'Ensure safety protocols and risk mitigation',
        domain: 'aerospace',
        responsibilities: [
          'Safety analysis',
          'Risk mitigation',
          'Protocol development',
          'Incident investigation'
        ],
        riskProfiles: ['conservative'],
        requiredSkills: ['Safety Engineering', 'Risk Analysis', 'Regulatory Knowledge']
      }
    ]
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial crisis management and investment decisions',
    isActive: true,
    jobRoles: [
      {
        id: 'risk-manager',
        name: 'Risk Manager',
        description: 'Identify and mitigate financial risks',
        domain: 'finance',
        responsibilities: [
          'Risk assessment',
          'Portfolio monitoring',
          'Compliance oversight',
          'Risk reporting'
        ],
        riskProfiles: ['conservative', 'balanced'],
        requiredSkills: ['Risk Management', 'Financial Analysis', 'Regulatory Knowledge']
      },
      {
        id: 'trading-desk-manager',
        name: 'Trading Desk Manager',
        description: 'Oversee trading operations and market decisions',
        domain: 'finance',
        responsibilities: [
          'Trading oversight',
          'Market analysis',
          'Team management',
          'P&L responsibility'
        ],
        riskProfiles: ['balanced', 'aggressive'],
        requiredSkills: ['Trading', 'Market Analysis', 'Leadership']
      },
      {
        id: 'cfo',
        name: 'Chief Financial Officer',
        description: 'Strategic financial leadership and crisis management',
        domain: 'finance',
        responsibilities: [
          'Financial strategy',
          'Crisis management',
          'Investor relations',
          'Regulatory compliance'
        ],
        riskProfiles: ['conservative', 'balanced', 'aggressive'],
        requiredSkills: ['Strategic Planning', 'Financial Management', 'Leadership']
      }
    ]
  }
]

// Default configuration factory
export function createDefaultConfiguration(
  domain?: string,
  jobRole?: string,
  riskProfile?: RiskProfile
): UserConfiguration {
  // Use provided values or defaults
  const defaultDomain = domain || 'cybersecurity'
  const domainConfig = AVAILABLE_DOMAINS.find(d => d.id === defaultDomain)
  
  if (!domainConfig) {
    throw new Error(`Invalid domain: ${defaultDomain}`)
  }

  const defaultJobRole = jobRole || domainConfig.jobRoles[0]?.id
  const jobRoleConfig = domainConfig.jobRoles.find(jr => jr.id === defaultJobRole)
  
  if (!jobRoleConfig) {
    throw new Error(`Invalid job role: ${defaultJobRole} for domain: ${defaultDomain}`)
  }

  const defaultRiskProfile = riskProfile || jobRoleConfig.riskProfiles[0] || 'balanced'

  return {
    domain: defaultDomain,
    jobRole: defaultJobRole,
    riskProfile: defaultRiskProfile,
    experienceLevel: domainConfig.requiredExperience || 'intermediate',
    preferences: { ...DEFAULT_USER_PREFERENCES }
  }
}

// Get available job roles for a domain
export function getJobRolesForDomain(domainId: string) {
  const domain = AVAILABLE_DOMAINS.find(d => d.id === domainId)
  return domain?.jobRoles || []
}

// Get compatible risk profiles for a job role
export function getRiskProfilesForJobRole(domainId: string, jobRoleId: string): RiskProfile[] {
  const domain = AVAILABLE_DOMAINS.find(d => d.id === domainId)
  const jobRole = domain?.jobRoles.find(jr => jr.id === jobRoleId)
  return jobRole?.riskProfiles || []
}

// Check if a configuration combination is available
export function isConfigurationAvailable(
  domainId: string, 
  jobRoleId: string, 
  riskProfile: RiskProfile
): boolean {
  const domain = AVAILABLE_DOMAINS.find(d => d.id === domainId && d.isActive)
  if (!domain) return false

  const jobRole = domain.jobRoles.find(jr => jr.id === jobRoleId)
  if (!jobRole) return false

  return jobRole.riskProfiles.includes(riskProfile)
}