import { ScoreCalculator } from '../score-calculator'
import { SessionDecision, RiskProfile, Consequence } from '../../types'

describe('ScoreCalculator', () => {
  let scoreCalculator: ScoreCalculator
  
  beforeEach(() => {
    scoreCalculator = new ScoreCalculator()
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

  describe('calculateSessionScore', () => {
    it('should return empty score result for no decisions', () => {
      const result = scoreCalculator.calculateSessionScore([], 'balanced')
      
      expect(result.totalScore).toBe(0)
      expect(result.directImpact).toBe(0)
      expect(result.secondOrderEffects).toBe(0)
      expect(result.riskManagement).toBe(0)
      expect(result.timeEfficiency).toBe(0)
      expect(result.breakdown).toHaveLength(0)
    })

    it('should calculate scores for single decision with direct consequences', () => {
      const consequences = [
        createMockConsequence('direct', 80, 0.9),
        createMockConsequence('direct', 60, 0.7)
      ]
      const decisions = [createMockSessionDecision('1', consequences)]
      
      const result = scoreCalculator.calculateSessionScore(decisions, 'balanced')
      
      expect(result.totalScore).toBeGreaterThan(0)
      expect(result.directImpact).toBeGreaterThan(0)
      expect(result.breakdown).toHaveLength(4)
      expect(result.breakdown[0].category).toBe('Direct Impact Management')
    })

    it('should calculate scores for decisions with second-order effects', () => {
      const consequences = [
        createMockConsequence('direct', 70, 0.8),
        createMockConsequence('second-order', 60, 0.6, 30)
      ]
      const decisions = [createMockSessionDecision('1', consequences)]
      
      const result = scoreCalculator.calculateSessionScore(decisions, 'balanced')
      
      expect(result.secondOrderEffects).toBeGreaterThan(0)
      expect(result.breakdown[1].category).toBe('Second-Order Effects Anticipation')
    })

    it('should apply difficulty multiplier correctly', () => {
      const consequences = [createMockConsequence('direct', 70, 0.8)]
      const decisions = [createMockSessionDecision('1', consequences)]
      
      const normalResult = scoreCalculator.calculateSessionScore(decisions, 'balanced', 1)
      const hardResult = scoreCalculator.calculateSessionScore(decisions, 'balanced', 3)
      
      expect(hardResult.totalScore).toBeGreaterThan(normalResult.totalScore)
    })

    it('should handle different risk profiles appropriately', () => {
      const consequences = [createMockConsequence('direct', 70, 0.8)]
      const decisions = [createMockSessionDecision('1', consequences)]
      
      const conservativeResult = scoreCalculator.calculateSessionScore(decisions, 'conservative')
      const aggressiveResult = scoreCalculator.calculateSessionScore(decisions, 'aggressive')
      
      expect(conservativeResult.riskManagement).toBeDefined()
      expect(aggressiveResult.riskManagement).toBeDefined()
    })

    it('should calculate time efficiency based on decision timing', () => {
      const consequences = [createMockConsequence('direct', 70, 0.8)]
      const fastDecision = createMockSessionDecision('1', consequences, 10000) // 10 seconds
      const slowDecision = createMockSessionDecision('2', consequences, 120000) // 2 minutes
      
      const fastResult = scoreCalculator.calculateSessionScore([fastDecision], 'balanced')
      const slowResult = scoreCalculator.calculateSessionScore([slowDecision], 'balanced')
      
      expect(fastResult.timeEfficiency).toBeDefined()
      expect(slowResult.timeEfficiency).toBeDefined()
    })
  })

  describe('score calculation edge cases', () => {
    it('should handle decisions with no consequences', () => {
      const decisions = [createMockSessionDecision('1', [])]
      
      const result = scoreCalculator.calculateSessionScore(decisions, 'balanced')
      
      expect(result.totalScore).toBeGreaterThanOrEqual(0)
      expect(result.directImpact).toBe(50) // Default value
    })

    it('should handle extreme impact scores', () => {
      const consequences = [
        createMockConsequence('direct', 100, 1.0),
        createMockConsequence('direct', 0, 1.0)
      ]
      const decisions = [createMockSessionDecision('1', consequences)]
      
      const result = scoreCalculator.calculateSessionScore(decisions, 'balanced')
      
      expect(result.directImpact).toBeGreaterThanOrEqual(0)
      expect(result.directImpact).toBeLessThanOrEqual(100)
    })

    it('should handle very low probability consequences', () => {
      const consequences = [
        createMockConsequence('direct', 80, 0.1),
        createMockConsequence('second-order', 90, 0.05, 60)
      ]
      const decisions = [createMockSessionDecision('1', consequences)]
      
      const result = scoreCalculator.calculateSessionScore(decisions, 'balanced')
      
      expect(result.directImpact).toBeGreaterThanOrEqual(0)
      expect(result.secondOrderEffects).toBeGreaterThanOrEqual(0)
    })

    it('should cap total score at 100', () => {
      // Create perfect scenario with difficulty multiplier
      const consequences = [createMockConsequence('direct', 100, 1.0)]
      const decisions = [createMockSessionDecision('1', consequences, 25000)] // Optimal timing
      
      const result = scoreCalculator.calculateSessionScore(decisions, 'balanced', 5) // High difficulty
      
      expect(result.totalScore).toBeLessThanOrEqual(100)
    })
  })

  describe('breakdown generation', () => {
    it('should generate detailed breakdown for all categories', () => {
      const consequences = [
        createMockConsequence('direct', 70, 0.8),
        createMockConsequence('second-order', 60, 0.7, 45)
      ]
      const decisions = [createMockSessionDecision('1', consequences)]
      
      const result = scoreCalculator.calculateSessionScore(decisions, 'balanced')
      
      expect(result.breakdown).toHaveLength(4)
      
      const categories = result.breakdown.map(b => b.category)
      expect(categories).toContain('Direct Impact Management')
      expect(categories).toContain('Second-Order Effects Anticipation')
      expect(categories).toContain('Risk Management Strategy')
      expect(categories).toContain('Decision Timing Efficiency')
      
      result.breakdown.forEach(breakdown => {
        expect(breakdown.score).toBeGreaterThanOrEqual(0)
        expect(breakdown.score).toBeLessThanOrEqual(100)
        expect(breakdown.maxScore).toBe(100)
        expect(breakdown.explanation).toBeTruthy()
        expect(breakdown.improvementSuggestions).toBeInstanceOf(Array)
      })
    })

    it('should provide relevant improvement suggestions for low scores', () => {
      const consequences = [createMockConsequence('direct', 20, 0.9)] // Poor direct impact
      const decisions = [createMockSessionDecision('1', consequences)]
      
      const result = scoreCalculator.calculateSessionScore(decisions, 'balanced')
      
      const directImpactBreakdown = result.breakdown.find(b => 
        b.category === 'Direct Impact Management'
      )
      
      expect(directImpactBreakdown?.improvementSuggestions.length).toBeGreaterThan(0)
      expect(directImpactBreakdown?.improvementSuggestions[0]).toContain('stakeholder')
    })
  })

  describe('percentile calculation', () => {
    it('should assign appropriate percentiles based on score', () => {
      const consequences = [createMockConsequence('direct', 95, 0.9)]
      const highScoreDecisions = [createMockSessionDecision('1', consequences, 25000)]
      
      const lowConsequences = [createMockConsequence('direct', 30, 0.9)]
      const lowScoreDecisions = [createMockSessionDecision('1', lowConsequences, 150000)]
      
      const highResult = scoreCalculator.calculateSessionScore(highScoreDecisions, 'balanced')
      const lowResult = scoreCalculator.calculateSessionScore(lowScoreDecisions, 'balanced')
      
      expect(highResult.percentile).toBeGreaterThan(lowResult.percentile!)
      expect(highResult.percentile).toBeGreaterThanOrEqual(0)
      expect(highResult.percentile).toBeLessThanOrEqual(100)
    })
  })

  describe('multiple decisions analysis', () => {
    it('should analyze patterns across multiple decisions', () => {
      const decisions = [
        createMockSessionDecision('1', [createMockConsequence('direct', 80, 0.9)], 20000),
        createMockSessionDecision('2', [createMockConsequence('direct', 70, 0.8)], 30000),
        createMockSessionDecision('3', [createMockConsequence('direct', 75, 0.85)], 25000)
      ]
      
      const result = scoreCalculator.calculateSessionScore(decisions, 'balanced')
      
      expect(result.totalScore).toBeGreaterThan(0)
      expect(result.breakdown).toHaveLength(4)
      
      // Should show consistent performance
      expect(result.directImpact).toBeGreaterThan(60)
    })

    it('should handle cascade effects across multiple decisions', () => {
      const decisions = [
        createMockSessionDecision('1', [
          createMockConsequence('direct', 60, 0.8),
          createMockConsequence('second-order', 70, 0.7, 30)
        ]),
        createMockSessionDecision('2', [
          createMockConsequence('direct', 65, 0.8),
          createMockConsequence('second-order', 80, 0.6, 45)
        ])
      ]
      
      const result = scoreCalculator.calculateSessionScore(decisions, 'balanced')
      
      expect(result.secondOrderEffects).toBeGreaterThan(0)
      // Second decision should show cascade amplification
      expect(result.secondOrderEffects).toBeGreaterThan(50)
    })
  })

  describe('risk profile integration', () => {
    it('should adjust risk management scoring based on user profile', () => {
      const highRiskConsequences = [createMockConsequence('direct', 90, 0.6)]
      const decisions = [createMockSessionDecision('1', highRiskConsequences)]
      
      const conservativeResult = scoreCalculator.calculateSessionScore(decisions, 'conservative')
      const aggressiveResult = scoreCalculator.calculateSessionScore(decisions, 'aggressive')
      
      // Aggressive profile should score better with high-risk decisions
      expect(aggressiveResult.riskManagement).toBeGreaterThanOrEqual(conservativeResult.riskManagement)
    })

    it('should provide profile-specific explanations', () => {
      const consequences = [createMockConsequence('direct', 70, 0.8)]
      const decisions = [createMockSessionDecision('1', consequences)]
      
      const result = scoreCalculator.calculateSessionScore(decisions, 'conservative')
      
      const riskBreakdown = result.breakdown.find(b => 
        b.category === 'Risk Management Strategy'
      )
      
      expect(riskBreakdown?.explanation).toContain('conservative')
    })
  })
})