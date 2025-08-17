import { OutcomeCalculator } from '../outcome-calculator'
import { Decision, Consequence } from '../../types'

describe('OutcomeCalculator', () => {
  let calculator: OutcomeCalculator
  let mockDecisions: Decision[]

  beforeEach(() => {
    calculator = new OutcomeCalculator()

    const directConsequences: Consequence[] = [
      {
        id: 'c1',
        type: 'direct',
        description: 'Immediate system shutdown',
        impact_score: 80,
        probability: 0.9
      },
      {
        id: 'c2',
        type: 'direct',
        description: 'User disruption',
        impact_score: 60,
        probability: 0.8
      }
    ]

    const secondOrderConsequences: Consequence[] = [
      {
        id: 'c3',
        type: 'second-order',
        description: 'Customer trust impact',
        impact_score: 70,
        probability: 0.7,
        delay_minutes: 60
      },
      {
        id: 'c4',
        type: 'second-order',
        description: 'Revenue loss',
        impact_score: 85,
        probability: 0.6,
        delay_minutes: 120
      }
    ]

    mockDecisions = [
      {
        id: 'd1',
        text: 'Emergency shutdown',
        consequences: [...directConsequences, ...secondOrderConsequences],
        nextStateId: 'state2',
        riskLevel: 'high'
      },
      {
        id: 'd2',
        text: 'Gradual rollback',
        consequences: [
          {
            id: 'c5',
            type: 'direct',
            description: 'Controlled shutdown',
            impact_score: 40,
            probability: 0.95
          },
          {
            id: 'c6',
            type: 'second-order',
            description: 'Minimal user impact',
            impact_score: 30,
            probability: 0.8,
            delay_minutes: 30
          }
        ],
        nextStateId: 'state3',
        riskLevel: 'medium'
      },
      {
        id: 'd3',
        text: 'Monitor and wait',
        consequences: [
          {
            id: 'c7',
            type: 'direct',
            description: 'No immediate action',
            impact_score: 20,
            probability: 1.0
          }
        ],
        nextStateId: 'state4',
        riskLevel: 'low'
      }
    ]
  })

  describe('calculateOutcomes', () => {
    it('should calculate comprehensive outcomes correctly', () => {
      const timeTakenMs = [45000, 30000, 60000] // 45s, 30s, 60s
      const timeLimitsMs = [60000, 60000, 60000] // 60s each

      const result = calculator.calculateOutcomes(mockDecisions, timeTakenMs, timeLimitsMs)

      expect(result.totalScore).toBeGreaterThan(0)
      expect(result.directImpact).toBeGreaterThan(0)
      expect(result.secondOrderEffects).toBeGreaterThan(0)
      expect(result.riskManagement).toBeGreaterThan(0)
      expect(result.timeEfficiency).toBeGreaterThan(0)
      expect(result.breakdown).toHaveLength(4)
    })

    it('should handle empty decisions array', () => {
      const result = calculator.calculateOutcomes([], [], [])

      expect(result.totalScore).toBe(10) // Only time efficiency contributes (0.1 weight * 100)
      expect(result.directImpact).toBe(0)
      expect(result.secondOrderEffects).toBe(0)
      expect(result.riskManagement).toBe(0)
      expect(result.timeEfficiency).toBe(100)
    })

    it('should round scores to 2 decimal places', () => {
      const timeTakenMs = [45000]
      const timeLimitsMs = [60000]

      const result = calculator.calculateOutcomes([mockDecisions[0]], timeTakenMs, timeLimitsMs)

      // Check that scores have at most 2 decimal places (allowing for floating point precision)
      expect(Math.abs(result.totalScore - Math.round(result.totalScore * 100) / 100)).toBeLessThan(0.001)
      expect(Math.abs(result.directImpact - Math.round(result.directImpact * 100) / 100)).toBeLessThan(0.001)
    })
  })

  describe('direct impact calculation', () => {
    it('should calculate direct impact from immediate consequences', () => {
      const singleDecision = [mockDecisions[0]] // Has direct consequences with scores 80 and 60
      const result = calculator.calculateOutcomes(singleDecision, [30000], [60000])

      // Expected: (80 * 0.9 + 60 * 0.8) / (0.9 + 0.8) = (72 + 48) / 1.7 = 70.59
      expect(result.directImpact).toBeCloseTo(70.59, 1)
    })

    it('should handle decisions with no direct consequences', () => {
      const decisionWithoutDirect: Decision = {
        id: 'd4',
        text: 'Planning decision',
        consequences: [
          {
            id: 'c8',
            type: 'second-order',
            description: 'Future planning benefit',
            impact_score: 50,
            probability: 0.7
          }
        ],
        nextStateId: 'state5',
        riskLevel: 'low'
      }

      const result = calculator.calculateOutcomes([decisionWithoutDirect], [30000], [60000])
      expect(result.directImpact).toBe(0)
    })
  })

  describe('second-order effects calculation', () => {
    it('should calculate second-order effects with cascade multiplier', () => {
      const result = calculator.calculateOutcomes(mockDecisions, [30000, 30000, 30000], [60000, 60000, 60000])

      expect(result.secondOrderEffects).toBeGreaterThan(0)
      // Should be higher than direct impact due to cascade effects
    })

    it('should apply cascade multiplier for multiple decisions', () => {
      const twoDecisions = [mockDecisions[0], mockDecisions[1]]
      const result = calculator.calculateOutcomes(twoDecisions, [30000, 30000], [60000, 60000])

      // Second decision should have higher impact due to cascade multiplier
      expect(result.secondOrderEffects).toBeGreaterThan(0)
    })
  })

  describe('risk management calculation', () => {
    it('should score risk management based on decision risk levels', () => {
      const result = calculator.calculateOutcomes(mockDecisions, [30000, 30000, 30000], [60000, 60000, 60000])

      // Mix of high, medium, low risk should give moderate score
      expect(result.riskManagement).toBeGreaterThan(50)
      expect(result.riskManagement).toBeLessThan(90)
    })

    it('should penalize consistently high risk decisions', () => {
      const highRiskDecisions = mockDecisions.map(d => ({ ...d, riskLevel: 'high' as const }))
      const result = calculator.calculateOutcomes(highRiskDecisions, [30000, 30000, 30000], [60000, 60000, 60000])

      expect(result.riskManagement).toBeLessThan(50) // Should be penalized
    })

    it('should penalize consistently low risk decisions', () => {
      const lowRiskDecisions = mockDecisions.map(d => ({ ...d, riskLevel: 'low' as const }))
      const result = calculator.calculateOutcomes(lowRiskDecisions, [30000, 30000, 30000], [60000, 60000, 60000])

      expect(result.riskManagement).toBeLessThan(90) // Should be somewhat penalized
    })
  })

  describe('time efficiency calculation', () => {
    it('should reward optimal timing (60-80% of time limit)', () => {
      const optimalTimes = [42000, 48000] // 70% and 80% of 60s limit
      const result = calculator.calculateOutcomes([mockDecisions[0], mockDecisions[1]], optimalTimes, [60000, 60000])

      expect(result.timeEfficiency).toBeGreaterThan(90)
    })

    it('should penalize rushed decisions (< 60% of time limit)', () => {
      const rushedTimes = [20000, 25000] // 33% and 42% of 60s limit
      const result = calculator.calculateOutcomes([mockDecisions[0], mockDecisions[1]], rushedTimes, [60000, 60000])

      expect(result.timeEfficiency).toBeLessThan(90)
    })

    it('should penalize slow decisions (> 100% of time limit)', () => {
      const slowTimes = [70000, 80000] // 117% and 133% of 60s limit
      const result = calculator.calculateOutcomes([mockDecisions[0], mockDecisions[1]], slowTimes, [60000, 60000])

      expect(result.timeEfficiency).toBeLessThan(70)
    })

    it('should handle decisions without time limits', () => {
      const result = calculator.calculateOutcomes([mockDecisions[0]], [30000], [0])

      expect(result.timeEfficiency).toBe(100) // No time limit = perfect score
    })
  })

  describe('score breakdown generation', () => {
    it('should generate breakdown for all categories', () => {
      const result = calculator.calculateOutcomes(mockDecisions, [30000, 30000, 30000], [60000, 60000, 60000])

      expect(result.breakdown).toHaveLength(4)
      
      const categories = result.breakdown.map(b => b.category)
      expect(categories).toContain('Direct Impact')
      expect(categories).toContain('Second-Order Effects')
      expect(categories).toContain('Risk Management')
      expect(categories).toContain('Time Efficiency')
    })

    it('should provide explanations and suggestions for each category', () => {
      const result = calculator.calculateOutcomes(mockDecisions, [30000, 30000, 30000], [60000, 60000, 60000])

      for (const breakdown of result.breakdown) {
        expect(breakdown.explanation).toBeTruthy()
        expect(breakdown.improvementSuggestions).toBeInstanceOf(Array)
        expect(breakdown.score).toBeGreaterThanOrEqual(0)
        expect(breakdown.score).toBeLessThanOrEqual(100)
        expect(breakdown.maxScore).toBe(100)
      }
    })
  })

  describe('consequence severity distribution', () => {
    it('should categorize consequences by severity', () => {
      const distribution = calculator.getConsequenceSeverityDistribution(mockDecisions)

      expect(distribution.low).toBeGreaterThanOrEqual(0)
      expect(distribution.medium).toBeGreaterThanOrEqual(0)
      expect(distribution.high).toBeGreaterThanOrEqual(0)
      expect(distribution.critical).toBeGreaterThanOrEqual(0)

      // Total should equal total consequences
      const total = distribution.low + distribution.medium + distribution.high + distribution.critical
      const expectedTotal = mockDecisions.reduce((sum, d) => sum + d.consequences.length, 0)
      expect(total).toBe(expectedTotal)
    })

    it('should correctly categorize severity levels', () => {
      const testDecisions: Decision[] = [
        {
          id: 'test',
          text: 'Test decision',
          consequences: [
            { id: '1', type: 'direct', description: 'Low', impact_score: 20, probability: 1 },
            { id: '2', type: 'direct', description: 'Medium', impact_score: 50, probability: 1 },
            { id: '3', type: 'direct', description: 'High', impact_score: 70, probability: 1 },
            { id: '4', type: 'direct', description: 'Critical', impact_score: 90, probability: 1 }
          ],
          nextStateId: 'next',
          riskLevel: 'medium'
        }
      ]

      const distribution = calculator.getConsequenceSeverityDistribution(testDecisions)

      expect(distribution.low).toBe(1)
      expect(distribution.medium).toBe(1)
      expect(distribution.high).toBe(1)
      expect(distribution.critical).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('should handle decisions with zero probability consequences', () => {
      const zeroProb: Decision = {
        id: 'zero',
        text: 'Zero probability',
        consequences: [
          {
            id: 'zero-c',
            type: 'direct',
            description: 'Never happens',
            impact_score: 100,
            probability: 0
          }
        ],
        nextStateId: 'next',
        riskLevel: 'low'
      }

      const result = calculator.calculateOutcomes([zeroProb], [30000], [60000])
      expect(result.directImpact).toBe(0)
    })

    it('should handle mismatched time arrays', () => {
      const result = calculator.calculateOutcomes(
        [mockDecisions[0]], 
        [30000, 40000], // More times than decisions
        [60000] // Fewer limits than times
      )

      expect(result).toBeDefined()
      expect(result.timeEfficiency).toBeGreaterThan(0)
    })
  })
})