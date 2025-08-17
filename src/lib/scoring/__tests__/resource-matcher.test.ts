import { ResourceMatcher } from '../resource-matcher'
import { LearningResource, SessionDecision, ScoreResult, Consequence } from '../../types'

describe('ResourceMatcher', () => {
  let resourceMatcher: ResourceMatcher
  let mockResources: LearningResource[]
  
  beforeEach(() => {
    mockResources = [
      {
        id: 'res-1',
        title: 'Stakeholder Impact Analysis Framework',
        type: 'textbook',
        url: 'https://example.com/stakeholder-analysis',
        domain: 'crisis-management',
        tags: ['stakeholder-analysis', 'impact-assessment', 'decision-making'],
        relevance_keywords: ['stakeholder', 'impact', 'analysis', 'framework'],
        created_at: new Date().toISOString(),
        description: 'Comprehensive guide to analyzing stakeholder impact in crisis decisions',
        difficulty_level: 2,
        estimated_time_minutes: 45
      },
      {
        id: 'res-2',
        title: 'Systems Thinking for Crisis Leaders',
        type: 'paper',
        url: 'https://example.com/systems-thinking',
        domain: 'systems-thinking',
        tags: ['systems-thinking', 'second-order-effects', 'cascading-impacts'],
        relevance_keywords: ['systems', 'thinking', 'cascading', 'second-order'],
        created_at: new Date().toISOString(),
        description: 'Research paper on applying systems thinking to predict cascading effects',
        difficulty_level: 3,
        estimated_time_minutes: 60
      },
      {
        id: 'res-3',
        title: 'Rapid Decision Making Under Pressure',
        type: 'video',
        url: 'https://youtube.com/watch?v=rapid-decisions',
        domain: 'decision-making',
        tags: ['rapid-decisions', 'time-pressure', 'efficiency'],
        relevance_keywords: ['rapid', 'decision', 'time', 'pressure'],
        created_at: new Date().toISOString(),
        description: 'Video tutorial on making quality decisions under time constraints',
        difficulty_level: 1,
        estimated_time_minutes: 30
      },
      {
        id: 'res-4',
        title: 'Risk Management for Conservative Leaders',
        type: 'textbook',
        url: 'https://example.com/conservative-risk',
        domain: 'risk-management',
        tags: ['risk-management', 'conservative', 'leadership'],
        relevance_keywords: ['risk', 'management', 'conservative', 'leadership'],
        created_at: new Date().toISOString(),
        description: 'Risk management strategies for conservative decision-makers',
        difficulty_level: 2,
        estimated_time_minutes: 90
      },
      {
        id: 'res-5',
        title: 'Financial Crisis Case Study: Cascading Effects',
        type: 'case-study',
        url: 'https://example.com/financial-crisis',
        domain: 'finance',
        tags: ['case-study', 'financial-crisis', 'cascading-effects'],
        relevance_keywords: ['cascading', 'effects', 'financial', 'crisis'],
        created_at: new Date().toISOString(),
        description: 'Analysis of cascading effects in the 2008 financial crisis',
        difficulty_level: 2,
        estimated_time_minutes: 75
      }
    ]
    
    resourceMatcher = new ResourceMatcher(mockResources)
  })

  const createMockSessionDecision = (
    id: string,
    consequences: Consequence[],
    decisionText: string = `Test decision ${id}`
  ): SessionDecision => ({
    id,
    session_id: 'test-session',
    state_id: 'test-state',
    decision_text: decisionText,
    timestamp: new Date().toISOString(),
    time_taken_ms: 30000,
    score_impact: 50,
    consequences,
    user_confidence: 70
  })

  const createMockConsequence = (
    type: 'direct' | 'second-order',
    description: string,
    impactScore: number = 70
  ): Consequence => ({
    id: `consequence-${Math.random()}`,
    type,
    description,
    impact_score: impactScore,
    probability: 0.8
  })

  const createMockScoreResult = (
    totalScore: number,
    breakdown: Array<{ category: string; score: number }>
  ): ScoreResult => ({
    totalScore,
    directImpact: 70,
    secondOrderEffects: 65,
    riskManagement: 75,
    timeEfficiency: 80,
    breakdown: breakdown.map(b => ({
      category: b.category,
      score: b.score,
      maxScore: 100,
      explanation: `Test explanation for ${b.category}`,
      improvementSuggestions: [`Improve ${b.category}`]
    })),
    percentile: 75
  })

  describe('findRelevantResources', () => {
    it('should find resources based on decision keywords', () => {
      const consequences = [
        createMockConsequence('direct', 'Stakeholder impact on team members'),
        createMockConsequence('second-order', 'Analysis shows framework needed')
      ]
      const decisions = [createMockSessionDecision('1', consequences, 'Need stakeholder analysis')]
      const scoreResult = createMockScoreResult(70, [])
      
      const resources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 2, 5
      )
      
      expect(resources.length).toBeGreaterThan(0)
      
      const stakeholderResource = resources.find(r => 
        r.resource.title.includes('Stakeholder')
      )
      expect(stakeholderResource).toBeDefined()
      expect(stakeholderResource?.relevanceScore).toBeGreaterThan(0.3)
      expect(stakeholderResource?.matchingKeywords).toContain('stakeholder')
    })

    it('should find resources based on weakness areas', () => {
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(60, [
        { category: 'Second-Order Effects Anticipation', score: 40 }
      ])
      
      const resources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 2, 5
      )
      
      const systemsResource = resources.find(r => 
        r.resource.title.includes('Systems Thinking')
      )
      expect(systemsResource).toBeDefined()
      expect(systemsResource?.relevanceScore).toBeGreaterThan(0.3)
    })

    it('should consider user risk profile in recommendations', () => {
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(70, [
        { category: 'Risk Management Strategy', score: 50 }
      ])
      
      const resources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'conservative', 2, 5
      )
      
      const conservativeResource = resources.find(r => 
        r.resource.title.includes('Conservative')
      )
      expect(conservativeResource).toBeDefined()
    })

    it('should match difficulty level appropriately', () => {
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(70, [])
      
      const beginnerResources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 1, 10
      )
      const advancedResources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 3, 10
      )
      
      // Beginner should prefer easier resources
      const beginnerEasyResource = beginnerResources.find(r => 
        r.resource.difficulty_level === 1
      )
      expect(beginnerEasyResource?.difficultyMatch).toBeGreaterThan(0.8)
      
      // Advanced should prefer harder resources
      const advancedHardResource = advancedResources.find(r => 
        r.resource.difficulty_level === 3
      )
      expect(advancedHardResource?.difficultyMatch).toBeGreaterThan(0.8)
    })

    it('should limit results to maxResults parameter', () => {
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(70, [])
      
      const resources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 2, 3
      )
      
      expect(resources.length).toBeLessThanOrEqual(3)
    })

    it('should filter out low relevance resources', () => {
      const decisions = [createMockSessionDecision('1', [], 'Completely unrelated decision')]
      const scoreResult = createMockScoreResult(90, []) // High scores, no weaknesses
      
      const resources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 2, 10
      )
      
      // Should have fewer or no resources due to low relevance
      resources.forEach(resource => {
        expect(resource.relevanceScore).toBeGreaterThan(0.3)
      })
    })
  })

  describe('findResourcesForCompetency', () => {
    it('should find resources for specific competency areas', () => {
      const resources = resourceMatcher.findResourcesForCompetency(
        'Direct Impact Management', 2, ['textbook', 'video'], 3
      )
      
      expect(resources.length).toBeGreaterThan(0)
      
      const stakeholderResource = resources.find(r => 
        r.resource.title.includes('Stakeholder')
      )
      expect(stakeholderResource).toBeDefined()
      expect(stakeholderResource?.relevanceScore).toBeGreaterThan(0.4)
    })

    it('should filter by resource types', () => {
      const videoResources = resourceMatcher.findResourcesForCompetency(
        'Decision Timing Efficiency', 1, ['video'], 5
      )
      
      videoResources.forEach(resource => {
        expect(resource.resource.type).toBe('video')
      })
    })

    it('should match competency keywords correctly', () => {
      const systemsResources = resourceMatcher.findResourcesForCompetency(
        'Second-Order Effects Anticipation', 2, ['paper', 'case-study'], 5
      )
      
      const systemsResource = systemsResources.find(r => 
        r.resource.title.includes('Systems Thinking')
      )
      expect(systemsResource).toBeDefined()
      expect(systemsResource?.matchingKeywords).toContain('systems')
    })
  })

  describe('findResourcesForConsequences', () => {
    it('should find resources based on consequence patterns', () => {
      const consequences = [
        createMockConsequence('direct', 'Immediate system failure'),
        createMockConsequence('second-order', 'Cascading effects on other systems', 80)
      ]
      const decisions = [createMockSessionDecision('1', consequences)]
      
      const resources = resourceMatcher.findResourcesForConsequences(decisions, 2, 5)
      
      const cascadeResource = resources.find(r => 
        r.resource.tags.includes('cascading-effects')
      )
      expect(cascadeResource).toBeDefined()
    })

    it('should analyze impact patterns correctly', () => {
      const highImpactConsequences = [
        createMockConsequence('direct', 'Critical system failure', 90),
        createMockConsequence('direct', 'Major data loss', 85)
      ]
      const decisions = [createMockSessionDecision('1', highImpactConsequences)]
      
      const resources = resourceMatcher.findResourcesForConsequences(decisions, 2, 5)
      
      // Should find resources relevant to high-severity impacts
      expect(resources.length).toBeGreaterThan(0)
      resources.forEach(resource => {
        expect(resource.relevanceScore).toBeGreaterThan(0.35)
      })
    })
  })

  describe('getPersonalizedRecommendations', () => {
    it('should personalize recommendations based on user preferences', () => {
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(70, [])
      const preferences = {
        riskProfile: 'balanced' as const,
        trainingLevel: 2,
        preferredResourceTypes: ['video', 'case-study'] as const,
        availableTimeMinutes: 60,
        focusAreas: ['decision-making']
      }
      
      const recommendations = resourceMatcher.getPersonalizedRecommendations(
        decisions, scoreResult, preferences, 5
      )
      
      expect(recommendations.length).toBeGreaterThan(0)
      
      recommendations.forEach(rec => {
        expect(rec.personalizedScore).toBeDefined()
        expect(rec.learningPath).toBeDefined()
        expect(rec.estimatedEffectiveness).toBeDefined()
        expect(rec.recommendationReason).toBeTruthy()
      })
    })

    it('should boost scores for preferred resource types', () => {
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(70, [])
      const videoPreference = {
        riskProfile: 'balanced' as const,
        trainingLevel: 1,
        preferredResourceTypes: ['video'] as const,
        availableTimeMinutes: 120,
        focusAreas: []
      }
      
      const recommendations = resourceMatcher.getPersonalizedRecommendations(
        decisions, scoreResult, videoPreference, 5
      )
      
      const videoRec = recommendations.find(r => r.resource.type === 'video')
      const textbookRec = recommendations.find(r => r.resource.type === 'textbook')
      
      if (videoRec && textbookRec) {
        expect(videoRec.personalizedScore).toBeGreaterThan(textbookRec.personalizedScore)
      }
    })

    it('should consider time availability', () => {
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(70, [])
      const limitedTimePreference = {
        riskProfile: 'balanced' as const,
        trainingLevel: 2,
        preferredResourceTypes: ['video', 'textbook', 'paper', 'case-study'] as const,
        availableTimeMinutes: 30, // Very limited time
        focusAreas: []
      }
      
      const recommendations = resourceMatcher.getPersonalizedRecommendations(
        decisions, scoreResult, limitedTimePreference, 5
      )
      
      // Should prefer shorter resources
      const shortResource = recommendations.find(r => 
        (r.resource.estimated_time_minutes || 60) <= 30
      )
      expect(shortResource).toBeDefined()
    })

    it('should determine appropriate learning paths', () => {
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(70, [])
      const preferences = {
        riskProfile: 'balanced' as const,
        trainingLevel: 1, // Beginner level
        preferredResourceTypes: ['case-study'] as const,
        availableTimeMinutes: 60,
        focusAreas: []
      }
      
      const recommendations = resourceMatcher.getPersonalizedRecommendations(
        decisions, scoreResult, preferences, 5
      )
      
      const caseStudyRec = recommendations.find(r => r.resource.type === 'case-study')
      expect(caseStudyRec?.learningPath).toBe('practical-application')
    })

    it('should generate meaningful recommendation reasons', () => {
      const consequences = [
        createMockConsequence('direct', 'Stakeholder impact analysis needed')
      ]
      const decisions = [createMockSessionDecision('1', consequences)]
      const scoreResult = createMockScoreResult(60, [
        { category: 'Direct Impact Management', score: 40 }
      ])
      const preferences = {
        riskProfile: 'balanced' as const,
        trainingLevel: 2,
        preferredResourceTypes: ['textbook'] as const,
        availableTimeMinutes: 60,
        focusAreas: []
      }
      
      const recommendations = resourceMatcher.getPersonalizedRecommendations(
        decisions, scoreResult, preferences, 5
      )
      
      const stakeholderRec = recommendations.find(r => 
        r.resource.title.includes('Stakeholder')
      )
      
      expect(stakeholderRec?.recommendationReason).toBeTruthy()
      expect(stakeholderRec?.recommendationReason).toContain('decision patterns')
    })
  })

  describe('resource database management', () => {
    it('should add new resources to database', () => {
      const newResource: LearningResource = {
        id: 'new-res',
        title: 'New Crisis Management Guide',
        type: 'textbook',
        domain: 'crisis-management',
        tags: ['crisis', 'management'],
        relevance_keywords: ['crisis', 'management'],
        created_at: new Date().toISOString()
      }
      
      resourceMatcher.addResources([newResource])
      
      const decisions = [createMockSessionDecision('1', [], 'Crisis management needed')]
      const scoreResult = createMockScoreResult(70, [])
      
      const resources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 2, 10
      )
      
      const foundNewResource = resources.find(r => r.resource.id === 'new-res')
      expect(foundNewResource).toBeDefined()
    })

    it('should update resource database', () => {
      const newResources: LearningResource[] = [
        {
          id: 'updated-res',
          title: 'Updated Resource',
          type: 'video',
          domain: 'test',
          tags: ['test'],
          relevance_keywords: ['test'],
          created_at: new Date().toISOString()
        }
      ]
      
      resourceMatcher.updateResourceDatabase(newResources)
      
      const decisions = [createMockSessionDecision('1', [], 'Test decision')]
      const scoreResult = createMockScoreResult(70, [])
      
      const resources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 2, 10
      )
      
      // Should only find the new resource, not the original ones
      expect(resources.length).toBeLessThanOrEqual(1)
      if (resources.length > 0) {
        expect(resources[0].resource.id).toBe('updated-res')
      }
    })
  })

  describe('edge cases', () => {
    it('should handle empty resource database', () => {
      const emptyMatcher = new ResourceMatcher([])
      
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(70, [])
      
      const resources = emptyMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 2, 5
      )
      
      expect(resources).toHaveLength(0)
    })

    it('should handle decisions with no consequences', () => {
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(70, [])
      
      const resources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 2, 5
      )
      
      // Should still return some resources based on other factors
      expect(resources).toBeInstanceOf(Array)
    })

    it('should handle resources with missing optional fields', () => {
      const minimalResource: LearningResource = {
        id: 'minimal',
        title: 'Minimal Resource',
        type: 'paper',
        domain: 'test',
        tags: [],
        relevance_keywords: [],
        created_at: new Date().toISOString()
        // Missing description, difficulty_level, estimated_time_minutes
      }
      
      const matcher = new ResourceMatcher([minimalResource])
      
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(70, [])
      
      const resources = matcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 2, 5
      )
      
      // Should handle gracefully without errors
      expect(resources).toBeInstanceOf(Array)
    })

    it('should handle extreme user training levels', () => {
      const decisions = [createMockSessionDecision('1', [])]
      const scoreResult = createMockScoreResult(70, [])
      
      const veryBeginnerResources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 0, 5
      )
      const veryAdvancedResources = resourceMatcher.findRelevantResources(
        decisions, scoreResult, 'balanced', 10, 5
      )
      
      expect(veryBeginnerResources).toBeInstanceOf(Array)
      expect(veryAdvancedResources).toBeInstanceOf(Array)
    })
  })
})