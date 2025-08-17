// Unit tests for data model validation
import {
  RiskProfileSchema,
  ResourceTypeSchema,
  RiskLevelSchema,
  UserSchema,
  UserProfileSchema,
  ConsequenceSchema,
  DecisionSchema,
  CharacterSchema,
  ScenarioStateSchema,
  DecisionBranchSchema,
  ScenarioConfigSchema,
  GenerationContextSchema,
  GeneratedContentSchema,
  ScoreBreakdownSchema,
  ScoreResultSchema,
  LearningResourceSchema,
  SessionDecisionSchema,
  SessionDataSchema,
  TrainingSessionSchema,
  CreateScenarioInputSchema,
  UpdateUserProfileInputSchema,
  StartTrainingSessionInputSchema,
  MakeDecisionInputSchema
} from '../validation'

describe('Basic Schema Validation', () => {
  describe('RiskProfileSchema', () => {
    it('should validate valid risk profiles', () => {
      expect(RiskProfileSchema.parse('conservative')).toBe('conservative')
      expect(RiskProfileSchema.parse('balanced')).toBe('balanced')
      expect(RiskProfileSchema.parse('aggressive')).toBe('aggressive')
    })

    it('should reject invalid risk profiles', () => {
      expect(() => RiskProfileSchema.parse('invalid')).toThrow()
      expect(() => RiskProfileSchema.parse('')).toThrow()
      expect(() => RiskProfileSchema.parse(null)).toThrow()
    })
  })

  describe('ResourceTypeSchema', () => {
    it('should validate valid resource types', () => {
      expect(ResourceTypeSchema.parse('paper')).toBe('paper')
      expect(ResourceTypeSchema.parse('textbook')).toBe('textbook')
      expect(ResourceTypeSchema.parse('video')).toBe('video')
      expect(ResourceTypeSchema.parse('case-study')).toBe('case-study')
    })

    it('should reject invalid resource types', () => {
      expect(() => ResourceTypeSchema.parse('blog')).toThrow()
      expect(() => ResourceTypeSchema.parse('')).toThrow()
    })
  })

  describe('RiskLevelSchema', () => {
    it('should validate valid risk levels', () => {
      expect(RiskLevelSchema.parse('low')).toBe('low')
      expect(RiskLevelSchema.parse('medium')).toBe('medium')
      expect(RiskLevelSchema.parse('high')).toBe('high')
    })

    it('should reject invalid risk levels', () => {
      expect(() => RiskLevelSchema.parse('critical')).toThrow()
      expect(() => RiskLevelSchema.parse('')).toThrow()
    })
  })
})

describe('User Schema Validation', () => {
  describe('UserSchema', () => {
    const validUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      profile: {}
    }

    it('should validate a valid user', () => {
      const result = UserSchema.parse(validUser)
      expect(result).toEqual(validUser)
    })

    it('should reject invalid email', () => {
      expect(() => UserSchema.parse({
        ...validUser,
        email: 'invalid-email'
      })).toThrow()
    })

    it('should reject invalid UUID', () => {
      expect(() => UserSchema.parse({
        ...validUser,
        id: 'invalid-uuid'
      })).toThrow()
    })

    it('should reject invalid datetime', () => {
      expect(() => UserSchema.parse({
        ...validUser,
        created_at: 'invalid-date'
      })).toThrow()
    })
  })

  describe('UserProfileSchema', () => {
    const validProfile = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      preferred_domain: 'cybersecurity',
      default_job_role: 'security-analyst',
      default_risk_profile: 'balanced' as const,
      training_level: 3,
      total_scenarios_completed: 15,
      average_score: 78.5,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }

    it('should validate a valid user profile', () => {
      const result = UserProfileSchema.parse(validProfile)
      expect(result).toEqual(validProfile)
    })

    it('should apply default values', () => {
      const minimalProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
      const result = UserProfileSchema.parse(minimalProfile)
      expect(result.training_level).toBe(1)
      expect(result.total_scenarios_completed).toBe(0)
      expect(result.average_score).toBe(0)
    })

    it('should reject invalid training level', () => {
      expect(() => UserProfileSchema.parse({
        ...validProfile,
        training_level: 0
      })).toThrow()

      expect(() => UserProfileSchema.parse({
        ...validProfile,
        training_level: 11
      })).toThrow()
    })

    it('should reject negative scores', () => {
      expect(() => UserProfileSchema.parse({
        ...validProfile,
        average_score: -10
      })).toThrow()

      expect(() => UserProfileSchema.parse({
        ...validProfile,
        average_score: 101
      })).toThrow()
    })
  })
})

describe('Scenario Engine Schema Validation', () => {
  describe('ConsequenceSchema', () => {
    const validConsequence = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'direct' as const,
      description: 'System security compromised',
      impact_score: -25,
      delay_minutes: 5,
      probability: 0.8
    }

    it('should validate a valid consequence', () => {
      const result = ConsequenceSchema.parse(validConsequence)
      expect(result).toEqual(validConsequence)
    })

    it('should reject invalid impact score range', () => {
      expect(() => ConsequenceSchema.parse({
        ...validConsequence,
        impact_score: -150
      })).toThrow()

      expect(() => ConsequenceSchema.parse({
        ...validConsequence,
        impact_score: 150
      })).toThrow()
    })

    it('should reject invalid probability range', () => {
      expect(() => ConsequenceSchema.parse({
        ...validConsequence,
        probability: -0.1
      })).toThrow()

      expect(() => ConsequenceSchema.parse({
        ...validConsequence,
        probability: 1.1
      })).toThrow()
    })

    it('should reject empty description', () => {
      expect(() => ConsequenceSchema.parse({
        ...validConsequence,
        description: ''
      })).toThrow()
    })
  })

  describe('DecisionSchema', () => {
    const validDecision = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      text: 'Immediately isolate the affected systems',
      consequences: [{
        id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'direct' as const,
        description: 'Systems isolated successfully',
        impact_score: 15,
        probability: 0.9
      }],
      nextStateId: '123e4567-e89b-12d3-a456-426614174002',
      timeWeight: 1.2,
      riskLevel: 'medium' as const
    }

    it('should validate a valid decision', () => {
      const result = DecisionSchema.parse(validDecision)
      expect(result).toEqual(validDecision)
    })

    it('should require at least one consequence', () => {
      expect(() => DecisionSchema.parse({
        ...validDecision,
        consequences: []
      })).toThrow()
    })

    it('should reject invalid time weight', () => {
      expect(() => DecisionSchema.parse({
        ...validDecision,
        timeWeight: -0.1
      })).toThrow()

      expect(() => DecisionSchema.parse({
        ...validDecision,
        timeWeight: 2.1
      })).toThrow()
    })

    it('should reject text that is too long', () => {
      expect(() => DecisionSchema.parse({
        ...validDecision,
        text: 'a'.repeat(301)
      })).toThrow()
    })
  })

  describe('CharacterSchema', () => {
    const validCharacter = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Dr. Sarah Chen',
      role: 'Chief Security Officer',
      personality_traits: ['analytical', 'decisive', 'calm'],
      communication_style: 'direct and technical',
      expertise_areas: ['cybersecurity', 'incident response']
    }

    it('should validate a valid character', () => {
      const result = CharacterSchema.parse(validCharacter)
      expect(result).toEqual(validCharacter)
    })

    it('should limit personality traits', () => {
      expect(() => CharacterSchema.parse({
        ...validCharacter,
        personality_traits: Array(11).fill('trait')
      })).toThrow()
    })

    it('should limit expertise areas', () => {
      expect(() => CharacterSchema.parse({
        ...validCharacter,
        expertise_areas: Array(11).fill('area')
      })).toThrow()
    })
  })
})

describe('Complex Schema Validation', () => {
  describe('ScenarioStateSchema', () => {
    const validState = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      description: 'A critical security breach has been detected',
      context: 'Multiple systems are showing signs of unauthorized access',
      decisions: [{
        id: '123e4567-e89b-12d3-a456-426614174001',
        text: 'Isolate affected systems',
        consequences: [{
          id: '123e4567-e89b-12d3-a456-426614174002',
          type: 'direct' as const,
          description: 'Systems isolated',
          impact_score: 10,
          probability: 0.9
        }],
        nextStateId: '123e4567-e89b-12d3-a456-426614174003',
        riskLevel: 'medium' as const
      }],
      timeLimit: 120,
      environmentalFactors: ['high stress', 'limited information'],
      characters: [{
        id: '123e4567-e89b-12d3-a456-426614174004',
        name: 'John Doe',
        role: 'IT Manager',
        personality_traits: ['calm'],
        communication_style: 'direct',
        expertise_areas: ['systems']
      }],
      riskLevel: 'high' as const,
      criticalityScore: 8
    }

    it('should validate a valid scenario state', () => {
      const result = ScenarioStateSchema.parse(validState)
      expect(result).toEqual(validState)
    })

    it('should require at least one decision', () => {
      expect(() => ScenarioStateSchema.parse({
        ...validState,
        decisions: []
      })).toThrow()
    })

    it('should limit maximum decisions', () => {
      const manyDecisions = Array(7).fill(validState.decisions[0])
      expect(() => ScenarioStateSchema.parse({
        ...validState,
        decisions: manyDecisions
      })).toThrow()
    })

    it('should validate time limit range', () => {
      expect(() => ScenarioStateSchema.parse({
        ...validState,
        timeLimit: 29
      })).toThrow()

      expect(() => ScenarioStateSchema.parse({
        ...validState,
        timeLimit: 601
      })).toThrow()
    })

    it('should validate criticality score range', () => {
      expect(() => ScenarioStateSchema.parse({
        ...validState,
        criticalityScore: 0
      })).toThrow()

      expect(() => ScenarioStateSchema.parse({
        ...validState,
        criticalityScore: 11
      })).toThrow()
    })
  })
})

describe('Input Schema Validation', () => {
  describe('StartTrainingSessionInputSchema', () => {
    const validInput = {
      scenario_id: '123e4567-e89b-12d3-a456-426614174000',
      configuration: {
        domain: 'cybersecurity',
        jobRole: 'security-analyst',
        riskProfile: 'balanced' as const,
        scenarioHistory: ['scenario1', 'scenario2']
      }
    }

    it('should validate valid input', () => {
      const result = StartTrainingSessionInputSchema.parse(validInput)
      expect(result).toEqual(validInput)
    })

    it('should reject invalid scenario ID', () => {
      expect(() => StartTrainingSessionInputSchema.parse({
        ...validInput,
        scenario_id: 'invalid-uuid'
      })).toThrow()
    })

    it('should limit scenario history', () => {
      expect(() => StartTrainingSessionInputSchema.parse({
        ...validInput,
        configuration: {
          ...validInput.configuration,
          scenarioHistory: Array(21).fill('scenario')
        }
      })).toThrow()
    })
  })

  describe('MakeDecisionInputSchema', () => {
    const validInput = {
      session_id: '123e4567-e89b-12d3-a456-426614174000',
      decision_id: '123e4567-e89b-12d3-a456-426614174001',
      user_confidence: 4
    }

    it('should validate valid input', () => {
      const result = MakeDecisionInputSchema.parse(validInput)
      expect(result).toEqual(validInput)
    })

    it('should validate confidence range', () => {
      expect(() => MakeDecisionInputSchema.parse({
        ...validInput,
        user_confidence: 0
      })).toThrow()

      expect(() => MakeDecisionInputSchema.parse({
        ...validInput,
        user_confidence: 6
      })).toThrow()
    })

    it('should allow optional confidence', () => {
      const inputWithoutConfidence = {
        session_id: '123e4567-e89b-12d3-a456-426614174000',
        decision_id: '123e4567-e89b-12d3-a456-426614174001'
      }
      const result = MakeDecisionInputSchema.parse(inputWithoutConfidence)
      expect(result).toEqual(inputWithoutConfidence)
    })
  })
})