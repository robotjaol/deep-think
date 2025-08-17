import { ImpactAnalyzer } from '../impact-analyzer'
import { SessionDecision, ScenarioState, Consequence, Character } from '../../types'

describe('ImpactAnalyzer', () => {
  let impactAnalyzer: ImpactAnalyzer
  
  beforeEach(() => {
    impactAnalyzer = new ImpactAnalyzer()
  })

  const createMockSessionDecision = (
    id: string,
    consequences: Consequence[],
    timeTakenMs: number = 30000
  ): SessionDecision => ({
    id,
    session_id: 'test-session',
    state_id: 'test-state',
    decision_text: `Test decision ${id}`,
    timestamp: new Date().toISOString(),
    time_taken_ms: timeTakenMs,
    score_impact: 50,
    consequences,
    user_confidence: 70
  })

  const createMockConsequence = (
    type: 'direct' | 'second-order',
    impactScore: number,
    probability: number = 0.8,
    delayMinutes?: number,
    description: string = 'Test consequence'
  ): Consequence => ({
    id: `consequence-${Math.random()}`,
    type,
    description,
    impact_score: impactScore,
    probability,
    delay_minutes: delayMinutes
  })

  const createMockCharacter = (name: string, role: string): Character => ({
    id: `char-${name}`,
    name,
    role,
    personality_traits: ['professional'],
    communication_style: 'direct',
    expertise_areas: ['general']
  })

  const createMockScenarioState = (
    characters: Character[] = [],
    timeLimit: number = 300000
  ): ScenarioState => ({
    id: 'test-state',
    description: 'Test scenario description',
    context: 'Test crisis scenario context',
    decisions: [],
    timeLimit,
    environmentalFactors: ['time pressure', 'resource constraints'],
    characters,
    riskLevel: 'medium',
    criticalityScore: 70
  })

  describe('analyzeDecisionImpact', () => {
    it('should analyze basic decision impact', () => {
      const consequences = [
        createMockConsequence('direct', 80, 0.9, undefined, 'Immediate staff impact'),
        createMockConsequence('second-order', 60, 0.7, 30, 'Long-term reputation impact')
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.decisionId).toBe('1')
      expect(analysis.overallImpactScore).toBeGreaterThan(0)
      expect(analysis.stakeholderImpact).toBeDefined()
      expect(analysis.cascadeAnalysis).toBeDefined()
      expect(analysis.riskAssessment).toBeDefined()
      expect(analysis.timelineImpact).toBeDefined()
      expect(analysis.contextualFactors).toBeDefined()
      expect(analysis.improvementOpportunities).toBeInstanceOf(Array)
    })

    it('should identify stakeholder groups from characters', () => {
      const characters = [
        createMockCharacter('John', 'Executive'),
        createMockCharacter('Jane', 'Manager'),
        createMockCharacter('Bob', 'Technical')
      ]
      const consequences = [
        createMockConsequence('direct', 70, 0.8, undefined, 'Executive decision impact')
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState(characters)
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.stakeholderImpact.totalStakeholders).toBe(3)
      expect(Object.keys(analysis.stakeholderImpact.impactByGroup)).toContain('Executive')
      expect(Object.keys(analysis.stakeholderImpact.impactByGroup)).toContain('Manager')
      expect(Object.keys(analysis.stakeholderImpact.impactByGroup)).toContain('Technical')
    })

    it('should analyze cascade chains', () => {
      const consequences = [
        createMockConsequence('direct', 80, 0.9, undefined, 'System failure'),
        createMockConsequence('second-order', 70, 0.8, 15, 'Customer complaints'),
        createMockConsequence('second-order', 60, 0.7, 60, 'Revenue loss')
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.cascadeAnalysis.directEffectsCount).toBe(1)
      expect(analysis.cascadeAnalysis.secondOrderEffectsCount).toBe(2)
      expect(analysis.cascadeAnalysis.cascadeRiskScore).toBeGreaterThan(0)
    })

    it('should assess risk across multiple dimensions', () => {
      const consequences = [
        createMockConsequence('direct', 90, 0.9, undefined, 'High impact immediate consequence'),
        createMockConsequence('second-order', 80, 0.5, 120, 'Uncertain long-term effect')
      ]
      const decision = createMockSessionDecision('1', consequences, 250000) // Near time limit
      const scenarioContext = createMockScenarioState([], 300000)
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.riskAssessment.overallRiskLevel).toBeDefined()
      expect(analysis.riskAssessment.riskDimensions.probability).toBeDefined()
      expect(analysis.riskAssessment.riskDimensions.magnitude).toBeDefined()
      expect(analysis.riskAssessment.riskDimensions.timing).toBeDefined()
      expect(analysis.riskAssessment.riskDimensions.uncertainty).toBeDefined()
      expect(analysis.riskAssessment.riskDimensions.reversibility).toBeDefined()
    })

    it('should analyze timeline impact patterns', () => {
      const consequences = [
        createMockConsequence('direct', 80, 0.9, 2, 'Immediate effect'),
        createMockConsequence('second-order', 70, 0.8, 30, 'Short-term effect'),
        createMockConsequence('second-order', 60, 0.7, 120, 'Long-term effect')
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.timelineImpact.immediateImpact.count).toBe(1)
      expect(analysis.timelineImpact.shortTermImpact.count).toBe(1)
      expect(analysis.timelineImpact.longTermImpact.count).toBe(1)
      expect(analysis.timelineImpact.temporalPattern).toBe('mixed')
    })

    it('should analyze contextual factors', () => {
      const characters = [
        createMockCharacter('CEO', 'Executive'),
        createMockCharacter('CTO', 'Executive'),
        createMockCharacter('Manager1', 'Manager'),
        createMockCharacter('Manager2', 'Manager')
      ]
      const scenarioContext = createMockScenarioState(characters, 60000) // 1 minute limit
      scenarioContext.description = 'Critical urgent emergency situation with limited resources'
      scenarioContext.context = 'High-pressure crisis with insufficient budget constraints'
      
      const consequences = [createMockConsequence('direct', 70, 0.8)]
      const decision = createMockSessionDecision('1', consequences, 50000)
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.contextualFactors.scenarioComplexity).toBeDefined()
      expect(analysis.contextualFactors.environmentalPressure).toBe('high')
      expect(analysis.contextualFactors.resourceConstraints).toBe('high')
      expect(analysis.contextualFactors.stakeholderDynamics).toBe('complex')
      expect(analysis.contextualFactors.timeConstraints).toBe('tight')
    })
  })

  describe('stakeholder impact analysis', () => {
    it('should identify most affected stakeholder group', () => {
      const characters = [
        createMockCharacter('Manager', 'Manager'),
        createMockCharacter('Staff', 'General Staff')
      ]
      const consequences = [
        createMockConsequence('direct', 90, 0.9, undefined, 'Team safety concerns for staff'),
        createMockConsequence('direct', 40, 0.8, undefined, 'Minor manager impact')
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState(characters)
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.stakeholderImpact.mostAffectedGroup).toBeDefined()
      const mostAffected = analysis.stakeholderImpact.impactByGroup[analysis.stakeholderImpact.mostAffectedGroup]
      expect(mostAffected.impactScore).toBeGreaterThan(0)
    })

    it('should assess mitigation potential based on stakeholder influence', () => {
      const characters = [createMockCharacter('CEO', 'Executive')]
      const consequences = [
        createMockConsequence('direct', 60, 0.8, undefined, 'Strategic outcomes affected')
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState(characters)
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      const executiveGroup = analysis.stakeholderImpact.impactByGroup['Executive']
      expect(executiveGroup.mitigationPotential).toBe('high') // High influence group
    })

    it('should identify cross-group effects', () => {
      const characters = [
        createMockCharacter('Manager', 'Manager'),
        createMockCharacter('Tech', 'Technical'),
        createMockCharacter('Staff', 'General Staff')
      ]
      const consequences = [
        createMockConsequence('direct', 80, 0.9, undefined, 'System-wide impact affecting all teams')
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState(characters)
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.stakeholderImpact.crossGroupEffects.length).toBeGreaterThan(0)
    })
  })

  describe('cascade analysis', () => {
    it('should identify cascade chains with multiple decisions', () => {
      const decision1 = createMockSessionDecision('1', [
        createMockConsequence('direct', 70, 0.8, undefined, 'Initial system impact')
      ])
      const decision2 = createMockSessionDecision('2', [
        createMockConsequence('direct', 60, 0.8, undefined, 'System recovery attempt'),
        createMockConsequence('second-order', 80, 0.7, 30, 'System cascading failure')
      ])
      
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision2, scenarioContext, [decision1])
      
      expect(analysis.cascadeAnalysis.amplificationFactors.length).toBeGreaterThanOrEqual(0)
      expect(analysis.cascadeAnalysis.compoundingEffects.length).toBeGreaterThanOrEqual(0)
    })

    it('should calculate cascade risk score', () => {
      const consequences = [
        createMockConsequence('direct', 80, 0.9, undefined, 'Critical system failure'),
        createMockConsequence('second-order', 90, 0.8, 15, 'Customer data breach'),
        createMockConsequence('second-order', 85, 0.7, 60, 'Regulatory investigation')
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.cascadeAnalysis.cascadeRiskScore).toBeGreaterThan(0)
      expect(analysis.cascadeAnalysis.cascadeRiskScore).toBeLessThanOrEqual(100)
    })

    it('should suggest cascade mitigation strategies', () => {
      const consequences = [
        createMockConsequence('direct', 90, 0.9),
        createMockConsequence('second-order', 80, 0.8, 30),
        createMockConsequence('second-order', 70, 0.7, 90)
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.cascadeAnalysis.mitigationStrategies.length).toBeGreaterThan(0)
      expect(analysis.cascadeAnalysis.mitigationStrategies[0]).toContain('cascade')
    })
  })

  describe('risk assessment', () => {
    it('should assess high probability risk correctly', () => {
      const consequences = [
        createMockConsequence('direct', 70, 0.95), // Very high probability
        createMockConsequence('direct', 60, 0.90)
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.riskAssessment.riskDimensions.probability).toBe('high')
    })

    it('should assess high magnitude risk correctly', () => {
      const consequences = [
        createMockConsequence('direct', 95, 0.7), // Very high impact
        createMockConsequence('direct', 85, 0.6)
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.riskAssessment.riskDimensions.magnitude).toBe('high')
    })

    it('should assess time risk based on decision timing', () => {
      const consequences = [createMockConsequence('direct', 70, 0.8)]
      const decision = createMockSessionDecision('1', consequences, 290000) // Near time limit
      const scenarioContext = createMockScenarioState([], 300000) // 5 minute limit
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.riskAssessment.riskDimensions.timing).toBe('high')
    })

    it('should assess uncertainty risk based on consequence probabilities', () => {
      const consequences = [
        createMockConsequence('direct', 70, 0.3), // Low probability = high uncertainty
        createMockConsequence('second-order', 60, 0.4)
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.riskAssessment.riskDimensions.uncertainty).toBe('high')
    })

    it('should provide risk mitigation suggestions', () => {
      const consequences = [
        createMockConsequence('direct', 90, 0.9), // High impact, high probability
        createMockConsequence('second-order', 80, 0.4) // High impact, uncertain
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.riskAssessment.riskMitigationSuggestions.length).toBeGreaterThan(0)
      expect(analysis.riskAssessment.contingencyPlanning.length).toBeGreaterThan(0)
    })
  })

  describe('improvement opportunities', () => {
    it('should identify stakeholder management opportunities', () => {
      const characters = [createMockCharacter('Manager', 'Manager')]
      const consequences = [
        createMockConsequence('direct', 30, 0.8, undefined, 'Team safety major concern') // Poor impact on managers
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState(characters)
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      const stakeholderOpportunity = analysis.improvementOpportunities.find(
        opp => opp.category === 'Stakeholder Management'
      )
      expect(stakeholderOpportunity).toBeDefined()
      expect(stakeholderOpportunity?.priority).toBe('high')
    })

    it('should identify risk mitigation opportunities for high cascade risk', () => {
      const consequences = [
        createMockConsequence('direct', 90, 0.9),
        createMockConsequence('second-order', 85, 0.8, 15),
        createMockConsequence('second-order', 80, 0.7, 45)
      ]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      const riskOpportunity = analysis.improvementOpportunities.find(
        opp => opp.category === 'Risk Mitigation'
      )
      expect(riskOpportunity).toBeDefined()
      expect(riskOpportunity?.actionableSteps.length).toBeGreaterThan(0)
    })

    it('should identify time management opportunities for poor timing', () => {
      const consequences = [createMockConsequence('direct', 70, 0.8)]
      const decision = createMockSessionDecision('1', consequences, 5000) // Very fast decision
      const scenarioContext = createMockScenarioState([], 300000)
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      const timeOpportunity = analysis.improvementOpportunities.find(
        opp => opp.category === 'Time Management'
      )
      expect(timeOpportunity).toBeDefined()
      expect(timeOpportunity?.priority).toBe('medium')
    })
  })

  describe('edge cases', () => {
    it('should handle decisions with no consequences', () => {
      const decision = createMockSessionDecision('1', [])
      const scenarioContext = createMockScenarioState()
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.overallImpactScore).toBe(0)
      expect(analysis.cascadeAnalysis.directEffectsCount).toBe(0)
      expect(analysis.cascadeAnalysis.secondOrderEffectsCount).toBe(0)
    })

    it('should handle scenarios with no characters', () => {
      const consequences = [createMockConsequence('direct', 70, 0.8)]
      const decision = createMockSessionDecision('1', consequences)
      const scenarioContext = createMockScenarioState([])
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.stakeholderImpact.totalStakeholders).toBeGreaterThan(0) // Should add implicit stakeholders
      expect(Object.keys(analysis.stakeholderImpact.impactByGroup)).toContain('Customers')
    })

    it('should handle extreme time constraints', () => {
      const consequences = [createMockConsequence('direct', 70, 0.8)]
      const decision = createMockSessionDecision('1', consequences, 50000)
      const scenarioContext = createMockScenarioState([], 60000) // 1 minute limit
      
      const analysis = impactAnalyzer.analyzeDecisionImpact(decision, scenarioContext)
      
      expect(analysis.contextualFactors.timeConstraints).toBe('tight')
      expect(analysis.riskAssessment.riskDimensions.timing).toBe('high')
    })
  })
})