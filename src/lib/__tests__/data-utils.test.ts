// Unit tests for data transformation and validation utilities
import {
  validateData,
  validateScenarioConfig,
  validateScenarioState,
  validateDecision,
  validateTrainingSession,
  validateSessionDecision,
  validateScoreResult,
  validateGenerationContext,
  validateUserProfile,
  validateLearningResource,
  sanitizeScenarioConfig,
  sanitizeUserInput,
  normalizeDecisionText,
  calculateScenarioComplexity,
  extractScenarioKeywords,
  formatTimeSpent,
  calculateAverageDecisionTime,
  groupDecisionsByRiskLevel,
  filterResourcesByRelevance,
  isValidUUID,
  isValidEmail,
  isValidDateTime,
  convertToTrainingSessionData,
  convertToScenarioConfig
} from '../data-utils'
import { ScenarioConfigSchema } from '../validation'
import type { ScenarioConfig, Decision, SessionDecision, LearningResource } from '../types'

describe('Validation Functions', () => {
  describe('validateData', () => {
    it('should return success for valid data', () => {
      const validScenarioConfig = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Scenario',
        domain: 'cybersecurity',
        difficulty_level: 3,
        initialState: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          description: 'Test state description that is long enough',
          context: 'Test context that provides sufficient detail for the scenario',
          decisions: [{
            id: '123e4567-e89b-12d3-a456-426614174002',
            text: 'Test decision with sufficient detail',
            consequences: [{
              id: '123e4567-e89b-12d3-a456-426614174003',
              type: 'direct',
              description: 'Test consequence with proper description',
              impact_score: 10,
              probability: 0.8
            }],
            nextStateId: '123e4567-e89b-12d3-a456-426614174004',
            riskLevel: 'medium'
          }],
          environmentalFactors: ['stress'],
          characters: [],
          riskLevel: 'medium',
          criticalityScore: 5
        },
        states: {
          '123e4567-e89b-12d3-a456-426614174004': {
            id: '123e4567-e89b-12d3-a456-426614174004',
            description: 'End state description',
            context: 'End state context',
            decisions: [{
              id: '123e4567-e89b-12d3-a456-426614174005',
              text: 'Final decision',
              consequences: [{
                id: '123e4567-e89b-12d3-a456-426614174006',
                type: 'direct',
                description: 'Final consequence',
                impact_score: 5,
                probability: 1.0
              }],
              nextStateId: '123e4567-e89b-12d3-a456-426614174001',
              riskLevel: 'low'
            }],
            environmentalFactors: [],
            characters: [],
            riskLevel: 'low',
            criticalityScore: 3
          }
        },
        branches: [{
          fromStateId: '123e4567-e89b-12d3-a456-426614174001',
          decisionId: '123e4567-e89b-12d3-a456-426614174002',
          toStateId: '123e4567-e89b-12d3-a456-426614174004',
          transitionEffects: ['state transition']
        }],
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        tags: ['test']
      }

      const result = validateData(ScenarioConfigSchema, validScenarioConfig)

      if (!result.success) {
        console.log('Validation errors:', result.errors)
      }

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.errors).toBeUndefined()
    })

    it('should return errors for invalid data', () => {
      const result = validateData(ScenarioConfigSchema, {
        id: 'invalid-uuid',
        title: '',
        domain: 'cybersecurity'
      })

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })
  })

  describe('validateScenarioConfig', () => {
    it('should validate a complete scenario config', () => {
      const validConfig = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Cybersecurity Incident Response',
        domain: 'cybersecurity',
        difficulty_level: 3,
        initialState: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          description: 'Security breach detected in the network infrastructure',
          context: 'Multiple systems compromised and showing signs of unauthorized access',
          decisions: [{
            id: '123e4567-e89b-12d3-a456-426614174002',
            text: 'Isolate affected systems immediately',
            consequences: [{
              id: '123e4567-e89b-12d3-a456-426614174003',
              type: 'direct',
              description: 'Systems isolated successfully preventing further damage',
              impact_score: 15,
              probability: 0.9
            }],
            nextStateId: '123e4567-e89b-12d3-a456-426614174004',
            riskLevel: 'high'
          }],
          environmentalFactors: ['time pressure'],
          characters: [],
          riskLevel: 'high',
          criticalityScore: 8
        },
        states: {
          '123e4567-e89b-12d3-a456-426614174004': {
            id: '123e4567-e89b-12d3-a456-426614174004',
            description: 'Systems isolated, assessing damage',
            context: 'Initial containment successful, now evaluating impact',
            decisions: [{
              id: '123e4567-e89b-12d3-a456-426614174005',
              text: 'Begin forensic analysis',
              consequences: [{
                id: '123e4567-e89b-12d3-a456-426614174006',
                type: 'direct',
                description: 'Forensic analysis initiated',
                impact_score: 10,
                probability: 0.95
              }],
              nextStateId: '123e4567-e89b-12d3-a456-426614174001',
              riskLevel: 'medium'
            }],
            environmentalFactors: [],
            characters: [],
            riskLevel: 'medium',
            criticalityScore: 6
          }
        },
        branches: [{
          fromStateId: '123e4567-e89b-12d3-a456-426614174001',
          decisionId: '123e4567-e89b-12d3-a456-426614174002',
          toStateId: '123e4567-e89b-12d3-a456-426614174004',
          transitionEffects: ['containment achieved']
        }],
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        tags: ['cybersecurity', 'incident-response']
      }

      const result = validateScenarioConfig(validConfig)
      
      if (!result.success) {
        console.log('Validation errors:', result.errors)
      }
      
      expect(result.success).toBe(true)
    })
  })
})

describe('Data Transformation Utilities', () => {
  describe('sanitizeScenarioConfig', () => {
    it('should trim and normalize string fields', () => {
      const input = {
        title: '  Test Scenario  ',
        domain: '  CYBERSECURITY  ',
        tags: ['  Tag1  ', '', '  TAG2  '],
        difficulty_level: 10
      }

      const result = sanitizeScenarioConfig(input)

      expect(result.title).toBe('Test Scenario')
      expect(result.domain).toBe('cybersecurity')
      expect(result.tags).toEqual(['tag1', 'tag2'])
      expect(result.difficulty_level).toBe(5) // Clamped to max
    })

    it('should clamp difficulty level to valid range', () => {
      expect(sanitizeScenarioConfig({ difficulty_level: 0 }).difficulty_level).toBe(1)
      expect(sanitizeScenarioConfig({ difficulty_level: 10 }).difficulty_level).toBe(5)
      expect(sanitizeScenarioConfig({ difficulty_level: 3 }).difficulty_level).toBe(3)
    })
  })

  describe('sanitizeUserInput', () => {
    it('should remove dangerous characters and trim', () => {
      const input = '  <script>alert("xss")</script>  '
      const result = sanitizeUserInput(input)
      expect(result).toBe('scriptalert("xss")/script')
    })

    it('should limit length to 1000 characters', () => {
      const longInput = 'a'.repeat(1500)
      const result = sanitizeUserInput(longInput)
      expect(result.length).toBe(1000)
    })
  })

  describe('normalizeDecisionText', () => {
    it('should normalize whitespace and remove special characters', () => {
      const input = '  This   is  a   decision!  @#$%  '
      const result = normalizeDecisionText(input)
      expect(result).toBe('This is a decision!')
    })

    it('should limit length to 300 characters', () => {
      const longInput = 'a'.repeat(500)
      const result = normalizeDecisionText(longInput)
      expect(result.length).toBe(300)
    })
  })

  describe('calculateScenarioComplexity', () => {
    it('should calculate complexity based on states, branches, and decisions', () => {
      const scenario: ScenarioConfig = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test',
        domain: 'test',
        difficulty_level: 1,
        initialState: {
          id: 'state1',
          description: 'Test',
          context: 'Test',
          decisions: [
            { id: 'dec1', text: 'Decision 1', consequences: [], nextStateId: 'state2', riskLevel: 'low' },
            { id: 'dec2', text: 'Decision 2', consequences: [], nextStateId: 'state3', riskLevel: 'low' }
          ],
          environmentalFactors: [],
          characters: [],
          riskLevel: 'low',
          criticalityScore: 1
        },
        states: {
          state2: {
            id: 'state2',
            description: 'Test',
            context: 'Test',
            decisions: [
              { id: 'dec3', text: 'Decision 3', consequences: [], nextStateId: 'state1', riskLevel: 'low' }
            ],
            environmentalFactors: [],
            characters: [],
            riskLevel: 'low',
            criticalityScore: 1
          }
        },
        branches: [
          { fromStateId: 'state1', decisionId: 'dec1', toStateId: 'state2', transitionEffects: [] },
          { fromStateId: 'state1', decisionId: 'dec2', toStateId: 'state3', transitionEffects: [] }
        ],
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        tags: []
      }

      const complexity = calculateScenarioComplexity(scenario)
      expect(complexity).toBeGreaterThan(0)
      expect(typeof complexity).toBe('number')
    })
  })

  describe('extractScenarioKeywords', () => {
    it('should extract keywords from domain, tags, and content', () => {
      const scenario: ScenarioConfig = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Cybersecurity Incident',
        domain: 'cybersecurity',
        difficulty_level: 1,
        tags: ['incident', 'response'],
        initialState: {
          id: 'state1',
          description: 'A security breach has occurred in the network infrastructure',
          context: 'Multiple servers are showing signs of unauthorized access',
          decisions: [],
          environmentalFactors: [],
          characters: [],
          riskLevel: 'high',
          criticalityScore: 8
        },
        states: {},
        branches: [],
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        version: '1.0.0'
      }

      const keywords = extractScenarioKeywords(scenario)
      expect(keywords).toContain('cybersecurity')
      expect(keywords).toContain('incident')
      expect(keywords).toContain('response')
      expect(keywords.length).toBeLessThanOrEqual(20)
    })
  })
})

describe('Time and Calculation Utilities', () => {
  describe('formatTimeSpent', () => {
    it('should format seconds correctly', () => {
      expect(formatTimeSpent(30)).toBe('30s')
      expect(formatTimeSpent(90)).toBe('1m 30s')
      expect(formatTimeSpent(120)).toBe('2m')
      expect(formatTimeSpent(3661)).toBe('1h 1m')
      expect(formatTimeSpent(3600)).toBe('1h')
    })
  })

  describe('calculateAverageDecisionTime', () => {
    it('should calculate average decision time', () => {
      const decisions: SessionDecision[] = [
        {
          id: '1',
          session_id: 'session1',
          state_id: 'state1',
          decision_text: 'Decision 1',
          timestamp: '2024-01-01T00:00:00.000Z',
          time_taken_ms: 5000,
          score_impact: 10,
          consequences: []
        },
        {
          id: '2',
          session_id: 'session1',
          state_id: 'state2',
          decision_text: 'Decision 2',
          timestamp: '2024-01-01T00:01:00.000Z',
          time_taken_ms: 3000,
          score_impact: 15,
          consequences: []
        }
      ]

      const average = calculateAverageDecisionTime(decisions)
      expect(average).toBe(4000)
    })

    it('should return 0 for empty array', () => {
      expect(calculateAverageDecisionTime([])).toBe(0)
    })
  })

  describe('groupDecisionsByRiskLevel', () => {
    it('should group decisions by risk level', () => {
      const decisions: Decision[] = [
        {
          id: '1',
          text: 'Low risk decision',
          consequences: [],
          nextStateId: 'state1',
          riskLevel: 'low'
        },
        {
          id: '2',
          text: 'High risk decision',
          consequences: [],
          nextStateId: 'state2',
          riskLevel: 'high'
        },
        {
          id: '3',
          text: 'Another low risk decision',
          consequences: [],
          nextStateId: 'state3',
          riskLevel: 'low'
        }
      ]

      const grouped = groupDecisionsByRiskLevel(decisions)
      expect(grouped.low).toHaveLength(2)
      expect(grouped.high).toHaveLength(1)
      expect(grouped.medium).toBeUndefined()
    })
  })
})

describe('Resource Filtering', () => {
  describe('filterResourcesByRelevance', () => {
    const resources: LearningResource[] = [
      {
        id: '1',
        title: 'Cybersecurity Fundamentals',
        type: 'textbook',
        tags: ['cybersecurity', 'fundamentals'],
        relevance_keywords: ['security', 'network', 'incident'],
        created_at: '2024-01-01T00:00:00.000Z',
        domain: 'cybersecurity'
      },
      {
        id: '2',
        title: 'Healthcare Management',
        type: 'paper',
        tags: ['healthcare', 'management'],
        relevance_keywords: ['patient', 'care', 'hospital'],
        created_at: '2024-01-01T00:00:00.000Z',
        domain: 'healthcare'
      },
      {
        id: '3',
        title: 'Network Security Protocols',
        type: 'video',
        tags: ['network', 'security', 'protocols'],
        relevance_keywords: ['cybersecurity', 'network', 'security'],
        created_at: '2024-01-01T00:00:00.000Z',
        domain: 'cybersecurity'
      }
    ]

    it('should filter and sort resources by relevance', () => {
      const keywords = ['cybersecurity', 'network', 'security']
      const filtered = filterResourcesByRelevance(resources, keywords, 0.3)

      expect(filtered.length).toBe(2)
      expect(filtered[0].domain).toBe('cybersecurity')
      expect(filtered.every(r => r.domain === 'cybersecurity')).toBe(true)
    })

    it('should return empty array when no resources meet minimum relevance', () => {
      const keywords = ['unrelated', 'keywords']
      const filtered = filterResourcesByRelevance(resources, keywords, 0.5)

      expect(filtered).toHaveLength(0)
    })
  })
})

describe('Type Guards', () => {
  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false)
      expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false)
      expect(isValidUUID('')).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })
  })

  describe('isValidDateTime', () => {
    it('should validate correct ISO datetime strings', () => {
      expect(isValidDateTime('2024-01-01T00:00:00.000Z')).toBe(true)
      expect(isValidDateTime('2024-12-31T23:59:59.999Z')).toBe(true)
    })

    it('should reject invalid datetime strings', () => {
      expect(isValidDateTime('invalid-date')).toBe(false)
      expect(isValidDateTime('2024-01-01')).toBe(false)
      expect(isValidDateTime('2024-13-01T00:00:00.000Z')).toBe(false)
    })
  })
})

describe('Data Conversion Utilities', () => {
  describe('convertToTrainingSessionData', () => {
    it('should convert raw data to training session format', () => {
      const rawData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        scenario_id: '123e4567-e89b-12d3-a456-426614174002',
        started_at: '2024-01-01T00:00:00.000Z',
        is_paused: false
      }

      const result = convertToTrainingSessionData(rawData)

      expect(result.id).toBe(rawData.id)
      expect(result.user_id).toBe(rawData.user_id)
      expect(result.scenario_id).toBe(rawData.scenario_id)
      expect(result.started_at).toBe(rawData.started_at)
      expect(result.is_paused).toBe(false)
      expect(result.session_data).toBeDefined()
      expect(result.session_data!.decisions_made).toEqual([])
    })

    it('should provide default values for missing fields', () => {
      const rawData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        scenario_id: '123e4567-e89b-12d3-a456-426614174002',
        started_at: '2024-01-01T00:00:00.000Z'
      }

      const result = convertToTrainingSessionData(rawData)

      expect(result.is_paused).toBe(false)
      expect(result.session_data).toBeDefined()
      expect(result.session_data!.time_spent_seconds).toBe(0)
      expect(result.session_data!.pause_count).toBe(0)
    })
  })

  describe('convertToScenarioConfig', () => {
    it('should convert raw data to scenario config format', () => {
      const rawData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Scenario',
        domain: 'cybersecurity',
        difficulty_level: 3,
        created_at: '2024-01-01T00:00:00.000Z',
        config: {
          version: '2.0.0',
          tags: ['test', 'cybersecurity']
        }
      }

      const result = convertToScenarioConfig(rawData)

      expect(result.id).toBe(rawData.id)
      expect(result.title).toBe(rawData.title)
      expect(result.domain).toBe(rawData.domain)
      expect(result.difficulty_level).toBe(rawData.difficulty_level)
      expect(result.version).toBe('2.0.0')
      expect(result.tags).toEqual(['test', 'cybersecurity'])
      expect(result.is_active).toBe(true)
    })

    it('should provide default values for missing config', () => {
      const rawData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Scenario',
        domain: 'cybersecurity',
        created_at: '2024-01-01T00:00:00.000Z'
      }

      const result = convertToScenarioConfig(rawData)

      expect(result.difficulty_level).toBe(1)
      expect(result.version).toBe('1.0.0')
      expect(result.tags).toEqual([])
      expect(result.states).toEqual({})
      expect(result.branches).toEqual([])
    })
  })
})