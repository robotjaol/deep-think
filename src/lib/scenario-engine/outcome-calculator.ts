import { Consequence, Decision, ScoreResult, ScoreBreakdown } from '../types'

/**
 * OutcomeCalculator computes direct and second-order effects of decisions
 */
export class OutcomeCalculator {
  private readonly DIRECT_IMPACT_WEIGHT = 0.4
  private readonly SECOND_ORDER_WEIGHT = 0.3
  private readonly RISK_MANAGEMENT_WEIGHT = 0.2
  private readonly TIME_EFFICIENCY_WEIGHT = 0.1

  /**
   * Calculate comprehensive outcomes for a series of decisions
   */
  calculateOutcomes(
    decisions: Decision[],
    timeTakenMs: number[],
    timeLimitsMs: number[]
  ): ScoreResult {
    const directImpact = this.calculateDirectImpact(decisions)
    const secondOrderEffects = this.calculateSecondOrderEffects(decisions)
    const riskManagement = this.calculateRiskManagement(decisions)
    const timeEfficiency = this.calculateTimeEfficiency(timeTakenMs, timeLimitsMs)

    const totalScore = (
      directImpact * this.DIRECT_IMPACT_WEIGHT +
      secondOrderEffects * this.SECOND_ORDER_WEIGHT +
      riskManagement * this.RISK_MANAGEMENT_WEIGHT +
      timeEfficiency * this.TIME_EFFICIENCY_WEIGHT
    )

    const breakdown = this.generateScoreBreakdown(
      directImpact,
      secondOrderEffects,
      riskManagement,
      timeEfficiency,
      decisions
    )

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      directImpact: Math.round(directImpact * 100) / 100,
      secondOrderEffects: Math.round(secondOrderEffects * 100) / 100,
      riskManagement: Math.round(riskManagement * 100) / 100,
      timeEfficiency: Math.round(timeEfficiency * 100) / 100,
      breakdown
    }
  }

  /**
   * Calculate direct impact score from immediate consequences
   */
  private calculateDirectImpact(decisions: Decision[]): number {
    if (decisions.length === 0) return 0

    let totalImpact = 0
    let totalWeight = 0

    for (const decision of decisions) {
      const directConsequences = decision.consequences.filter(c => c.type === 'direct')
      
      for (const consequence of directConsequences) {
        const weightedImpact = consequence.impact_score * consequence.probability
        totalImpact += weightedImpact
        totalWeight += consequence.probability
      }
    }

    return totalWeight > 0 ? Math.max(0, Math.min(100, totalImpact / totalWeight)) : 0
  }

  /**
   * Calculate second-order effects score from delayed consequences
   */
  private calculateSecondOrderEffects(decisions: Decision[]): number {
    if (decisions.length === 0) return 0

    let totalImpact = 0
    let totalWeight = 0
    let cascadeMultiplier = 1

    for (const decision of decisions) {
      const secondOrderConsequences = decision.consequences.filter(c => c.type === 'second-order')
      
      for (const consequence of secondOrderConsequences) {
        // Apply cascade multiplier for compounding effects
        const weightedImpact = consequence.impact_score * consequence.probability * cascadeMultiplier
        totalImpact += weightedImpact
        totalWeight += consequence.probability

        // Increase cascade multiplier for subsequent decisions
        cascadeMultiplier *= 1.1
      }
    }

    return totalWeight > 0 ? Math.max(0, Math.min(100, totalImpact / totalWeight)) : 0
  }

  /**
   * Calculate risk management score based on decision risk levels
   */
  private calculateRiskManagement(decisions: Decision[]): number {
    if (decisions.length === 0) return 0

    const riskScores = {
      low: 100,
      medium: 70,
      high: 40
    }

    let totalRiskScore = 0
    let riskBalance = 0

    for (const decision of decisions) {
      const baseScore = riskScores[decision.riskLevel]
      totalRiskScore += baseScore

      // Calculate risk balance (penalize consistently high or low risk choices)
      if (decision.riskLevel === 'high') riskBalance += 1
      else if (decision.riskLevel === 'low') riskBalance -= 1
    }

    const averageRiskScore = totalRiskScore / decisions.length
    
    // Apply risk balance penalty/bonus
    const balancePenalty = Math.abs(riskBalance) * 5
    
    return Math.max(0, Math.min(100, averageRiskScore - balancePenalty))
  }

  /**
   * Calculate time efficiency score based on decision timing
   */
  private calculateTimeEfficiency(timeTakenMs: number[], timeLimitsMs: number[]): number {
    if (timeTakenMs.length === 0 || timeLimitsMs.length === 0) return 100

    let totalEfficiency = 0

    for (let i = 0; i < Math.min(timeTakenMs.length, timeLimitsMs.length); i++) {
      const timeTaken = timeTakenMs[i]
      const timeLimit = timeLimitsMs[i]

      if (timeLimit <= 0) {
        totalEfficiency += 100 // No time limit
        continue
      }

      const timeRatio = timeTaken / timeLimit
      
      // Optimal time is 60-80% of time limit
      let efficiency: number
      if (timeRatio <= 0.6) {
        // Too fast - might indicate rushed decisions
        efficiency = 60 + (timeRatio / 0.6) * 20
      } else if (timeRatio <= 0.8) {
        // Optimal range
        efficiency = 80 + ((timeRatio - 0.6) / 0.2) * 20
      } else if (timeRatio <= 1.0) {
        // Acceptable but slower
        efficiency = 100 - ((timeRatio - 0.8) / 0.2) * 30
      } else {
        // Over time limit
        efficiency = Math.max(0, 70 - (timeRatio - 1.0) * 50)
      }

      totalEfficiency += efficiency
    }

    return totalEfficiency / Math.min(timeTakenMs.length, timeLimitsMs.length)
  }

  /**
   * Generate detailed score breakdown with explanations
   */
  private generateScoreBreakdown(
    directImpact: number,
    secondOrderEffects: number,
    riskManagement: number,
    timeEfficiency: number,
    decisions: Decision[]
  ): ScoreBreakdown[] {
    const breakdown: ScoreBreakdown[] = []

    // Direct Impact breakdown
    breakdown.push({
      category: 'Direct Impact',
      score: Math.round(directImpact),
      maxScore: 100,
      explanation: this.getDirectImpactExplanation(directImpact, decisions),
      improvementSuggestions: this.getDirectImpactSuggestions(directImpact, decisions)
    })

    // Second-Order Effects breakdown
    breakdown.push({
      category: 'Second-Order Effects',
      score: Math.round(secondOrderEffects),
      maxScore: 100,
      explanation: this.getSecondOrderExplanation(secondOrderEffects, decisions),
      improvementSuggestions: this.getSecondOrderSuggestions(secondOrderEffects, decisions)
    })

    // Risk Management breakdown
    breakdown.push({
      category: 'Risk Management',
      score: Math.round(riskManagement),
      maxScore: 100,
      explanation: this.getRiskManagementExplanation(riskManagement, decisions),
      improvementSuggestions: this.getRiskManagementSuggestions(riskManagement, decisions)
    })

    // Time Efficiency breakdown
    breakdown.push({
      category: 'Time Efficiency',
      score: Math.round(timeEfficiency),
      maxScore: 100,
      explanation: this.getTimeEfficiencyExplanation(timeEfficiency),
      improvementSuggestions: this.getTimeEfficiencySuggestions(timeEfficiency)
    })

    return breakdown
  }

  /**
   * Calculate consequence severity distribution
   */
  getConsequenceSeverityDistribution(decisions: Decision[]): {
    low: number
    medium: number
    high: number
    critical: number
  } {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 }

    for (const decision of decisions) {
      for (const consequence of decision.consequences) {
        const severity = this.getConsequenceSeverity(consequence.impact_score)
        distribution[severity]++
      }
    }

    return distribution
  }

  /**
   * Get consequence severity category
   */
  private getConsequenceSeverity(impactScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (impactScore >= 80) return 'critical'
    if (impactScore >= 60) return 'high'
    if (impactScore >= 40) return 'medium'
    return 'low'
  }

  // Explanation and suggestion methods
  private getDirectImpactExplanation(score: number, decisions: Decision[]): string {
    const avgConsequences = decisions.reduce((sum, d) => sum + d.consequences.filter(c => c.type === 'direct').length, 0) / decisions.length
    
    if (score >= 80) return `Excellent direct impact management with an average of ${avgConsequences.toFixed(1)} immediate consequences per decision.`
    if (score >= 60) return `Good direct impact handling, though some decisions had significant immediate consequences.`
    if (score >= 40) return `Moderate direct impact management. Several decisions resulted in negative immediate outcomes.`
    return `Poor direct impact control. Most decisions led to significant immediate negative consequences.`
  }

  private getDirectImpactSuggestions(score: number, decisions: Decision[]): string[] {
    const suggestions: string[] = []
    
    if (score < 60) {
      suggestions.push('Focus on understanding immediate consequences before making decisions')
      suggestions.push('Consider stakeholder impact in your decision-making process')
    }
    if (score < 80) {
      suggestions.push('Practice identifying primary vs secondary stakeholders')
      suggestions.push('Develop frameworks for rapid impact assessment')
    }
    
    return suggestions
  }

  private getSecondOrderExplanation(score: number, decisions: Decision[]): string {
    if (score >= 80) return 'Excellent anticipation of cascading effects and long-term consequences.'
    if (score >= 60) return 'Good awareness of second-order effects, with room for improvement in prediction accuracy.'
    if (score >= 40) return 'Moderate consideration of long-term consequences. Some cascading effects were missed.'
    return 'Limited awareness of second-order effects. Focus on understanding how decisions create ripple effects.'
  }

  private getSecondOrderSuggestions(score: number, decisions: Decision[]): string[] {
    const suggestions: string[] = []
    
    if (score < 60) {
      suggestions.push('Practice systems thinking to identify interconnected consequences')
      suggestions.push('Study case studies of decisions with significant long-term impacts')
    }
    if (score < 80) {
      suggestions.push('Develop mental models for predicting cascading effects')
      suggestions.push('Consider time-delayed consequences in your decision framework')
    }
    
    return suggestions
  }

  private getRiskManagementExplanation(score: number, decisions: Decision[]): string {
    const riskDistribution = decisions.reduce((acc, d) => {
      acc[d.riskLevel]++
      return acc
    }, { low: 0, medium: 0, high: 0 })

    if (score >= 80) return `Excellent risk balance with ${riskDistribution.high} high-risk, ${riskDistribution.medium} medium-risk, and ${riskDistribution.low} low-risk decisions.`
    if (score >= 60) return 'Good risk management with appropriate risk-taking for the situation.'
    if (score >= 40) return 'Moderate risk management. Consider balancing conservative and aggressive approaches.'
    return 'Poor risk management. Either too conservative or too aggressive for the crisis context.'
  }

  private getRiskManagementSuggestions(score: number, decisions: Decision[]): string[] {
    const suggestions: string[] = []
    
    if (score < 60) {
      suggestions.push('Learn to calibrate risk-taking based on crisis severity')
      suggestions.push('Practice identifying when bold action is necessary vs when caution is warranted')
    }
    if (score < 80) {
      suggestions.push('Develop frameworks for rapid risk assessment')
      suggestions.push('Study successful crisis leaders and their risk management approaches')
    }
    
    return suggestions
  }

  private getTimeEfficiencyExplanation(score: number): string {
    if (score >= 80) return 'Excellent time management with optimal decision timing.'
    if (score >= 60) return 'Good time efficiency, though some decisions could have been made faster or slower.'
    if (score >= 40) return 'Moderate time management. Work on balancing speed with thoroughness.'
    return 'Poor time management. Either too rushed or too slow for crisis conditions.'
  }

  private getTimeEfficiencySuggestions(score: number): string[] {
    const suggestions: string[] = []
    
    if (score < 60) {
      suggestions.push('Practice rapid decision-making under time pressure')
      suggestions.push('Learn to identify when quick action is critical vs when deliberation is needed')
    }
    if (score < 80) {
      suggestions.push('Develop intuition for optimal decision timing')
      suggestions.push('Practice with time-constrained scenario simulations')
    }
    
    return suggestions
  }
}