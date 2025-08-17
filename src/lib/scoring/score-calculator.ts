import { 
  Decision, 
  SessionDecision, 
  ScoreResult, 
  ScoreBreakdown, 
  Consequence,
  RiskProfile 
} from '../types'

/**
 * ScoreCalculator computes comprehensive scores for user decisions
 * Integrates with OutcomeCalculator for enhanced scoring algorithms
 */
export class ScoreCalculator {
  private readonly DIRECT_IMPACT_WEIGHT = 0.35
  private readonly SECOND_ORDER_WEIGHT = 0.30
  private readonly RISK_MANAGEMENT_WEIGHT = 0.20
  private readonly TIME_EFFICIENCY_WEIGHT = 0.15

  /**
   * Calculate comprehensive score for a training session
   */
  calculateSessionScore(
    sessionDecisions: SessionDecision[],
    userRiskProfile: RiskProfile,
    scenarioDifficulty: number = 1
  ): ScoreResult {
    if (sessionDecisions.length === 0) {
      return this.getEmptyScoreResult()
    }

    const directImpact = this.calculateDirectImpactScore(sessionDecisions)
    const secondOrderEffects = this.calculateSecondOrderScore(sessionDecisions)
    const riskManagement = this.calculateRiskManagementScore(sessionDecisions, userRiskProfile)
    const timeEfficiency = this.calculateTimeEfficiencyScore(sessionDecisions)

    // Apply difficulty multiplier
    const difficultyMultiplier = Math.min(1.5, 1 + (scenarioDifficulty - 1) * 0.1)

    const totalScore = (
      directImpact * this.DIRECT_IMPACT_WEIGHT +
      secondOrderEffects * this.SECOND_ORDER_WEIGHT +
      riskManagement * this.RISK_MANAGEMENT_WEIGHT +
      timeEfficiency * this.TIME_EFFICIENCY_WEIGHT
    ) * difficultyMultiplier

    const breakdown = this.generateDetailedBreakdown(
      directImpact,
      secondOrderEffects,
      riskManagement,
      timeEfficiency,
      sessionDecisions,
      userRiskProfile
    )

    return {
      totalScore: Math.round(Math.min(100, totalScore) * 100) / 100,
      directImpact: Math.round(directImpact * 100) / 100,
      secondOrderEffects: Math.round(secondOrderEffects * 100) / 100,
      riskManagement: Math.round(riskManagement * 100) / 100,
      timeEfficiency: Math.round(timeEfficiency * 100) / 100,
      breakdown,
      percentile: this.calculatePercentile(totalScore)
    }
  }

  /**
   * Calculate direct impact score from immediate consequences
   */
  private calculateDirectImpactScore(sessionDecisions: SessionDecision[]): number {
    let totalWeightedImpact = 0
    let totalWeight = 0

    for (const decision of sessionDecisions) {
      const directConsequences = decision.consequences.filter(c => c.type === 'direct')
      
      for (const consequence of directConsequences) {
        const weight = consequence.probability
        const normalizedImpact = this.normalizeImpactScore(consequence.impact_score)
        
        totalWeightedImpact += normalizedImpact * weight
        totalWeight += weight
      }
    }

    return totalWeight > 0 ? totalWeightedImpact / totalWeight : 50
  }

  /**
   * Calculate second-order effects score with cascade analysis
   */
  private calculateSecondOrderScore(sessionDecisions: SessionDecision[]): number {
    let totalWeightedImpact = 0
    let totalWeight = 0
    let cascadeMultiplier = 1.0

    for (let i = 0; i < sessionDecisions.length; i++) {
      const decision = sessionDecisions[i]
      const secondOrderConsequences = decision.consequences.filter(c => c.type === 'second-order')
      
      for (const consequence of secondOrderConsequences) {
        const weight = consequence.probability * cascadeMultiplier
        const normalizedImpact = this.normalizeImpactScore(consequence.impact_score)
        const delayPenalty = this.calculateDelayPenalty(consequence.delay_minutes || 0)
        
        totalWeightedImpact += normalizedImpact * weight * delayPenalty
        totalWeight += weight
      }

      // Increase cascade multiplier for compounding effects
      cascadeMultiplier = Math.min(2.0, cascadeMultiplier * 1.15)
    }

    return totalWeight > 0 ? totalWeightedImpact / totalWeight : 50
  }

  /**
   * Calculate risk management score based on decision patterns and user profile
   */
  private calculateRiskManagementScore(
    sessionDecisions: SessionDecision[], 
    userRiskProfile: RiskProfile
  ): number {
    const riskScores = { low: 30, medium: 70, high: 100 }
    const profileOptimal = { conservative: 'low', balanced: 'medium', aggressive: 'high' }
    
    let totalScore = 0
    let consistencyBonus = 0
    let adaptabilityScore = 0

    // Analyze risk pattern consistency
    const riskCounts = { low: 0, medium: 0, high: 0 }
    
    for (const decision of sessionDecisions) {
      const riskLevel = this.inferRiskLevel(decision)
      riskCounts[riskLevel]++
      
      // Base score for risk level
      totalScore += riskScores[riskLevel]
      
      // Profile alignment bonus
      if (riskLevel === profileOptimal[userRiskProfile]) {
        totalScore += 20
      }
    }

    // Calculate consistency (penalize erratic risk-taking)
    const totalDecisions = sessionDecisions.length
    const dominantRisk = Object.keys(riskCounts).reduce((a, b) => 
      riskCounts[a as keyof typeof riskCounts] > riskCounts[b as keyof typeof riskCounts] ? a : b
    ) as keyof typeof riskCounts
    
    consistencyBonus = (riskCounts[dominantRisk] / totalDecisions) * 15

    // Calculate adaptability (reward appropriate risk escalation)
    adaptabilityScore = this.calculateRiskAdaptability(sessionDecisions)

    const averageScore = totalScore / totalDecisions
    return Math.min(100, averageScore + consistencyBonus + adaptabilityScore)
  }

  /**
   * Calculate time efficiency score with context awareness
   */
  private calculateTimeEfficiencyScore(sessionDecisions: SessionDecision[]): number {
    let totalEfficiency = 0
    let decisionCount = 0

    for (const decision of sessionDecisions) {
      const timeTakenMs = decision.time_taken_ms
      const optimalTimeMs = this.calculateOptimalDecisionTime(decision)
      
      if (optimalTimeMs > 0) {
        const efficiency = this.calculateTimeEfficiency(timeTakenMs, optimalTimeMs)
        totalEfficiency += efficiency
        decisionCount++
      }
    }

    return decisionCount > 0 ? totalEfficiency / decisionCount : 100
  }

  /**
   * Generate detailed score breakdown with actionable insights
   */
  private generateDetailedBreakdown(
    directImpact: number,
    secondOrderEffects: number,
    riskManagement: number,
    timeEfficiency: number,
    sessionDecisions: SessionDecision[],
    userRiskProfile: RiskProfile
  ): ScoreBreakdown[] {
    return [
      {
        category: 'Direct Impact Management',
        score: Math.round(directImpact),
        maxScore: 100,
        explanation: this.generateDirectImpactExplanation(directImpact, sessionDecisions),
        improvementSuggestions: this.generateDirectImpactSuggestions(directImpact, sessionDecisions)
      },
      {
        category: 'Second-Order Effects Anticipation',
        score: Math.round(secondOrderEffects),
        maxScore: 100,
        explanation: this.generateSecondOrderExplanation(secondOrderEffects, sessionDecisions),
        improvementSuggestions: this.generateSecondOrderSuggestions(secondOrderEffects, sessionDecisions)
      },
      {
        category: 'Risk Management Strategy',
        score: Math.round(riskManagement),
        maxScore: 100,
        explanation: this.generateRiskManagementExplanation(riskManagement, sessionDecisions, userRiskProfile),
        improvementSuggestions: this.generateRiskManagementSuggestions(riskManagement, sessionDecisions, userRiskProfile)
      },
      {
        category: 'Decision Timing Efficiency',
        score: Math.round(timeEfficiency),
        maxScore: 100,
        explanation: this.generateTimeEfficiencyExplanation(timeEfficiency, sessionDecisions),
        improvementSuggestions: this.generateTimeEfficiencySuggestions(timeEfficiency, sessionDecisions)
      }
    ]
  }

  // Helper methods
  private normalizeImpactScore(impactScore: number): number {
    // Convert impact score to 0-100 scale with proper weighting
    return Math.max(0, Math.min(100, impactScore))
  }

  private calculateDelayPenalty(delayMinutes: number): number {
    // Penalize consequences that take longer to manifest
    if (delayMinutes <= 5) return 1.0
    if (delayMinutes <= 30) return 0.9
    if (delayMinutes <= 120) return 0.8
    return 0.7
  }

  private inferRiskLevel(decision: SessionDecision): 'low' | 'medium' | 'high' {
    const avgImpact = decision.consequences.reduce((sum, c) => sum + c.impact_score, 0) / decision.consequences.length
    const highRiskConsequences = decision.consequences.filter(c => c.impact_score > 70).length
    
    if (avgImpact > 70 || highRiskConsequences > 1) return 'high'
    if (avgImpact > 40 || highRiskConsequences > 0) return 'medium'
    return 'low'
  }

  private calculateRiskAdaptability(sessionDecisions: SessionDecision[]): number {
    // Reward appropriate risk escalation in crisis situations
    let adaptabilityScore = 0
    
    for (let i = 1; i < sessionDecisions.length; i++) {
      const prevRisk = this.inferRiskLevel(sessionDecisions[i - 1])
      const currRisk = this.inferRiskLevel(sessionDecisions[i])
      
      // Reward escalation when previous decisions had negative outcomes
      if (sessionDecisions[i - 1].score_impact < 0 && currRisk > prevRisk) {
        adaptabilityScore += 5
      }
    }
    
    return Math.min(20, adaptabilityScore)
  }

  private calculateOptimalDecisionTime(decision: SessionDecision): number {
    // Estimate optimal decision time based on consequence complexity
    const baseTime = 30000 // 30 seconds base
    const complexityMultiplier = Math.min(3, decision.consequences.length * 0.5)
    return baseTime * complexityMultiplier
  }

  private calculateTimeEfficiency(actualMs: number, optimalMs: number): number {
    const ratio = actualMs / optimalMs
    
    if (ratio <= 0.5) return 60 // Too fast, might be rushed
    if (ratio <= 0.8) return 85 // Good timing
    if (ratio <= 1.2) return 100 // Optimal range
    if (ratio <= 2.0) return 75 // Acceptable but slow
    return Math.max(30, 75 - (ratio - 2.0) * 20) // Too slow
  }

  private calculatePercentile(score: number): number {
    // Simplified percentile calculation - in production, this would use historical data
    if (score >= 90) return 95
    if (score >= 80) return 85
    if (score >= 70) return 70
    if (score >= 60) return 55
    if (score >= 50) return 40
    return 25
  }

  private getEmptyScoreResult(): ScoreResult {
    return {
      totalScore: 0,
      directImpact: 0,
      secondOrderEffects: 0,
      riskManagement: 0,
      timeEfficiency: 0,
      breakdown: [],
      percentile: 0
    }
  }

  // Explanation generation methods
  private generateDirectImpactExplanation(score: number, decisions: SessionDecision[]): string {
    const avgConsequences = decisions.reduce((sum, d) => sum + d.consequences.filter(c => c.type === 'direct').length, 0) / decisions.length
    const negativeOutcomes = decisions.filter(d => d.score_impact < 0).length
    
    if (score >= 80) {
      return `Excellent direct impact management. You effectively minimized immediate negative consequences with an average of ${avgConsequences.toFixed(1)} direct outcomes per decision.`
    } else if (score >= 60) {
      return `Good direct impact handling. ${negativeOutcomes} of ${decisions.length} decisions had negative immediate outcomes, but overall impact was well-managed.`
    } else if (score >= 40) {
      return `Moderate direct impact management. ${negativeOutcomes} decisions resulted in significant immediate negative consequences that could have been avoided.`
    } else {
      return `Poor direct impact control. Most decisions led to immediate negative outcomes. Focus on understanding stakeholder impact before acting.`
    }
  }

  private generateDirectImpactSuggestions(score: number, decisions: SessionDecision[]): string[] {
    const suggestions: string[] = []
    
    if (score < 60) {
      suggestions.push('Practice stakeholder impact analysis before making decisions')
      suggestions.push('Use the "5 Whys" technique to understand immediate consequences')
      suggestions.push('Consider creating decision matrices for complex choices')
    }
    if (score < 80) {
      suggestions.push('Develop rapid impact assessment frameworks')
      suggestions.push('Study case studies of successful crisis decision-making')
    }
    
    return suggestions
  }

  private generateSecondOrderExplanation(score: number, decisions: SessionDecision[]): string {
    const secondOrderCount = decisions.reduce((sum, d) => sum + d.consequences.filter(c => c.type === 'second-order').length, 0)
    
    if (score >= 80) {
      return `Excellent anticipation of cascading effects. You identified ${secondOrderCount} second-order consequences and managed them effectively.`
    } else if (score >= 60) {
      return `Good awareness of second-order effects. Some long-term consequences were well-anticipated, though prediction accuracy could improve.`
    } else if (score >= 40) {
      return `Moderate consideration of cascading effects. Several important second-order consequences were missed or underestimated.`
    } else {
      return `Limited systems thinking evident. Focus on understanding how decisions create ripple effects throughout the organization and environment.`
    }
  }

  private generateSecondOrderSuggestions(score: number, decisions: SessionDecision[]): string[] {
    const suggestions: string[] = []
    
    if (score < 60) {
      suggestions.push('Practice systems thinking exercises to identify interconnected consequences')
      suggestions.push('Study historical crisis cases focusing on long-term impacts')
      suggestions.push('Use causal loop diagrams to map decision consequences')
    }
    if (score < 80) {
      suggestions.push('Develop mental models for predicting cascading effects')
      suggestions.push('Practice scenario planning techniques')
    }
    
    return suggestions
  }

  private generateRiskManagementExplanation(score: number, decisions: SessionDecision[], userRiskProfile: RiskProfile): string {
    const riskCounts = { low: 0, medium: 0, high: 0 }
    decisions.forEach(d => riskCounts[this.inferRiskLevel(d)]++)
    
    if (score >= 80) {
      return `Excellent risk calibration for your ${userRiskProfile} profile. Risk distribution: ${riskCounts.high} high-risk, ${riskCounts.medium} medium-risk, ${riskCounts.low} low-risk decisions.`
    } else if (score >= 60) {
      return `Good risk management with appropriate balance for crisis conditions. Some decisions could have been better calibrated to the situation severity.`
    } else if (score >= 40) {
      return `Moderate risk management. Consider whether your risk-taking pattern matches the crisis severity and your role responsibilities.`
    } else {
      return `Poor risk calibration. Your decisions were either too conservative for the crisis urgency or too aggressive for the potential consequences.`
    }
  }

  private generateRiskManagementSuggestions(score: number, decisions: SessionDecision[], userRiskProfile: RiskProfile): string[] {
    const suggestions: string[] = []
    
    if (score < 60) {
      suggestions.push('Learn to calibrate risk-taking based on crisis severity and time constraints')
      suggestions.push('Practice identifying when bold action is necessary vs when caution is warranted')
      suggestions.push('Study your risk profile and how it should adapt in crisis situations')
    }
    if (score < 80) {
      suggestions.push('Develop frameworks for rapid risk assessment under pressure')
      suggestions.push('Analyze successful crisis leaders with similar risk profiles')
    }
    
    return suggestions
  }

  private generateTimeEfficiencyExplanation(score: number, decisions: SessionDecision[]): string {
    const avgTime = decisions.reduce((sum, d) => sum + d.time_taken_ms, 0) / decisions.length / 1000
    
    if (score >= 80) {
      return `Excellent decision timing with an average of ${avgTime.toFixed(1)} seconds per decision. You balanced speed with thoroughness effectively.`
    } else if (score >= 60) {
      return `Good time management overall. Some decisions could have been made faster or with more deliberation depending on the situation.`
    } else if (score >= 40) {
      return `Moderate time efficiency. Work on recognizing when quick action is critical versus when more analysis is needed.`
    } else {
      return `Poor time management. You were either too rushed (risking poor decisions) or too slow (missing critical windows for action).`
    }
  }

  private generateTimeEfficiencySuggestions(score: number, decisions: SessionDecision[]): string[] {
    const suggestions: string[] = []
    
    if (score < 60) {
      suggestions.push('Practice rapid decision-making under time pressure')
      suggestions.push('Learn to identify decision types that require quick vs deliberate responses')
      suggestions.push('Use time-boxing techniques for complex decisions')
    }
    if (score < 80) {
      suggestions.push('Develop intuition for optimal decision timing in crisis situations')
      suggestions.push('Practice with progressively shorter time constraints')
    }
    
    return suggestions
  }
}