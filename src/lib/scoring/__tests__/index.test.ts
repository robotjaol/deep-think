import { createScoringSystem } from '../index'
import { SessionDecision, ScenarioState, Consequence } from '../../types'

describe('Scoring System Integration', () => {
  let scoringSystem: ReturnType<typeof createScoringSystem>
  
  beforeEach(() => {
    scoringSystem = createScoringSystem()
  })

  const createMockSessionDecision = (
    id: string,
    consequences: Consequence[],
    timeTakenMs: number = 30000,
    scoreImpact: number = 50
  ): SessionDecision => ({
    id,
    session_id: 'test-session',
    state_id: 'test-state',
    decision_text: `Test decision ${id}`,
    timestamp: new Date().toISOString(),
    time_taken_ms: timeTakenMs,
    score_impact: scoreImpact,
    consequences,
    user_confidence: 70
  })

  const createMockConsequence = (
    type: 'direct' | 'second-order',
    impactScore: number,
    probability: number = 0.8,
    delayMinutes?: number
  ): Consequence => ({
    id: `consequence-${Math.random()}`,
    type,
    description: `Test ${type} consequence`,
    impact_score: impactScore,
    probability,
    delay_minutes: delayMinutes
  })

  const createMockScenarioContext = (): ScenarioState => ({
    id: 'test-scenario',
    description: 'Test crisis scenario',
    context: 'High-pressure crisis situation',
    decisions: [],
    timeLimit: 300000,
    environmentalFactors: ['time pressure', 'resource constraints'],
    characters: [
      {
        id: 'char-1',
        name: 'Manager',
        role: 'Manager',
        personality_traits: ['decisive'],
        communication_style: 'direct',
        expertise_areas: ['operations']
      }
    ],
    riskLevel: 'high',
    criticalityScore: 85
  })

  describe('createScoringSystem', () => {
    it('should create all scoring system components', () => {
      expect(scoringSystem.scoreCalculator).toBeDefined()
      expect(scoringSystem.impactAnalyzer).toBeDefined()
      expect(scoringSystem.feedbackGenerator).toBeDefined()
      expect(scoringSystem.resourceMatcher).toBeDefined()
      expect(scoringSystem.analyzeSession).toBeDefined()
    })

    it('should have analyzeSession method that returns complete analysis', async () => {
      const sessionDecisions = [
        createMockSessionDecision('1', [
          createMockConsequence('direct', 80, 0.9),
          createMockConsequence('second-order', 70, 0.7, 30)
        ], 25000, 75),
        createMockSessionDecision('2', [
          createMockConsequence('direct', 60, 0.8),
          createMockConsequence('second-order', 65, 0.6, 45)
        ], 35000, 60)
      ]
      
      const scenarioContext = createMockScenarioContext()
      
      const analysis = await scoringSystem.analyzeSession(
        sessionDecisions,
        scenarioContext,
        'balanced',
        2,
        3
      )
      
      expect(analysis.scoreResult).toBeDefined()
      expect(analysis.feedback).toBeDefined()
      expect(analysis.resources).toBeDefined()
      
      // Verify score result structure
      expect(analysis.scoreResult.totalScore).toBeGreaterThan(0)
      expect(analysis.scoreResult.breakdown).toHaveLength(4)
      
      // Verify feedback structure
      expect(analysis.feedback.overallAssessment).toBeDefined()
      expect(analysis.feedback.performanceAnalysis).toBeDefined()
      expect(analysis.feedback.learningRecommendations).toBeInstanceOf(Array)
      expect(analysis.feedback.improvementPlan).toBeDefined()
      expect(analysis.feedback.detailedInsights).toHaveLength(2)
      
      // Verify resources structure
      expect(analysis.resources).toBeInstanceOf(Array)
    })
  })

  describe('component integration', () => {
    it('should integrate score calculation with feedback generation', async () => {
      const sessionDecisions = [
        createMockSessionDecision('1', [
          createMockConsequence('direct', 40, 0.9) // Poor direct impact
        ], 120000, 30) // Slow decision, poor outcome
      ]
      
      const scenarioContext = createMockScenarioContext()
      
      const analysis = await scoringSystem.analyzeSession(
        sessionDecisions,
        scenarioContext,
        'balanced',
        1,
        1
      )
      
      // Score should reflect poor performance
      expect(analysis.scoreResult.totalScore).toBeLessThan(60)
      expect(analysis.scoreResult.directImpact).toBeLessThan(60)
      
      // Feedback should identify weaknesses
      expect(analysis.feedback.performanceAnalysis.weaknesses).toContain('Direct Impact Management')
      
      // Should have improvement recommendations
      const directImpactRec = analysis.feedback.learningRecommendations.find(r => 
        r.category === 'Direct Impact Management'
      )
      expect(directImpactRec).toBeDefined()
      expect(directImpactRec?.priority).toBe('high')
    })

    it('should integrate impact analysis with detailed insights', async () => {
      const sessionDecisions = [
        createMockSessionDecision('1', [
          createMockConsequence('direct', 90, 0.9),
          createMockConsequence('second-order', 85, 0.8, 60)
        ], 20000, 80)
      ]
      
      const scenarioContext = createMockScenarioContext()
      
      const analysis = await scoringSystem.analyzeSession(
        sessionDecisions,
        scenarioContext,
        'aggressive',
        3,
        2
      )
      
      // Should have detailed insights for the decision
      expect(analysis.feedback.detailedInsights).toHaveLength(1)
      
      const insight = analysis.feedback.detailedInsights[0]
      expect(insight.decisionId).toBe('1')
      expect(insight.impactAnalysis).toBeDefined()
      expect(insight.impactAnalysis.overallImpactScore).toBeGreaterThan(70)
      expect(insight.lessonsLearned.length).toBeGreaterThan(0)
    })

    it('should match resources based on identified weaknesses', async () => {
      const sessionDecisions = [
        createMockSessionDecision('1', [
          createMockConsequence('direct', 70, 0.8),
          createMockConsequence('second-order', 30, 0.6, 90) // Poor second-order anticipation
        ], 30000, 50)
      ]
      
      const scenarioContext = createMockScenarioContext()
      
      // Add some mock resources to the resource matcher
      const mockResources = [
        {
          id: 'systems-thinking-res',
          title: 'Systems Thinking for Crisis Management',
          type: 'textbook' as const,
          domain: 'crisis-management',
          tags: ['systems-thinking', 'second-order-effects'],
          relevance_keywords: ['systems', 'thinking', 'second-order', 'cascading'],
          created_at: new Date().toISOString(),
          description: 'Learn to anticipate cascading effects',
          difficulty_level: 2,
          estimated_time_minutes: 60
        }
      ]
      
      scoringSystem.resourceMatcher.addResources(mockResources)
      
      const analysis = await scoringSystem.analyzeSession(
        sessionDecisions,
        scenarioContext,
        'balanced',
        2,
        1
      )
      
      // Should identify second-order effects as weakness
      expect(analysis.scoreResult.secondOrderEffects).toBeLessThan(60)
      
      // Should recommend relevant resources
      const systemsResource = analysis.resources.find(r => 
        r.resource.title.includes('Systems Thinking')
      )
      expect(systemsResource).toBeDefined()
      expect(systemsResource?.relevanceScore).toBeGreaterThan(0.3)
    })

    it('should provide consistent analysis across all components', async () => {
      const sessionDecisions = [
        createMockSessionDecision('1', [
          createMockConsequence('direct', 85, 0.9),
          createMockConsequence('second-order', 80, 0.8, 30)
        ], 22000, 85), // Good performance
        createMockSessionDecision('2', [
          createMockConsequence('direct', 88, 0.9),
          createMockConsequence('second-order', 82, 0.8, 25)
        ], 20000, 88) // Improving performance
      ]
      
      const scenarioContext = createMockScenarioContext()
      
      const analysis = await scoringSystem.analyzeSession(
        sessionDecisions,
        scenarioContext,
        'balanced',
        3,
        2
      )
      
      // All components should reflect good performance
      expect(analysis.scoreResult.totalScore).toBeGreaterThan(75)
      expect(['proficient', 'expert']).toContain(analysis.feedback.overallAssessment.performanceLevel)
      expect(['improving', 'stable']).toContain(analysis.feedback.performanceAnalysis.overallTrend)
      expect(analysis.feedback.performanceAnalysis.strengths.length).toBeGreaterThan(0)
      
      // Should have fewer high-priority recommendations
      const highPriorityRecs = analysis.feedback.learningRecommendations.filter(r => 
        r.priority === 'high'
      )
      expect(highPriorityRecs.length).toBeLessThanOrEqual(1)
    })
  })

  describe('edge case handling', () => {
    it('should handle empty session gracefully', async () => {
      const analysis = await scoringSystem.analyzeSession(
        [],
        createMockScenarioContext(),
        'balanced',
        2,
        1
      )
      
      expect(analysis.scoreResult.totalScore).toBe(0)
      expect(analysis.feedback.detailedInsights).toHaveLength(0)
      expect(analysis.feedback.performanceAnalysis.overallTrend).toBe('stable')
      expect(analysis.resources).toBeInstanceOf(Array)
    })

    it('should handle single decision session', async () => {
      const sessionDecisions = [
        createMockSessionDecision('1', [
          createMockConsequence('direct', 70, 0.8)
        ], 30000, 70)
      ]
      
      const analysis = await scoringSystem.analyzeSession(
        sessionDecisions,
        createMockScenarioContext(),
        'balanced',
        2,
        1
      )
      
      expect(analysis.scoreResult.totalScore).toBeGreaterThan(0)
      expect(analysis.feedback.detailedInsights).toHaveLength(1)
      expect(analysis.feedback.performanceAnalysis.overallTrend).toBe('stable')
    })

    it('should handle extreme performance scenarios', async () => {
      const perfectDecisions = [
        createMockSessionDecision('1', [
          createMockConsequence('direct', 100, 1.0),
          createMockConsequence('second-order', 95, 0.9, 15)
        ], 20000, 100)
      ]
      
      const terribleDecisions = [
        createMockSessionDecision('1', [
          createMockConsequence('direct', 10, 0.9),
          createMockConsequence('second-order', 5, 0.8, 120)
        ], 250000, 5)
      ]
      
      const perfectAnalysis = await scoringSystem.analyzeSession(
        perfectDecisions,
        createMockScenarioContext(),
        'balanced',
        3,
        1
      )
      
      const terribleAnalysis = await scoringSystem.analyzeSession(
        terribleDecisions,
        createMockScenarioContext(),
        'balanced',
        1,
        1
      )
      
      // Perfect performance
      expect(perfectAnalysis.scoreResult.totalScore).toBeGreaterThan(85)
      expect(['proficient', 'expert']).toContain(perfectAnalysis.feedback.overallAssessment.performanceLevel)
      
      // Terrible performance
      expect(terribleAnalysis.scoreResult.totalScore).toBeLessThan(40)
      expect(terribleAnalysis.feedback.overallAssessment.performanceLevel).toBe('novice')
      expect(terribleAnalysis.feedback.learningRecommendations.length).toBeGreaterThan(2)
    })

    it('should handle different risk profiles consistently', async () => {
      const riskDecisions = [
        createMockSessionDecision('1', [
          createMockConsequence('direct', 90, 0.6) // High impact, uncertain
        ], 15000, 70) // Quick decision
      ]
      
      const conservativeAnalysis = await scoringSystem.analyzeSession(
        riskDecisions,
        createMockScenarioContext(),
        'conservative',
        2,
        1
      )
      
      const aggressiveAnalysis = await scoringSystem.analyzeSession(
        riskDecisions,
        createMockScenarioContext(),
        'aggressive',
        2,
        1
      )
      
      // Both should provide valid analysis but with different risk management scores
      expect(conservativeAnalysis.scoreResult.totalScore).toBeGreaterThan(0)
      expect(aggressiveAnalysis.scoreResult.totalScore).toBeGreaterThan(0)
      
      // Aggressive profile should score better with high-risk decisions
      expect(aggressiveAnalysis.scoreResult.riskManagement).toBeGreaterThanOrEqual(
        conservativeAnalysis.scoreResult.riskManagement
      )
    })
  })

  describe('performance and scalability', () => {
    it('should handle large numbers of decisions efficiently', async () => {
      const manyDecisions = Array.from({ length: 20 }, (_, i) => 
        createMockSessionDecision(`${i + 1}`, [
          createMockConsequence('direct', 60 + Math.random() * 30),
          createMockConsequence('second-order', 50 + Math.random() * 40, 0.7, 30 + Math.random() * 60)
        ], 20000 + Math.random() * 40000, 50 + Math.random() * 40)
      )
      
      const startTime = Date.now()
      
      const analysis = await scoringSystem.analyzeSession(
        manyDecisions,
        createMockScenarioContext(),
        'balanced',
        2,
        2
      )
      
      const endTime = Date.now()
      const executionTime = endTime - startTime
      
      // Should complete within reasonable time (less than 1 second)
      expect(executionTime).toBeLessThan(1000)
      
      // Should provide complete analysis
      expect(analysis.scoreResult.totalScore).toBeGreaterThan(0)
      expect(analysis.feedback.detailedInsights).toHaveLength(20)
      expect(analysis.resources).toBeInstanceOf(Array)
    })

    it('should maintain consistency with repeated analysis', async () => {
      const sessionDecisions = [
        createMockSessionDecision('1', [
          createMockConsequence('direct', 75, 0.8),
          createMockConsequence('second-order', 70, 0.7, 45)
        ], 28000, 72)
      ]
      
      const analysis1 = await scoringSystem.analyzeSession(
        sessionDecisions,
        createMockScenarioContext(),
        'balanced',
        2,
        1
      )
      
      const analysis2 = await scoringSystem.analyzeSession(
        sessionDecisions,
        createMockScenarioContext(),
        'balanced',
        2,
        1
      )
      
      // Results should be identical
      expect(analysis1.scoreResult.totalScore).toBe(analysis2.scoreResult.totalScore)
      expect(analysis1.scoreResult.directImpact).toBe(analysis2.scoreResult.directImpact)
      expect(analysis1.scoreResult.secondOrderEffects).toBe(analysis2.scoreResult.secondOrderEffects)
      expect(analysis1.feedback.overallAssessment.performanceLevel).toBe(
        analysis2.feedback.overallAssessment.performanceLevel
      )
    })
  })
})