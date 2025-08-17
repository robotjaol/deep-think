import { 
  Decision, 
  SessionDecision, 
  Consequence, 
  ScenarioState,
  Character 
} from '../types'

/**
 * ImpactAnalyzer evaluates decision consequences and their cascading effects
 */
export class ImpactAnalyzer {
  /**
   * Analyze the comprehensive impact of a decision within scenario context
   */
  analyzeDecisionImpact(
    decision: SessionDecision,
    scenarioContext: ScenarioState,
    previousDecisions: SessionDecision[] = []
  ): DecisionImpactAnalysis {
    const stakeholderImpact = this.analyzeStakeholderImpact(decision, scenarioContext)
    const cascadeAnalysis = this.analyzeCascadingEffects(decision, previousDecisions)
    const riskAssessment = this.assessDecisionRisk(decision, scenarioContext)
    const timelineImpact = this.analyzeTimelineImpact(decision)
    const contextualFactors = this.analyzeContextualFactors(decision, scenarioContext)

    return {
      decisionId: decision.id,
      overallImpactScore: this.calculateOverallImpact(decision),
      stakeholderImpact,
      cascadeAnalysis,
      riskAssessment,
      timelineImpact,
      contextualFactors,
      improvementOpportunities: this.identifyImprovementOpportunities(
        decision, 
        scenarioContext, 
        stakeholderImpact,
        cascadeAnalysis
      )
    }
  }

  /**
   * Analyze impact on different stakeholder groups
   */
  private analyzeStakeholderImpact(
    decision: SessionDecision,
    scenarioContext: ScenarioState
  ): StakeholderImpactAnalysis {
    const stakeholderGroups = this.identifyStakeholderGroups(scenarioContext)
    const impactByGroup: Record<string, StakeholderGroupImpact> = {}

    for (const group of stakeholderGroups) {
      const relevantConsequences = decision.consequences.filter(c => 
        this.isConsequenceRelevantToStakeholder(c, group)
      )

      impactByGroup[group.name] = {
        groupName: group.name,
        impactScore: this.calculateStakeholderGroupImpact(relevantConsequences),
        affectedMembers: group.members,
        primaryConcerns: group.primaryConcerns,
        consequences: relevantConsequences,
        mitigationPotential: this.assessMitigationPotential(relevantConsequences, group)
      }
    }

    return {
      totalStakeholders: stakeholderGroups.reduce((sum, g) => sum + g.members, 0),
      impactByGroup,
      mostAffectedGroup: this.findMostAffectedGroup(impactByGroup),
      crossGroupEffects: this.analyzeCrossGroupEffects(decision.consequences, stakeholderGroups)
    }
  }

  /**
   * Analyze cascading effects and chain reactions
   */
  private analyzeCascadingEffects(
    decision: SessionDecision,
    previousDecisions: SessionDecision[]
  ): CascadeAnalysis {
    const directEffects = decision.consequences.filter(c => c.type === 'direct')
    const secondOrderEffects = decision.consequences.filter(c => c.type === 'second-order')
    
    const cascadeChains = this.identifyCascadeChains(decision, previousDecisions)
    const amplificationFactors = this.calculateAmplificationFactors(decision, previousDecisions)
    const compoundingEffects = this.identifyCompoundingEffects(decision, previousDecisions)

    return {
      directEffectsCount: directEffects.length,
      secondOrderEffectsCount: secondOrderEffects.length,
      cascadeChains,
      amplificationFactors,
      compoundingEffects,
      cascadeRiskScore: this.calculateCascadeRiskScore(cascadeChains, amplificationFactors),
      mitigationStrategies: this.suggestCascadeMitigation(cascadeChains)
    }
  }

  /**
   * Assess decision risk across multiple dimensions
   */
  private assessDecisionRisk(
    decision: SessionDecision,
    scenarioContext: ScenarioState
  ): RiskAssessment {
    const probabilityRisk = this.assessProbabilityRisk(decision.consequences)
    const magnitudeRisk = this.assessMagnitudeRisk(decision.consequences)
    const timeRisk = this.assessTimeRisk(decision, scenarioContext)
    const uncertaintyRisk = this.assessUncertaintyRisk(decision.consequences)
    const reversibilityRisk = this.assessReversibilityRisk(decision.consequences)

    return {
      overallRiskLevel: this.calculateOverallRiskLevel([
        probabilityRisk, magnitudeRisk, timeRisk, uncertaintyRisk, reversibilityRisk
      ]),
      riskDimensions: {
        probability: probabilityRisk,
        magnitude: magnitudeRisk,
        timing: timeRisk,
        uncertainty: uncertaintyRisk,
        reversibility: reversibilityRisk
      },
      riskMitigationSuggestions: this.generateRiskMitigationSuggestions(decision),
      contingencyPlanning: this.suggestContingencyPlanning(decision.consequences)
    }
  }

  /**
   * Analyze timeline and temporal impact patterns
   */
  private analyzeTimelineImpact(decision: SessionDecision): TimelineImpactAnalysis {
    const immediateEffects = decision.consequences.filter(c => !c.delay_minutes || c.delay_minutes <= 5)
    const shortTermEffects = decision.consequences.filter(c => c.delay_minutes && c.delay_minutes > 5 && c.delay_minutes <= 60)
    const longTermEffects = decision.consequences.filter(c => c.delay_minutes && c.delay_minutes > 60)

    return {
      immediateImpact: {
        count: immediateEffects.length,
        averageScore: this.calculateAverageImpactScore(immediateEffects),
        criticalEffects: immediateEffects.filter(c => c.impact_score > 70)
      },
      shortTermImpact: {
        count: shortTermEffects.length,
        averageScore: this.calculateAverageImpactScore(shortTermEffects),
        peakImpactTime: this.findPeakImpactTime(shortTermEffects)
      },
      longTermImpact: {
        count: longTermEffects.length,
        averageScore: this.calculateAverageImpactScore(longTermEffects),
        sustainedEffects: longTermEffects.filter(c => c.impact_score > 50)
      },
      temporalPattern: this.identifyTemporalPattern(decision.consequences)
    }
  }

  /**
   * Analyze contextual factors affecting decision impact
   */
  private analyzeContextualFactors(
    decision: SessionDecision,
    scenarioContext: ScenarioState
  ): ContextualFactorAnalysis {
    return {
      scenarioComplexity: this.assessScenarioComplexity(scenarioContext),
      environmentalPressure: this.assessEnvironmentalPressure(scenarioContext),
      resourceConstraints: this.assessResourceConstraints(scenarioContext),
      stakeholderDynamics: this.assessStakeholderDynamics(scenarioContext),
      timeConstraints: this.assessTimeConstraints(decision, scenarioContext),
      informationAvailability: this.assessInformationAvailability(scenarioContext),
      contextualRiskFactors: this.identifyContextualRiskFactors(scenarioContext)
    }
  }

  // Helper methods for stakeholder analysis
  private identifyStakeholderGroups(scenarioContext: ScenarioState): StakeholderGroup[] {
    const groups: StakeholderGroup[] = []
    
    // Extract stakeholder groups from characters and context
    const characters = scenarioContext.characters || []
    const characterGroups = this.groupCharactersByRole(characters)
    
    for (const [role, chars] of Object.entries(characterGroups)) {
      groups.push({
        name: role,
        members: chars.length,
        primaryConcerns: this.inferPrimaryConcerns(role, chars),
        influenceLevel: this.assessInfluenceLevel(role, chars)
      })
    }

    // Add implicit stakeholder groups based on scenario context
    const implicitGroups = this.identifyImplicitStakeholders(scenarioContext)
    groups.push(...implicitGroups)

    return groups
  }

  private groupCharactersByRole(characters: Character[]): Record<string, Character[]> {
    return characters.reduce((groups, char) => {
      const role = char.role || 'General Staff'
      if (!groups[role]) groups[role] = []
      groups[role].push(char)
      return groups
    }, {} as Record<string, Character[]>)
  }

  private inferPrimaryConcerns(role: string, characters: Character[]): string[] {
    const concernMap: Record<string, string[]> = {
      'Executive': ['Strategic outcomes', 'Organizational reputation', 'Financial impact'],
      'Manager': ['Team safety', 'Operational continuity', 'Resource allocation'],
      'Technical': ['System integrity', 'Data security', 'Technical feasibility'],
      'Customer Service': ['Customer satisfaction', 'Service quality', 'Communication'],
      'General Staff': ['Job security', 'Work environment', 'Clear direction']
    }
    
    return concernMap[role] || ['General welfare', 'Clear communication', 'Fair treatment']
  }

  private assessInfluenceLevel(role: string, characters: Character[]): 'low' | 'medium' | 'high' {
    const influenceMap: Record<string, 'low' | 'medium' | 'high'> = {
      'Executive': 'high',
      'Manager': 'medium',
      'Technical': 'medium',
      'Customer Service': 'low',
      'General Staff': 'low'
    }
    
    return influenceMap[role] || 'low'
  }

  private identifyImplicitStakeholders(scenarioContext: ScenarioState): StakeholderGroup[] {
    const groups: StakeholderGroup[] = []
    
    // Only add implicit stakeholders if there are very few explicit ones
    const explicitCharacterCount = scenarioContext.characters?.length || 0
    
    if (explicitCharacterCount < 2) {
      // Add customers if not explicitly represented
      if (!scenarioContext.characters?.some(c => c.role.toLowerCase().includes('customer'))) {
        groups.push({
          name: 'Customers',
          members: 100, // Estimated
          primaryConcerns: ['Service availability', 'Data security', 'Communication'],
          influenceLevel: 'high'
        })
      }

      // Add regulatory bodies for certain domains
      if (scenarioContext.context.toLowerCase().includes('healthcare') || 
          scenarioContext.context.toLowerCase().includes('finance')) {
        groups.push({
          name: 'Regulatory Bodies',
          members: 5,
          primaryConcerns: ['Compliance', 'Public safety', 'Transparency'],
          influenceLevel: 'high'
        })
      }
    }

    return groups
  }

  // Helper methods for cascade analysis
  private identifyCascadeChains(
    decision: SessionDecision,
    previousDecisions: SessionDecision[]
  ): CascadeChain[] {
    const chains: CascadeChain[] = []
    
    for (const consequence of decision.consequences) {
      const chain = this.traceCascadeChain(consequence, decision, previousDecisions)
      if (chain.length > 1) {
        chains.push({
          initiatingConsequence: consequence,
          chainLength: chain.length,
          totalImpact: chain.reduce((sum, c) => sum + c.impact_score, 0),
          criticalLinks: chain.filter(c => c.impact_score > 70)
        })
      }
    }
    
    return chains
  }

  private traceCascadeChain(
    consequence: Consequence,
    currentDecision: SessionDecision,
    previousDecisions: SessionDecision[]
  ): Consequence[] {
    // Simplified cascade tracing - in production, this would use more sophisticated analysis
    const chain = [consequence]
    
    // Look for related consequences in the same decision
    const relatedConsequences = currentDecision.consequences.filter(c => 
      c.id !== consequence.id && 
      c.type === 'second-order' &&
      c.delay_minutes && c.delay_minutes > (consequence.delay_minutes || 0)
    )
    
    chain.push(...relatedConsequences.slice(0, 2)) // Limit chain length for simplicity
    
    return chain
  }

  private calculateAmplificationFactors(
    decision: SessionDecision,
    previousDecisions: SessionDecision[]
  ): AmplificationFactor[] {
    const factors: AmplificationFactor[] = []
    
    // Analyze how previous decisions amplify current decision impact
    for (const prevDecision of previousDecisions.slice(-3)) { // Last 3 decisions
      const amplification = this.calculateDecisionAmplification(decision, prevDecision)
      if (amplification.factor > 1.1) {
        factors.push(amplification)
      }
    }
    
    return factors
  }

  private calculateDecisionAmplification(
    currentDecision: SessionDecision,
    previousDecision: SessionDecision
  ): AmplificationFactor {
    // Simplified amplification calculation
    const sharedKeywords = this.findSharedConsequenceKeywords(
      currentDecision.consequences,
      previousDecision.consequences
    )
    
    const factor = 1 + (sharedKeywords.length * 0.2)
    
    return {
      sourceDecisionId: previousDecision.id,
      factor,
      mechanism: sharedKeywords.length > 0 ? 'Compounding effects' : 'Independent',
      sharedElements: sharedKeywords
    }
  }

  private findSharedConsequenceKeywords(
    consequences1: Consequence[],
    consequences2: Consequence[]
  ): string[] {
    // Extract keywords from consequence descriptions
    const keywords1 = this.extractKeywords(consequences1.map(c => c.description).join(' '))
    const keywords2 = this.extractKeywords(consequences2.map(c => c.description).join(' '))
    
    return keywords1.filter(k => keywords2.includes(k))
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, use NLP libraries
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'will', 'have', 'been'].includes(word))
      .slice(0, 10)
  }

  // Risk assessment helper methods
  private assessProbabilityRisk(consequences: Consequence[]): RiskLevel {
    const avgProbability = consequences.reduce((sum, c) => sum + c.probability, 0) / consequences.length
    if (avgProbability > 0.8) return 'high'
    if (avgProbability > 0.5) return 'medium'
    return 'low'
  }

  private assessMagnitudeRisk(consequences: Consequence[]): RiskLevel {
    const maxImpact = Math.max(...consequences.map(c => c.impact_score))
    if (maxImpact > 80) return 'high'
    if (maxImpact > 50) return 'medium'
    return 'low'
  }

  private assessTimeRisk(decision: SessionDecision, scenarioContext: ScenarioState): RiskLevel {
    const timeLimit = scenarioContext.timeLimit || 300000 // 5 minutes default
    const timePressure = decision.time_taken_ms / timeLimit
    
    if (timePressure > 0.8) return 'high'
    if (timePressure > 0.6) return 'medium'
    return 'low'
  }

  private assessUncertaintyRisk(consequences: Consequence[]): RiskLevel {
    const uncertainConsequences = consequences.filter(c => c.probability < 0.7).length
    const uncertaintyRatio = uncertainConsequences / consequences.length
    
    if (uncertaintyRatio > 0.6) return 'high'
    if (uncertaintyRatio > 0.3) return 'medium'
    return 'low'
  }

  private assessReversibilityRisk(consequences: Consequence[]): RiskLevel {
    // Assess based on consequence descriptions - simplified approach
    const irreversibleKeywords = ['permanent', 'irreversible', 'destroyed', 'lost', 'terminated']
    const irreversibleCount = consequences.filter(c => 
      irreversibleKeywords.some(keyword => c.description.toLowerCase().includes(keyword))
    ).length
    
    if (irreversibleCount > consequences.length * 0.5) return 'high'
    if (irreversibleCount > 0) return 'medium'
    return 'low'
  }

  private calculateOverallRiskLevel(riskLevels: RiskLevel[]): RiskLevel {
    const riskScores = { low: 1, medium: 2, high: 3 }
    const avgScore = riskLevels.reduce((sum, level) => sum + riskScores[level], 0) / riskLevels.length
    
    if (avgScore >= 2.5) return 'high'
    if (avgScore >= 1.5) return 'medium'
    return 'low'
  }

  // Utility methods
  private calculateOverallImpact(decision: SessionDecision): number {
    if (decision.consequences.length === 0) return 0
    return decision.consequences.reduce((sum, c) => sum + c.impact_score * c.probability, 0) / decision.consequences.length
  }

  private calculateAverageImpactScore(consequences: Consequence[]): number {
    if (consequences.length === 0) return 0
    return consequences.reduce((sum, c) => sum + c.impact_score, 0) / consequences.length
  }

  private findPeakImpactTime(consequences: Consequence[]): number {
    if (consequences.length === 0) return 0
    return consequences.reduce((max, c) => 
      c.impact_score > max.impact_score ? c : max
    ).delay_minutes || 0
  }

  private identifyTemporalPattern(consequences: Consequence[]): 'immediate' | 'gradual' | 'delayed' | 'mixed' {
    const immediate = consequences.filter(c => !c.delay_minutes || c.delay_minutes <= 5).length
    const delayed = consequences.filter(c => c.delay_minutes && c.delay_minutes > 30).length
    const total = consequences.length
    
    if (immediate / total > 0.8) return 'immediate'
    if (delayed / total > 0.8) return 'delayed'
    if (immediate > 0 && delayed > 0) return 'mixed'
    return 'gradual'
  }

  // Contextual analysis methods
  private assessScenarioComplexity(scenarioContext: ScenarioState): 'low' | 'medium' | 'high' {
    const factors = [
      scenarioContext.decisions.length,
      scenarioContext.characters?.length || 0,
      scenarioContext.environmentalFactors?.length || 0
    ]
    
    const complexityScore = factors.reduce((sum, f) => sum + f, 0)
    
    if (complexityScore > 15) return 'high'
    if (complexityScore > 8) return 'medium'
    return 'low'
  }

  private assessEnvironmentalPressure(scenarioContext: ScenarioState): 'low' | 'medium' | 'high' {
    const pressureKeywords = ['urgent', 'critical', 'emergency', 'crisis', 'immediate']
    const pressureCount = pressureKeywords.filter(keyword => 
      scenarioContext.description.toLowerCase().includes(keyword) ||
      scenarioContext.context.toLowerCase().includes(keyword)
    ).length
    
    if (pressureCount > 2) return 'high'
    if (pressureCount > 0) return 'medium'
    return 'low'
  }

  private assessResourceConstraints(scenarioContext: ScenarioState): 'low' | 'medium' | 'high' {
    const constraintKeywords = ['limited', 'shortage', 'insufficient', 'constrained', 'budget']
    const constraintCount = constraintKeywords.filter(keyword => 
      scenarioContext.description.toLowerCase().includes(keyword) ||
      scenarioContext.context.toLowerCase().includes(keyword)
    ).length
    
    if (constraintCount > 2) return 'high'
    if (constraintCount > 0) return 'medium'
    return 'low'
  }

  private assessStakeholderDynamics(scenarioContext: ScenarioState): 'simple' | 'moderate' | 'complex' {
    const characterCount = scenarioContext.characters?.length || 0
    const uniqueRoles = new Set(scenarioContext.characters?.map(c => c.role) || []).size
    
    if (characterCount >= 4 && uniqueRoles >= 3) return 'complex'
    if (characterCount >= 3 && uniqueRoles >= 2) return 'complex'
    if (characterCount >= 2 || uniqueRoles >= 2) return 'moderate'
    return 'simple'
  }

  private assessTimeConstraints(decision: SessionDecision, scenarioContext: ScenarioState): 'relaxed' | 'moderate' | 'tight' {
    const timeLimit = scenarioContext.timeLimit || 300000
    const timePressure = decision.time_taken_ms / timeLimit
    
    if (timePressure > 0.8) return 'tight'
    if (timePressure > 0.5) return 'moderate'
    return 'relaxed'
  }

  private assessInformationAvailability(scenarioContext: ScenarioState): 'complete' | 'partial' | 'limited' {
    const infoKeywords = ['unknown', 'unclear', 'uncertain', 'missing', 'incomplete']
    const infoGaps = infoKeywords.filter(keyword => 
      scenarioContext.description.toLowerCase().includes(keyword) ||
      scenarioContext.context.toLowerCase().includes(keyword)
    ).length
    
    if (infoGaps > 2) return 'limited'
    if (infoGaps > 0) return 'partial'
    return 'complete'
  }

  private identifyContextualRiskFactors(scenarioContext: ScenarioState): string[] {
    const riskFactors: string[] = []
    
    if (scenarioContext.riskLevel === 'high') riskFactors.push('High baseline risk scenario')
    if (scenarioContext.criticalityScore > 80) riskFactors.push('Critical system impact potential')
    if (scenarioContext.timeLimit && scenarioContext.timeLimit < 120000) riskFactors.push('Severe time constraints')
    if (scenarioContext.environmentalFactors?.length && scenarioContext.environmentalFactors.length > 3) {
      riskFactors.push('Multiple environmental stressors')
    }
    
    return riskFactors
  }

  // Improvement opportunity identification
  private identifyImprovementOpportunities(
    decision: SessionDecision,
    scenarioContext: ScenarioState,
    stakeholderImpact: StakeholderImpactAnalysis,
    cascadeAnalysis: CascadeAnalysis
  ): ImprovementOpportunity[] {
    const opportunities: ImprovementOpportunity[] = []
    
    // Stakeholder consideration opportunities
    if (stakeholderImpact.mostAffectedGroup && stakeholderImpact.impactByGroup[stakeholderImpact.mostAffectedGroup].impactScore < 40) {
      opportunities.push({
        category: 'Stakeholder Management',
        description: `Consider the impact on ${stakeholderImpact.mostAffectedGroup} more carefully`,
        priority: 'high',
        actionableSteps: [
          `Analyze ${stakeholderImpact.mostAffectedGroup} primary concerns before deciding`,
          'Develop stakeholder communication strategy',
          'Consider alternative approaches that better serve this group'
        ]
      })
    }

    // Cascade mitigation opportunities
    if (cascadeAnalysis.cascadeRiskScore > 70) {
      opportunities.push({
        category: 'Risk Mitigation',
        description: 'High cascade risk detected - implement preventive measures',
        priority: 'high',
        actionableSteps: [
          'Identify cascade interruption points',
          'Develop contingency plans for high-risk chains',
          'Monitor early warning indicators'
        ]
      })
    }

    // Time management opportunities
    const timeEfficiency = this.calculateTimeEfficiency(decision, scenarioContext)
    if (timeEfficiency < 80) {
      opportunities.push({
        category: 'Time Management',
        description: 'Improve decision timing and time allocation',
        priority: 'medium',
        actionableSteps: [
          'Practice rapid decision-making frameworks',
          'Identify decisions that require immediate vs deliberate response',
          'Develop time-boxing strategies for complex decisions'
        ]
      })
    }

    return opportunities
  }

  private calculateTimeEfficiency(decision: SessionDecision, scenarioContext: ScenarioState): number {
    const timeLimit = scenarioContext.timeLimit || 300000
    const timeTaken = decision.time_taken_ms
    const ratio = timeTaken / timeLimit
    
    if (ratio <= 0.6) return 70 // Too fast
    if (ratio <= 0.8) return 90 // Good
    if (ratio <= 1.0) return 100 // Optimal
    return Math.max(30, 100 - (ratio - 1.0) * 50) // Too slow
  }

  // Additional helper methods
  private isConsequenceRelevantToStakeholder(consequence: Consequence, group: StakeholderGroup): boolean {
    const relevantKeywords = group.primaryConcerns.map(c => c.toLowerCase().split(' ')).flat()
    const consequenceText = consequence.description.toLowerCase()
    
    return relevantKeywords.some(keyword => consequenceText.includes(keyword))
  }

  private calculateStakeholderGroupImpact(consequences: Consequence[]): number {
    if (consequences.length === 0) return 0
    return consequences.reduce((sum, c) => sum + c.impact_score * c.probability, 0) / consequences.length
  }

  private assessMitigationPotential(consequences: Consequence[], group: StakeholderGroup): 'low' | 'medium' | 'high' {
    // Simplified assessment based on group influence and consequence reversibility
    if (group.influenceLevel === 'high' && consequences.some(c => c.impact_score < 70)) return 'high'
    if (group.influenceLevel === 'medium') return 'medium'
    return 'low'
  }

  private findMostAffectedGroup(impactByGroup: Record<string, StakeholderGroupImpact>): string {
    return Object.entries(impactByGroup).reduce((max, [name, impact]) => 
      impact.impactScore > (impactByGroup[max]?.impactScore || 0) ? name : max
    , Object.keys(impactByGroup)[0] || '')
  }

  private analyzeCrossGroupEffects(consequences: Consequence[], groups: StakeholderGroup[]): string[] {
    // Simplified cross-group effect analysis
    const effects: string[] = []
    
    if (groups.length > 2 && consequences.some(c => c.impact_score > 60)) {
      effects.push('Multi-stakeholder impact detected')
    }
    
    if (consequences.filter(c => c.type === 'second-order').length > 2) {
      effects.push('Cascading effects across stakeholder boundaries')
    }
    
    return effects
  }

  private identifyCompoundingEffects(
    decision: SessionDecision,
    previousDecisions: SessionDecision[]
  ): CompoundingEffect[] {
    const effects: CompoundingEffect[] = []
    
    // Look for similar consequence patterns in recent decisions
    for (const prevDecision of previousDecisions.slice(-2)) {
      const sharedKeywords = this.findSharedConsequenceKeywords(
        decision.consequences,
        prevDecision.consequences
      )
      
      if (sharedKeywords.length > 0) {
        effects.push({
          sourceDecisionId: prevDecision.id,
          compoundingFactor: 1 + (sharedKeywords.length * 0.3),
          sharedElements: sharedKeywords,
          description: `Compounding effects from similar consequences in previous decision`
        })
      }
    }
    
    return effects
  }

  private calculateCascadeRiskScore(chains: CascadeChain[], amplificationFactors: AmplificationFactor[]): number {
    const chainRisk = chains.reduce((sum, chain) => sum + (chain.totalImpact / chain.chainLength), 0)
    const amplificationRisk = amplificationFactors.reduce((sum, factor) => sum + (factor.factor - 1) * 20, 0)
    
    return Math.min(100, chainRisk + amplificationRisk)
  }

  private suggestCascadeMitigation(chains: CascadeChain[]): string[] {
    const suggestions: string[] = []
    
    if (chains.length > 0) {
      suggestions.push('Implement cascade interruption strategies at critical decision points')
      suggestions.push('Monitor early warning indicators for cascade initiation')
      suggestions.push('Develop rapid response protocols for cascade mitigation')
    }
    
    return suggestions
  }

  private generateRiskMitigationSuggestions(decision: SessionDecision): string[] {
    const suggestions: string[] = []
    const highImpactConsequences = decision.consequences.filter(c => c.impact_score > 70)
    
    if (highImpactConsequences.length > 0) {
      suggestions.push('Develop contingency plans for high-impact consequences')
      suggestions.push('Implement monitoring systems for early detection of negative outcomes')
    }
    
    const uncertainConsequences = decision.consequences.filter(c => c.probability < 0.6)
    if (uncertainConsequences.length > 0) {
      suggestions.push('Gather additional information to reduce uncertainty')
      suggestions.push('Consider pilot testing or phased implementation')
    }
    
    return suggestions
  }

  private suggestContingencyPlanning(consequences: Consequence[]): string[] {
    const suggestions: string[] = []
    const criticalConsequences = consequences.filter(c => c.impact_score > 80)
    
    if (criticalConsequences.length > 0) {
      suggestions.push('Develop specific response plans for critical consequences')
      suggestions.push('Identify decision reversal or modification triggers')
      suggestions.push('Establish rapid response teams for critical outcomes')
    }
    
    return suggestions
  }
}

// Type definitions for analysis results
export interface DecisionImpactAnalysis {
  decisionId: string
  overallImpactScore: number
  stakeholderImpact: StakeholderImpactAnalysis
  cascadeAnalysis: CascadeAnalysis
  riskAssessment: RiskAssessment
  timelineImpact: TimelineImpactAnalysis
  contextualFactors: ContextualFactorAnalysis
  improvementOpportunities: ImprovementOpportunity[]
}

export interface StakeholderImpactAnalysis {
  totalStakeholders: number
  impactByGroup: Record<string, StakeholderGroupImpact>
  mostAffectedGroup: string
  crossGroupEffects: string[]
}

export interface StakeholderGroup {
  name: string
  members: number
  primaryConcerns: string[]
  influenceLevel: 'low' | 'medium' | 'high'
}

export interface StakeholderGroupImpact {
  groupName: string
  impactScore: number
  affectedMembers: number
  primaryConcerns: string[]
  consequences: Consequence[]
  mitigationPotential: 'low' | 'medium' | 'high'
}

export interface CascadeAnalysis {
  directEffectsCount: number
  secondOrderEffectsCount: number
  cascadeChains: CascadeChain[]
  amplificationFactors: AmplificationFactor[]
  compoundingEffects: CompoundingEffect[]
  cascadeRiskScore: number
  mitigationStrategies: string[]
}

export interface CascadeChain {
  initiatingConsequence: Consequence
  chainLength: number
  totalImpact: number
  criticalLinks: Consequence[]
}

export interface AmplificationFactor {
  sourceDecisionId: string
  factor: number
  mechanism: string
  sharedElements: string[]
}

export interface CompoundingEffect {
  sourceDecisionId: string
  compoundingFactor: number
  sharedElements: string[]
  description: string
}

export interface RiskAssessment {
  overallRiskLevel: RiskLevel
  riskDimensions: {
    probability: RiskLevel
    magnitude: RiskLevel
    timing: RiskLevel
    uncertainty: RiskLevel
    reversibility: RiskLevel
  }
  riskMitigationSuggestions: string[]
  contingencyPlanning: string[]
}

export interface TimelineImpactAnalysis {
  immediateImpact: {
    count: number
    averageScore: number
    criticalEffects: Consequence[]
  }
  shortTermImpact: {
    count: number
    averageScore: number
    peakImpactTime: number
  }
  longTermImpact: {
    count: number
    averageScore: number
    sustainedEffects: Consequence[]
  }
  temporalPattern: 'immediate' | 'gradual' | 'delayed' | 'mixed'
}

export interface ContextualFactorAnalysis {
  scenarioComplexity: 'low' | 'medium' | 'high'
  environmentalPressure: 'low' | 'medium' | 'high'
  resourceConstraints: 'low' | 'medium' | 'high'
  stakeholderDynamics: 'simple' | 'moderate' | 'complex'
  timeConstraints: 'relaxed' | 'moderate' | 'tight'
  informationAvailability: 'complete' | 'partial' | 'limited'
  contextualRiskFactors: string[]
}

export interface ImprovementOpportunity {
  category: string
  description: string
  priority: 'low' | 'medium' | 'high'
  actionableSteps: string[]
}

export type RiskLevel = 'low' | 'medium' | 'high'