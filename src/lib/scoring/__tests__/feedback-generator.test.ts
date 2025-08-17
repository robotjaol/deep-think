import { FeedbackGenerator } from '../feedback-generator'
import { ScoreResult, SessionDecision, ScenarioState, ScoreBreakdown, Consequence } from '../../types'

describe('FeedbackGenerator', () => {
  let feedbackGenerator: FeedbackGenerator
  
  beforeEach(() => {
    feedbackGenerator = new FeedbackGenerator()
  })

  const createMockScoreResult = (
    totalScore: number,
    directImpact: number = 70,
    secondOrderEffects: number = 65,
    riskManagement: number = 75,
    timeEfficiency: number = 80
  ): ScoreResult => ({
    totalScore,
    directImpact,
    secondOrderEffects,
    riskManagement,
    timeEfficiency,
    breakdown: [
      {
        category: 'Direct Impact Management',
        score: directImpact,
        maxScore: 100,
        explanation: 'Test explanation for direct impact',
        improvementSuggestions: ['Improve stakeholder analysis']
      },
      {
        category: 'Second-Order Effects Anticipation',
        score: secondOrderEffects,
        maxScore: 100,
        explanation: 'Test explanation for second-order effects',
        improvementSuggestions: ['Practice systems thinking']
      },
      {
        category: 'Risk Management Strategy',
        score: riskManagement,
        maxScore: 100,
        explanation: 'Test explanation for risk management',
        improvementSuggestions: ['Calibrate risk-taking']
      },
      {
        category: 'Decision Timing Efficiency',
        score: timeEfficiency,
        maxScore: 100,
        explanation: 'Test explanation for timing',
        improvementSuggestions: ['Practice rapid decision-making']
      }
    ],
    percentile: 75
  })

  const createMockSessionDecision = (
    id: string,
    scoreImpact: number = 50,
    timeTakenMs: number = 30000,
    confidence: number = 70
  ): SessionDecision => ({
    id,
    session_id: 'test-session',
    state_id: 'test-state',
    decision_text: `Test decision ${id}`,
    timestamp: new Date().toISOString(),
    time_taken_ms: timeTakenMs,
    score_impact: scoreImpact,
    consequences: [
      {
        id: `consequence-${id}`,
        type: 'direct',
        description: 'Test consequence',
        impact_score: 70,
        probability: 0.8
      }
    ],
    user_confidence: confidence
  })

  const createMockScenarioState = (): ScenarioState => ({
    id: 'test-state',
    description: 'Test scenario',
    context: 'Test context',
    decisions: [],
    timeLimit: 300000,
    environmentalFactors: [],
    characters: [],
    riskLevel: 'medium',
    criticalityScore: 70
  })

  describe('generateSessionFeedback', () => {
    it('should generate comprehensive feedback for a session', () => {
      const scoreResult = createMockScoreResult(75)
      const sessionDecisions = [
        createMockSessionDecision('1', 60),
        createMockSessionDecision('2', 70),
        createMockSessionDecision('3', 80)
      ]
      const scenarioContext = createMockScenarioState()
      
      const feedback = feedbackGenerator.generateSessionFeedback(
        scoreResult,
        sessionDecisions,
        scenarioContext,
        'balanced',
        2
      )
      
      expect(feedback.overallAssessment).toBeDefined()
      expect(feedback.performanceAnalysis).toBeDefined()
      expect(feedback.learningRecommendations).toBeInstanceOf(Array)
      expect(feedback.improvementPlan).toBeDefined()
      expect(feedback.nextSteps).toBeInstanceOf(Array)
      expect(feedback.encouragementMessage).toBeTruthy()
      expect(feedback.detailedInsights).toBeInstanceOf(Array)
      expect(feedback.detailedInsights).toHaveLength(3)
    })

    it('should categorize performance level correctly', () => {
      const expertScore = createMockScoreResult(92)
      const noviceScore = createMockScoreResult(45)
      
      const expertFeedback = feedbackGenerator.generateSessionFeedback(
        expertScore, [], createMockScenarioState(), 'balanced', 3
      )
      const noviceFeedback = feedbackGenerator.generateSessionFeedback(
        noviceScore, [], createMockScenarioState(), 'balanced', 1
      )
      
      expect(expertFeedback.overallAssessment.performanceLevel).toBe('expert')
      expect(noviceFeedback.overallAssessment.performanceLevel).toBe('novice')
    })

    it('should provide appropriate encouragement messages', () => {
      const highScore = createMockScoreResult(90)
      const lowScore = createMockScoreResult(40)
      
      const highFeedback = feedbackGenerator.generateSessionFeedback(
        highScore, [], createMockScenarioState(), 'balanced', 2
      )
      const lowFeedback = feedbackGenerator.generateSessionFeedback(
        lowScore, [], createMockScenarioState(), 'balanced', 1
      )
      
      expect(highFeedback.encouragementMessage).toContain('Outstanding')
      expect(lowFeedback.encouragementMessage).toContain('Great start')
    })
  })

  describe('generateLearningRecommendations', () => {
    it('should identify weak areas and recommend resources', () => {
      const scoreResult = createMockScoreResult(65, 40, 45, 75, 80) // Weak in first two areas
      const sessionDecisions = [createMockSessionDecision('1')]
      
      const recommendations = feedbackGenerator.generateLearningRecommendations(
        scoreResult,
        sessionDecisions,
        'balanced',
        2
      )
      
      expect(recommendations.length).toBeGreaterThan(0)
      
      const directImpactRec = recommendations.find(r => 
        r.category === 'Direct Impact Management'
      )
      expect(directImpactRec).toBeDefined()
      expect(directImpactRec?.priority).toBe('high')
      expect(directImpactRec?.resources.length).toBeGreaterThan(0)
    })

    it('should prioritize recommendations by weakness severity', () => {
      const scoreResult = createMockScoreResult(60, 30, 50, 70, 80) // Direct impact weakest
      const sessionDecisions = [createMockSessionDecision('1')]
      
      const recommendations = feedbackGenerator.generateLearningRecommendations(
        scoreResult,
        sessionDecisions,
        'balanced',
        2
      )
      
      expect(recommendations[0].category).toBe('Direct Impact Management')
      expect(recommendations[0].priority).toBe('high')
    })

    it('should provide risk profile-specific recommendations', () => {
      const scoreResult = createMockScoreResult(70, 60, 65, 40, 75) // Weak risk management
      const sessionDecisions = [createMockSessionDecision('1')]
      
      const conservativeRecs = feedbackGenerator.generateLearningRecommendations(
        scoreResult,
        sessionDecisions,
        'conservative',
        2
      )
      const aggressiveRecs = feedbackGenerator.generateLearningRecommendations(
        scoreResult,
        sessionDecisions,
        'aggressive',
        2
      )
      
      const conservativeRiskRec = conservativeRecs.find(r => 
        r.category === 'Risk Management Strategy'
      )
      const aggressiveRiskRec = aggressiveRecs.find(r => 
        r.category === 'Risk Management Strategy'
      )
      
      expect(conservativeRiskRec?.resources[0].title).toContain('Conservative')
      expect(aggressiveRiskRec?.resources[0].title).toContain('Aggressive')
    })

    it('should estimate improvement impact correctly', () => {
      const scoreResult = createMockScoreResult(60, 30, 70, 80, 85) // Very weak direct impact
      const sessionDecisions = [createMockSessionDecision('1')]
      
      const recommendations = feedbackGenerator.generateLearningRecommendations(
        scoreResult,
        sessionDecisions,
        'balanced',
        2
      )
      
      const directImpactRec = recommendations.find(r => 
        r.category === 'Direct Impact Management'
      )
      
      expect(directImpactRec?.estimatedImpact).toBeGreaterThan(10) // Should have high impact potential
    })

    it('should provide general recommendations for different performance levels', () => {
      const lowScore = createMockScoreResult(45)
      const highScore = createMockScoreResult(85)
      
      const lowRecs = feedbackGenerator.generateLearningRecommendations(
        lowScore, [], 'balanced', 1
      )
      const highRecs = feedbackGenerator.generateLearningRecommendations(
        highScore, [], 'balanced', 3
      )
      
      const foundationalRec = lowRecs.find(r => r.category === 'Foundational Skills')
      const advancedRec = highRecs.find(r => r.category === 'Advanced Techniques')
      
      expect(foundationalRec).toBeDefined()
      expect(advancedRec).toBeDefined()
    })
  })

  describe('createImprovementPlan', () => {
    it('should create short-term and long-term goals', () => {
      const scoreResult = createMockScoreResult(65, 50, 60, 70, 80)
      const performanceAnalysis = {
        overallTrend: 'improving' as const,
        consistencyScore: 75,
        strengths: ['Decision Timing Efficiency'],
        weaknesses: ['Direct Impact Management'],
        improvementAreas: ['Direct Impact Management', 'Second-Order Effects Anticipation'],
        decisionPatterns: ['Rapid decision-making'],
        riskTakingPattern: 'Balanced risk approach',
        timeManagementPattern: 'Consistent timing'
      }
      
      const plan = feedbackGenerator.createImprovementPlan(scoreResult, performanceAnalysis)
      
      expect(plan.shortTermGoals.length).toBeGreaterThan(0)
      expect(plan.longTermGoals.length).toBeGreaterThan(0)
      expect(plan.practiceExercises.length).toBeGreaterThan(0)
      expect(plan.milestones.length).toBeGreaterThan(0)
      expect(plan.estimatedTimeframe).toBeTruthy()
      expect(plan.successMetrics.length).toBeGreaterThan(0)
    })

    it('should focus on weakest area for short-term goals', () => {
      const scoreResult = createMockScoreResult(60, 30, 70, 80, 85) // Direct impact weakest
      const performanceAnalysis = {
        overallTrend: 'stable' as const,
        consistencyScore: 70,
        strengths: ['Risk Management Strategy'],
        weaknesses: ['Direct Impact Management'],
        improvementAreas: ['Direct Impact Management'],
        decisionPatterns: [],
        riskTakingPattern: 'Balanced',
        timeManagementPattern: 'Consistent'
      }
      
      const plan = feedbackGenerator.createImprovementPlan(scoreResult, performanceAnalysis)
      
      expect(plan.shortTermGoals[0].description).toContain('Direct Impact Management')
      expect(plan.shortTermGoals[0].targetValue).toBe(15) // 15 point improvement
    })

    it('should include consistency goals for inconsistent performers', () => {
      const scoreResult = createMockScoreResult(70)
      const performanceAnalysis = {
        overallTrend: 'stable' as const,
        consistencyScore: 50, // Low consistency
        strengths: [],
        weaknesses: [],
        improvementAreas: [],
        decisionPatterns: [],
        riskTakingPattern: 'Balanced',
        timeManagementPattern: 'Inconsistent timing'
      }
      
      const plan = feedbackGenerator.createImprovementPlan(scoreResult, performanceAnalysis)
      
      const consistencyGoal = plan.shortTermGoals.find(g => 
        g.description.toLowerCase().includes('consistency')
      )
      expect(consistencyGoal).toBeDefined()
    })

    it('should suggest appropriate practice exercises', () => {
      const scoreResult = createMockScoreResult(60, 40, 45, 70, 80)
      const performanceAnalysis = {
        overallTrend: 'stable' as const,
        consistencyScore: 70,
        strengths: [],
        weaknesses: ['Direct Impact Management', 'Second-Order Effects Anticipation'],
        improvementAreas: ['Direct Impact Management', 'Second-Order Effects Anticipation'],
        decisionPatterns: [],
        riskTakingPattern: 'Balanced',
        timeManagementPattern: 'Consistent'
      }
      
      const plan = feedbackGenerator.createImprovementPlan(scoreResult, performanceAnalysis)
      
      expect(plan.practiceExercises.length).toBe(2) // One for each weak area
      expect(plan.practiceExercises[0].difficulty).toBe('beginner') // Low scores = beginner
      expect(plan.practiceExercises[0].focusAreas).toContain('Direct Impact Management')
    })
  })

  describe('performance analysis', () => {
    it('should analyze decision trends correctly', () => {
      const improvingDecisions = [
        createMockSessionDecision('1', 40),
        createMockSessionDecision('2', 60),
        createMockSessionDecision('3', 80)
      ]
      const decliningDecisions = [
        createMockSessionDecision('1', 80),
        createMockSessionDecision('2', 60),
        createMockSessionDecision('3', 40)
      ]
      
      const scoreResult = createMockScoreResult(70)
      
      const improvingFeedback = feedbackGenerator.generateSessionFeedback(
        scoreResult, improvingDecisions, createMockScenarioState(), 'balanced', 2
      )
      const decliningFeedback = feedbackGenerator.generateSessionFeedback(
        scoreResult, decliningDecisions, createMockScenarioState(), 'balanced', 2
      )
      
      expect(improvingFeedback.performanceAnalysis.overallTrend).toBe('improving')
      expect(decliningFeedback.performanceAnalysis.overallTrend).toBe('declining')
    })

    it('should analyze consistency correctly', () => {
      const consistentDecisions = [
        createMockSessionDecision('1', 70),
        createMockSessionDecision('2', 72),
        createMockSessionDecision('3', 68)
      ]
      const inconsistentDecisions = [
        createMockSessionDecision('1', 90),
        createMockSessionDecision('2', 30),
        createMockSessionDecision('3', 80)
      ]
      
      const scoreResult = createMockScoreResult(70)
      
      const consistentFeedback = feedbackGenerator.generateSessionFeedback(
        scoreResult, consistentDecisions, createMockScenarioState(), 'balanced', 2
      )
      const inconsistentFeedback = feedbackGenerator.generateSessionFeedback(
        scoreResult, inconsistentDecisions, createMockScenarioState(), 'balanced', 2
      )
      
      expect(consistentFeedback.performanceAnalysis.consistencyScore).toBeGreaterThan(
        inconsistentFeedback.performanceAnalysis.consistencyScore
      )
    })

    it('should identify decision patterns', () => {
      const rapidDecisions = [
        createMockSessionDecision('1', 70, 15000), // 15 seconds
        createMockSessionDecision('2', 70, 20000), // 20 seconds
        createMockSessionDecision('3', 70, 18000)  // 18 seconds
      ]
      
      const scoreResult = createMockScoreResult(70)
      
      const feedback = feedbackGenerator.generateSessionFeedback(
        scoreResult, rapidDecisions, createMockScenarioState(), 'balanced', 2
      )
      
      expect(feedback.performanceAnalysis.decisionPatterns).toContain('Rapid decision-making')
    })

    it('should analyze confidence patterns', () => {
      const highConfidenceDecisions = [
        createMockSessionDecision('1', 70, 30000, 90),
        createMockSessionDecision('2', 70, 30000, 85),
        createMockSessionDecision('3', 70, 30000, 88)
      ]
      
      const scoreResult = createMockScoreResult(70)
      
      const feedback = feedbackGenerator.generateSessionFeedback(
        scoreResult, highConfidenceDecisions, createMockScenarioState(), 'balanced', 2
      )
      
      expect(feedback.performanceAnalysis.decisionPatterns).toContain('High confidence')
    })
  })

  describe('detailed insights', () => {
    it('should generate insights for each decision', () => {
      const sessionDecisions = [
        createMockSessionDecision('1', 60),
        createMockSessionDecision('2', 80)
      ]
      const scoreResult = createMockScoreResult(70)
      
      const feedback = feedbackGenerator.generateSessionFeedback(
        scoreResult, sessionDecisions, createMockScenarioState(), 'balanced', 2
      )
      
      expect(feedback.detailedInsights).toHaveLength(2)
      
      feedback.detailedInsights.forEach(insight => {
        expect(insight.decisionId).toBeTruthy()
        expect(insight.decisionText).toBeTruthy()
        expect(insight.insight).toBeTruthy()
        expect(insight.lessonsLearned).toBeInstanceOf(Array)
        expect(insight.alternativeApproaches).toBeInstanceOf(Array)
        expect(insight.impactAnalysis).toBeDefined()
      })
    })

    it('should provide lessons learned based on decision impact', () => {
      const highImpactConsequences: Consequence[] = [
        {
          id: 'consequence-1',
          type: 'direct',
          description: 'Critical system failure',
          impact_score: 90,
          probability: 0.9
        },
        {
          id: 'consequence-2',
          type: 'second-order',
          description: 'Customer trust loss',
          impact_score: 80,
          probability: 0.7,
          delay_minutes: 60
        }
      ]
      
      const highImpactDecision: SessionDecision = {
        ...createMockSessionDecision('1', 70),
        consequences: highImpactConsequences
      }
      
      const scoreResult = createMockScoreResult(70)
      
      const feedback = feedbackGenerator.generateSessionFeedback(
        scoreResult, [highImpactDecision], createMockScenarioState(), 'balanced', 2
      )
      
      const insight = feedback.detailedInsights[0]
      expect(insight.lessonsLearned.length).toBeGreaterThan(0)
      expect(insight.alternativeApproaches.length).toBeGreaterThan(0)
    })
  })

  describe('readiness assessment', () => {
    it('should assess readiness for advancement correctly', () => {
      const readyScore = createMockScoreResult(85, 80, 85, 90, 85)
      const notReadyScore = createMockScoreResult(65, 60, 65, 70, 65)
      
      const readyPerformance = {
        overallTrend: 'improving' as const,
        consistencyScore: 85,
        strengths: ['Risk Management Strategy', 'Decision Timing Efficiency'],
        weaknesses: [],
        improvementAreas: [],
        decisionPatterns: [],
        riskTakingPattern: 'Balanced',
        timeManagementPattern: 'Consistent'
      }
      
      const notReadyPerformance = {
        overallTrend: 'stable' as const,
        consistencyScore: 60,
        strengths: [],
        weaknesses: ['Direct Impact Management'],
        improvementAreas: ['Direct Impact Management'],
        decisionPatterns: [],
        riskTakingPattern: 'Balanced',
        timeManagementPattern: 'Inconsistent'
      }
      
      const readyFeedback = feedbackGenerator.generateSessionFeedback(
        readyScore, [], createMockScenarioState(), 'balanced', 2
      )
      const notReadyFeedback = feedbackGenerator.generateSessionFeedback(
        notReadyScore, [], createMockScenarioState(), 'balanced', 2
      )
      
      expect(readyFeedback.overallAssessment.readinessForAdvancement).toBe(true)
      expect(notReadyFeedback.overallAssessment.readinessForAdvancement).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty session decisions', () => {
      const scoreResult = createMockScoreResult(70)
      
      const feedback = feedbackGenerator.generateSessionFeedback(
        scoreResult, [], createMockScenarioState(), 'balanced', 2
      )
      
      expect(feedback.detailedInsights).toHaveLength(0)
      expect(feedback.performanceAnalysis.overallTrend).toBe('stable')
      expect(feedback.performanceAnalysis.consistencyScore).toBe(100)
    })

    it('should handle single decision sessions', () => {
      const scoreResult = createMockScoreResult(70)
      const singleDecision = [createMockSessionDecision('1', 70)]
      
      const feedback = feedbackGenerator.generateSessionFeedback(
        scoreResult, singleDecision, createMockScenarioState(), 'balanced', 2
      )
      
      expect(feedback.detailedInsights).toHaveLength(1)
      expect(feedback.performanceAnalysis.overallTrend).toBe('stable')
    })

    it('should handle perfect scores appropriately', () => {
      const perfectScore = createMockScoreResult(100, 100, 100, 100, 100)
      
      const feedback = feedbackGenerator.generateSessionFeedback(
        perfectScore, [], createMockScenarioState(), 'balanced', 3
      )
      
      expect(feedback.overallAssessment.performanceLevel).toBe('expert')
      expect(feedback.learningRecommendations.some(r => r.category === 'Advanced Techniques')).toBe(true)
    })
  })
})