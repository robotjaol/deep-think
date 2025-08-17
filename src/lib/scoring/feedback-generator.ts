import { 
  ScoreResult, 
  SessionDecision, 
  LearningResource, 
  RiskProfile,
  ScenarioState,
  ResourceType 
} from '../types'
import { DecisionImpactAnalysis, ImpactAnalyzer } from './impact-analyzer'

/**
 * FeedbackGenerator creates personalized learning recommendations and feedback
 */
export class FeedbackGenerator {
  private impactAnalyzer: ImpactAnalyzer

  constructor() {
    this.impactAnalyzer = new ImpactAnalyzer()
  }

  /**
   * Generate comprehensive feedback for a training session
   */
  generateSessionFeedback(
    scoreResult: ScoreResult,
    sessionDecisions: SessionDecision[],
    scenarioContext: ScenarioState,
    userRiskProfile: RiskProfile,
    userTrainingLevel: number = 1
  ): SessionFeedback {
    const performanceAnalysis = this.analyzePerformancePatterns(scoreResult, sessionDecisions)
    const learningRecommendations = this.generateLearningRecommendations(
      scoreResult, 
      sessionDecisions, 
      userRiskProfile,
      userTrainingLevel
    )
    const improvementPlan = this.createImprovementPlan(scoreResult, performanceAnalysis)
    const nextSteps = this.generateNextSteps(scoreResult, userTrainingLevel)

    return {
      overallAssessment: this.generateOverallAssessment(scoreResult, performanceAnalysis),
      performanceAnalysis,
      learningRecommendations,
      improvementPlan,
      nextSteps,
      encouragementMessage: this.generateEncouragementMessage(scoreResult, userTrainingLevel),
      detailedInsights: this.generateDetailedInsights(sessionDecisions, scenarioContext)
    }
  }

  /**
   * Generate learning resource recommendations based on decision patterns
   */
  generateLearningRecommendations(
    scoreResult: ScoreResult,
    sessionDecisions: SessionDecision[],
    userRiskProfile: RiskProfile,
    userTrainingLevel: number
  ): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = []
    
    // Analyze weak areas and suggest targeted resources
    const weakAreas = this.identifyWeakAreas(scoreResult)
    
    for (const area of weakAreas) {
      const resources = this.getResourcesForArea(area, userTrainingLevel, userRiskProfile)
      const priority = this.calculateRecommendationPriority(area, scoreResult)
      
      recommendations.push({
        category: area.category,
        priority,
        reasoning: area.reasoning,
        resources,
        estimatedImpact: this.estimateImprovementImpact(area, scoreResult),
        timeCommitment: this.estimateTimeCommitment(resources)
      })
    }

    // Add general recommendations based on performance level
    const generalRecommendations = this.getGeneralRecommendations(scoreResult, userTrainingLevel)
    recommendations.push(...generalRecommendations)

    return recommendations.sort((a, b) => this.priorityToNumber(b.priority) - this.priorityToNumber(a.priority))
  }

  /**
   * Create a structured improvement plan
   */
  createImprovementPlan(
    scoreResult: ScoreResult,
    performanceAnalysis: PerformanceAnalysis
  ): ImprovementPlan {
    const shortTermGoals = this.generateShortTermGoals(scoreResult, performanceAnalysis)
    const longTermGoals = this.generateLongTermGoals(scoreResult, performanceAnalysis)
    const practiceExercises = this.suggestPracticeExercises(scoreResult)
    const milestones = this.defineMilestones(shortTermGoals, longTermGoals)

    return {
      shortTermGoals,
      longTermGoals,
      practiceExercises,
      milestones,
      estimatedTimeframe: this.estimateImprovementTimeframe(scoreResult),
      successMetrics: this.defineSuccessMetrics(scoreResult)
    }
  }

  /**
   * Analyze performance patterns across decisions
   */
  private analyzePerformancePatterns(
    scoreResult: ScoreResult,
    sessionDecisions: SessionDecision[]
  ): PerformanceAnalysis {
    const decisionTrends = this.analyzeDecisionTrends(sessionDecisions)
    const consistencyAnalysis = this.analyzeConsistency(sessionDecisions)
    const strengthsAndWeaknesses = this.identifyStrengthsAndWeaknesses(scoreResult)
    const improvementAreas = this.prioritizeImprovementAreas(scoreResult)

    return {
      overallTrend: decisionTrends.trend,
      consistencyScore: consistencyAnalysis.score,
      strengths: strengthsAndWeaknesses.strengths,
      weaknesses: strengthsAndWeaknesses.weaknesses,
      improvementAreas,
      decisionPatterns: this.identifyDecisionPatterns(sessionDecisions),
      riskTakingPattern: this.analyzeRiskTakingPattern(sessionDecisions),
      timeManagementPattern: this.analyzeTimeManagementPattern(sessionDecisions)
    }
  }

  /**
   * Generate overall assessment summary
   */
  private generateOverallAssessment(
    scoreResult: ScoreResult,
    performanceAnalysis: PerformanceAnalysis
  ): OverallAssessment {
    const performanceLevel = this.categorizePerformanceLevel(scoreResult.totalScore)
    const keyInsights = this.generateKeyInsights(scoreResult, performanceAnalysis)
    const readinessAssessment = this.assessReadinessForAdvancement(scoreResult, performanceAnalysis)

    return {
      performanceLevel,
      scorePercentile: scoreResult.percentile || 0,
      keyInsights,
      readinessForAdvancement: readinessAssessment,
      summary: this.generatePerformanceSummary(scoreResult, performanceAnalysis)
    }
  }

  /**
   * Generate detailed insights from decision analysis
   */
  private generateDetailedInsights(
    sessionDecisions: SessionDecision[],
    scenarioContext: ScenarioState
  ): DetailedInsight[] {
    const insights: DetailedInsight[] = []

    for (const decision of sessionDecisions) {
      const impactAnalysis = this.impactAnalyzer.analyzeDecisionImpact(
        decision,
        scenarioContext,
        sessionDecisions.slice(0, sessionDecisions.indexOf(decision))
      )

      insights.push({
        decisionId: decision.id,
        decisionText: decision.decision_text,
        insight: this.generateDecisionInsight(decision, impactAnalysis),
        lessonsLearned: this.extractLessonsLearned(decision, impactAnalysis),
        alternativeApproaches: this.suggestAlternativeApproaches(decision, impactAnalysis),
        impactAnalysis
      })
    }

    return insights
  }

  // Helper methods for weakness identification
  private identifyWeakAreas(scoreResult: ScoreResult): WeakArea[] {
    const weakAreas: WeakArea[] = []
    const threshold = 70 // Below this score is considered weak

    for (const breakdown of scoreResult.breakdown) {
      if (breakdown.score < threshold) {
        weakAreas.push({
          category: breakdown.category,
          score: breakdown.score,
          reasoning: breakdown.explanation,
          improvementPotential: this.calculateImprovementPotential(breakdown.score)
        })
      }
    }

    return weakAreas.sort((a, b) => a.score - b.score) // Weakest first
  }

  private getResourcesForArea(
    area: WeakArea,
    userTrainingLevel: number,
    userRiskProfile: RiskProfile
  ): LearningResource[] {
    // This would typically query a database of learning resources
    // For now, we'll return mock resources based on the area
    const resourceMap: Record<string, LearningResource[]> = {
      'Direct Impact Management': [
        {
          id: 'dim-001',
          title: 'Stakeholder Impact Analysis Framework',
          type: 'textbook',
          url: 'https://example.com/stakeholder-analysis',
          domain: 'crisis-management',
          tags: ['stakeholder-analysis', 'impact-assessment', 'decision-making'],
          relevance_keywords: ['stakeholder', 'impact', 'analysis', 'framework'],
          created_at: new Date().toISOString(),
          description: 'Comprehensive guide to analyzing stakeholder impact in crisis decisions',
          difficulty_level: userTrainingLevel,
          estimated_time_minutes: 45
        },
        {
          id: 'dim-002',
          title: 'Crisis Decision Making: Immediate Impact Assessment',
          type: 'video',
          url: 'https://youtube.com/watch?v=example',
          domain: 'crisis-management',
          tags: ['crisis-management', 'immediate-impact', 'assessment'],
          relevance_keywords: ['immediate', 'impact', 'crisis', 'assessment'],
          created_at: new Date().toISOString(),
          description: 'Video tutorial on rapid impact assessment techniques',
          difficulty_level: userTrainingLevel,
          estimated_time_minutes: 25
        }
      ],
      'Second-Order Effects Anticipation': [
        {
          id: 'soe-001',
          title: 'Systems Thinking for Crisis Leaders',
          type: 'paper',
          url: 'https://example.com/systems-thinking-paper',
          domain: 'systems-thinking',
          tags: ['systems-thinking', 'second-order-effects', 'cascading-impacts'],
          relevance_keywords: ['systems', 'thinking', 'cascading', 'second-order'],
          created_at: new Date().toISOString(),
          description: 'Research paper on applying systems thinking to predict cascading effects',
          difficulty_level: userTrainingLevel + 1,
          estimated_time_minutes: 60
        },
        {
          id: 'soe-002',
          title: 'Case Study: The 2008 Financial Crisis - Cascading Effects',
          type: 'case-study',
          url: 'https://example.com/financial-crisis-case',
          domain: 'finance',
          tags: ['case-study', 'financial-crisis', 'cascading-effects'],
          relevance_keywords: ['cascading', 'effects', 'financial', 'crisis'],
          created_at: new Date().toISOString(),
          description: 'Detailed analysis of how decisions led to cascading effects in the 2008 crisis',
          difficulty_level: userTrainingLevel,
          estimated_time_minutes: 90
        }
      ],
      'Risk Management Strategy': [
        {
          id: 'rms-001',
          title: `Risk Management for ${userRiskProfile.charAt(0).toUpperCase() + userRiskProfile.slice(1)} Leaders`,
          type: 'textbook',
          url: 'https://example.com/risk-management-book',
          domain: 'risk-management',
          tags: ['risk-management', userRiskProfile, 'leadership'],
          relevance_keywords: ['risk', 'management', userRiskProfile, 'leadership'],
          created_at: new Date().toISOString(),
          description: `Tailored risk management strategies for ${userRiskProfile} decision-makers`,
          difficulty_level: userTrainingLevel,
          estimated_time_minutes: 120
        }
      ],
      'Decision Timing Efficiency': [
        {
          id: 'dte-001',
          title: 'Rapid Decision Making Under Pressure',
          type: 'video',
          url: 'https://youtube.com/watch?v=rapid-decisions',
          domain: 'decision-making',
          tags: ['rapid-decisions', 'time-pressure', 'efficiency'],
          relevance_keywords: ['rapid', 'decision', 'time', 'pressure'],
          created_at: new Date().toISOString(),
          description: 'Techniques for making quality decisions under time constraints',
          difficulty_level: userTrainingLevel,
          estimated_time_minutes: 30
        }
      ]
    }

    return resourceMap[area.category] || []
  }

  private calculateRecommendationPriority(area: WeakArea, scoreResult: ScoreResult): 'low' | 'medium' | 'high' {
    if (area.score < 50) return 'high'
    if (area.score < 70) return 'medium'
    return 'low'
  }

  private estimateImprovementImpact(area: WeakArea, scoreResult: ScoreResult): number {
    // Estimate how much the overall score could improve by addressing this area
    const currentWeight = this.getCategoryWeight(area.category)
    const potentialImprovement = (80 - area.score) * currentWeight
    return Math.round(potentialImprovement * 100) / 100
  }

  private getCategoryWeight(category: string): number {
    const weights: Record<string, number> = {
      'Direct Impact Management': 0.35,
      'Second-Order Effects Anticipation': 0.30,
      'Risk Management Strategy': 0.20,
      'Decision Timing Efficiency': 0.15
    }
    return weights[category] || 0.25
  }

  private estimateTimeCommitment(resources: LearningResource[]): number {
    return resources.reduce((total, resource) => total + (resource.estimated_time_minutes || 30), 0)
  }

  private getGeneralRecommendations(
    scoreResult: ScoreResult,
    userTrainingLevel: number
  ): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = []

    if (scoreResult.totalScore < 60) {
      recommendations.push({
        category: 'Foundational Skills',
        priority: 'high',
        reasoning: 'Build fundamental crisis decision-making skills',
        resources: [
          {
            id: 'gen-001',
            title: 'Crisis Leadership Fundamentals',
            type: 'textbook',
            domain: 'crisis-management',
            tags: ['fundamentals', 'crisis-leadership'],
            relevance_keywords: ['crisis', 'leadership', 'fundamentals'],
            created_at: new Date().toISOString(),
            description: 'Essential skills for crisis decision-making',
            difficulty_level: 1,
            estimated_time_minutes: 180
          }
        ],
        estimatedImpact: 15,
        timeCommitment: 180
      })
    }

    if (scoreResult.totalScore >= 80) {
      recommendations.push({
        category: 'Advanced Techniques',
        priority: 'medium',
        reasoning: 'Enhance already strong skills with advanced techniques',
        resources: [
          {
            id: 'adv-001',
            title: 'Advanced Crisis Simulation Techniques',
            type: 'paper',
            domain: 'crisis-management',
            tags: ['advanced', 'simulation', 'techniques'],
            relevance_keywords: ['advanced', 'simulation', 'crisis'],
            created_at: new Date().toISOString(),
            description: 'Cutting-edge approaches to crisis management',
            difficulty_level: userTrainingLevel + 2,
            estimated_time_minutes: 90
          }
        ],
        estimatedImpact: 5,
        timeCommitment: 90
      })
    }

    return recommendations
  }

  // Performance analysis helper methods
  private analyzeDecisionTrends(sessionDecisions: SessionDecision[]): { trend: 'improving' | 'declining' | 'stable' } {
    if (sessionDecisions.length < 2) return { trend: 'stable' }

    const scores = sessionDecisions.map(d => d.score_impact)
    
    if (sessionDecisions.length === 2) {
      if (scores[1] > scores[0] + 5) return { trend: 'improving' }
      if (scores[1] < scores[0] - 5) return { trend: 'declining' }
      return { trend: 'stable' }
    }

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))

    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length

    if (secondAvg > firstAvg + 3) return { trend: 'improving' }
    if (secondAvg < firstAvg - 3) return { trend: 'declining' }
    return { trend: 'stable' }
  }

  private analyzeConsistency(sessionDecisions: SessionDecision[]): { score: number } {
    if (sessionDecisions.length < 2) return { score: 100 }

    const scores = sessionDecisions.map(d => d.score_impact)
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
    const standardDeviation = Math.sqrt(variance)

    // Lower standard deviation = higher consistency
    const consistencyScore = Math.max(0, 100 - (standardDeviation * 2))
    return { score: Math.round(consistencyScore) }
  }

  private identifyStrengthsAndWeaknesses(scoreResult: ScoreResult): { strengths: string[], weaknesses: string[] } {
    const strengths: string[] = []
    const weaknesses: string[] = []

    for (const breakdown of scoreResult.breakdown) {
      if (breakdown.score >= 80) {
        strengths.push(breakdown.category)
      } else if (breakdown.score < 60) {
        weaknesses.push(breakdown.category)
      }
    }

    return { strengths, weaknesses }
  }

  private prioritizeImprovementAreas(scoreResult: ScoreResult): string[] {
    return scoreResult.breakdown
      .filter(b => b.score < 70)
      .sort((a, b) => a.score - b.score)
      .map(b => b.category)
  }

  private identifyDecisionPatterns(sessionDecisions: SessionDecision[]): string[] {
    const patterns: string[] = []

    // Analyze time patterns
    const avgTime = sessionDecisions.reduce((sum, d) => sum + d.time_taken_ms, 0) / sessionDecisions.length
    if (avgTime < 30000) patterns.push('Rapid decision-making')
    else if (avgTime > 120000) patterns.push('Deliberate decision-making')

    // Analyze confidence patterns
    const confidenceScores = sessionDecisions.map(d => d.user_confidence || 50)
    const avgConfidence = confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length
    if (avgConfidence > 80) patterns.push('High confidence')
    else if (avgConfidence < 40) patterns.push('Low confidence')

    return patterns
  }

  private analyzeRiskTakingPattern(sessionDecisions: SessionDecision[]): string {
    const riskScores = sessionDecisions.map(d => {
      const avgImpact = d.consequences.reduce((sum, c) => sum + c.impact_score, 0) / d.consequences.length
      return avgImpact
    })

    const avgRisk = riskScores.reduce((sum, r) => sum + r, 0) / riskScores.length

    if (avgRisk > 70) return 'High-risk preference'
    if (avgRisk < 40) return 'Risk-averse'
    return 'Balanced risk approach'
  }

  private analyzeTimeManagementPattern(sessionDecisions: SessionDecision[]): string {
    const times = sessionDecisions.map(d => d.time_taken_ms)
    const variance = this.calculateVariance(times)

    if (variance < 10000) return 'Consistent timing'
    if (variance > 50000) return 'Inconsistent timing'
    return 'Variable timing'
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length
    return numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length
  }

  // Goal generation methods
  private generateShortTermGoals(
    scoreResult: ScoreResult,
    performanceAnalysis: PerformanceAnalysis
  ): Goal[] {
    const goals: Goal[] = []

    // Focus on the weakest area first
    const weakestArea = performanceAnalysis.improvementAreas[0]
    if (weakestArea) {
      goals.push({
        description: `Improve ${weakestArea} score by 15 points`,
        targetValue: 15,
        timeframe: '2-3 weeks',
        actionItems: [
          `Complete recommended learning resources for ${weakestArea}`,
          `Practice scenarios focusing on ${weakestArea}`,
          'Apply learned techniques in next training session'
        ]
      })
    }

    // Add consistency goal if needed
    if (performanceAnalysis.consistencyScore < 70) {
      goals.push({
        description: 'Improve decision consistency',
        targetValue: 80,
        timeframe: '3-4 weeks',
        actionItems: [
          'Develop personal decision-making framework',
          'Practice applying consistent criteria across decisions',
          'Review and reflect on decision patterns'
        ]
      })
    }

    return goals
  }

  private generateLongTermGoals(
    scoreResult: ScoreResult,
    performanceAnalysis: PerformanceAnalysis
  ): Goal[] {
    const goals: Goal[] = []

    // Overall score improvement
    const targetScore = Math.min(100, scoreResult.totalScore + 20)
    goals.push({
      description: `Achieve overall score of ${targetScore}`,
      targetValue: targetScore,
      timeframe: '2-3 months',
      actionItems: [
        'Complete comprehensive training program',
        'Practice with increasingly complex scenarios',
        'Seek mentorship from experienced crisis leaders'
      ]
    })

    // Mastery goals
    if (scoreResult.totalScore >= 70) {
      goals.push({
        description: 'Achieve mastery level in all core competencies',
        targetValue: 85,
        timeframe: '3-6 months',
        actionItems: [
          'Complete advanced training modules',
          'Lead crisis simulation exercises',
          'Mentor other trainees'
        ]
      })
    }

    return goals
  }

  private suggestPracticeExercises(scoreResult: ScoreResult): PracticeExercise[] {
    const exercises: PracticeExercise[] = []

    for (const breakdown of scoreResult.breakdown) {
      if (breakdown.score < 70) {
        exercises.push({
          title: `${breakdown.category} Practice Scenarios`,
          description: `Focused practice on ${breakdown.category.toLowerCase()}`,
          difficulty: breakdown.score < 50 ? 'beginner' : 'intermediate',
          estimatedDuration: 30,
          focusAreas: [breakdown.category]
        })
      }
    }

    return exercises
  }

  private defineMilestones(shortTermGoals: Goal[], longTermGoals: Goal[]): Milestone[] {
    const milestones: Milestone[] = []

    // Add milestones based on goals
    shortTermGoals.forEach((goal, index) => {
      milestones.push({
        title: `Short-term Goal ${index + 1}`,
        description: goal.description,
        targetDate: this.calculateTargetDate(goal.timeframe),
        successCriteria: [`Achieve target value of ${goal.targetValue}`]
      })
    })

    longTermGoals.forEach((goal, index) => {
      milestones.push({
        title: `Long-term Goal ${index + 1}`,
        description: goal.description,
        targetDate: this.calculateTargetDate(goal.timeframe),
        successCriteria: [`Achieve target value of ${goal.targetValue}`]
      })
    })

    return milestones
  }

  private estimateImprovementTimeframe(scoreResult: ScoreResult): string {
    if (scoreResult.totalScore < 40) return '3-6 months'
    if (scoreResult.totalScore < 70) return '2-4 months'
    return '1-2 months'
  }

  private defineSuccessMetrics(scoreResult: ScoreResult): string[] {
    const metrics: string[] = []

    metrics.push(`Overall score improvement of at least 15 points`)
    metrics.push(`All competency areas scoring above 70`)
    metrics.push(`Consistency score above 80`)

    if (scoreResult.totalScore >= 70) {
      metrics.push(`Achievement of expert level (90+) in at least one area`)
    }

    return metrics
  }

  // Utility methods
  private categorizePerformanceLevel(score: number): 'novice' | 'developing' | 'proficient' | 'expert' {
    if (score >= 90) return 'expert'
    if (score >= 75) return 'proficient'
    if (score >= 60) return 'developing'
    return 'novice'
  }

  private generateKeyInsights(
    scoreResult: ScoreResult,
    performanceAnalysis: PerformanceAnalysis
  ): string[] {
    const insights: string[] = []

    if (performanceAnalysis.strengths.length > 0) {
      insights.push(`Strong performance in: ${performanceAnalysis.strengths.join(', ')}`)
    }

    if (performanceAnalysis.overallTrend === 'improving') {
      insights.push('Showing positive improvement trend throughout the session')
    }

    if (performanceAnalysis.consistencyScore > 80) {
      insights.push('Demonstrates consistent decision-making approach')
    }

    return insights
  }

  private assessReadinessForAdvancement(
    scoreResult: ScoreResult,
    performanceAnalysis: PerformanceAnalysis
  ): boolean {
    return scoreResult.totalScore >= 75 && 
           performanceAnalysis.consistencyScore >= 70 &&
           performanceAnalysis.strengths.length >= 2
  }

  private generatePerformanceSummary(
    scoreResult: ScoreResult,
    performanceAnalysis: PerformanceAnalysis
  ): string {
    const level = this.categorizePerformanceLevel(scoreResult.totalScore)
    const trend = performanceAnalysis.overallTrend

    return `${level.charAt(0).toUpperCase() + level.slice(1)} level performance with ${trend} trend. ` +
           `Score: ${scoreResult.totalScore}/100 (${scoreResult.percentile}th percentile). ` +
           `Consistency: ${performanceAnalysis.consistencyScore}/100.`
  }

  private generateDecisionInsight(
    decision: SessionDecision,
    impactAnalysis: DecisionImpactAnalysis
  ): string {
    const riskLevel = impactAnalysis.riskAssessment.overallRiskLevel
    const stakeholderImpact = impactAnalysis.stakeholderImpact.mostAffectedGroup

    return `This ${riskLevel}-risk decision primarily affected ${stakeholderImpact}. ` +
           `Impact score: ${Math.round(impactAnalysis.overallImpactScore)}/100. ` +
           `${impactAnalysis.cascadeAnalysis.cascadeChains.length} cascade chains identified.`
  }

  private extractLessonsLearned(
    decision: SessionDecision,
    impactAnalysis: DecisionImpactAnalysis
  ): string[] {
    const lessons: string[] = []

    if (impactAnalysis.cascadeAnalysis.cascadeChains.length > 0) {
      lessons.push('Consider cascade effects when making similar decisions')
    }

    if (impactAnalysis.riskAssessment.overallRiskLevel === 'high') {
      lessons.push('High-risk decisions require additional contingency planning')
    }

    if (impactAnalysis.improvementOpportunities.length > 0) {
      lessons.push(impactAnalysis.improvementOpportunities[0].description)
    }

    return lessons
  }

  private suggestAlternativeApproaches(
    decision: SessionDecision,
    impactAnalysis: DecisionImpactAnalysis
  ): string[] {
    const alternatives: string[] = []

    if (impactAnalysis.riskAssessment.overallRiskLevel === 'high') {
      alternatives.push('Consider a phased implementation approach to reduce risk')
      alternatives.push('Gather additional information before deciding')
    }

    if (impactAnalysis.stakeholderImpact.crossGroupEffects.length > 0) {
      alternatives.push('Engage stakeholders in the decision-making process')
    }

    // Always provide at least one alternative
    if (alternatives.length === 0) {
      alternatives.push('Consider consulting with subject matter experts')
      alternatives.push('Evaluate the decision from multiple perspectives')
    }

    return alternatives
  }

  private generateEncouragementMessage(scoreResult: ScoreResult, userTrainingLevel: number): string {
    const level = this.categorizePerformanceLevel(scoreResult.totalScore)

    const messages: Record<string, string> = {
      'novice': 'Great start! Crisis decision-making is challenging, and you\'re building important foundational skills.',
      'developing': 'Good progress! You\'re developing solid crisis management capabilities. Keep practicing!',
      'proficient': 'Excellent work! You demonstrate strong crisis decision-making skills. Focus on consistency and advanced techniques.',
      'expert': 'Outstanding performance! You show expert-level crisis management skills. Consider mentoring others.'
    }

    return messages[level] || 'Keep up the great work in developing your crisis decision-making skills!'
  }

  private calculateImprovementPotential(score: number): 'low' | 'medium' | 'high' {
    if (score < 40) return 'high'
    if (score < 70) return 'medium'
    return 'low'
  }

  private priorityToNumber(priority: 'low' | 'medium' | 'high'): number {
    const map = { low: 1, medium: 2, high: 3 }
    return map[priority]
  }

  private calculateTargetDate(timeframe: string): string {
    const now = new Date()
    const weeks = timeframe.includes('week') ? parseInt(timeframe) : 
                  timeframe.includes('month') ? parseInt(timeframe) * 4 : 4
    
    const targetDate = new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
    return targetDate.toISOString().split('T')[0]
  }

  /**
   * Generate next steps based on performance level
   */
  private generateNextSteps(scoreResult: ScoreResult, userTrainingLevel: number): string[] {
    const steps: string[] = []
    const performanceLevel = this.categorizePerformanceLevel(scoreResult.totalScore)

    if (performanceLevel === 'novice') {
      steps.push('Focus on completing foundational training modules')
      steps.push('Practice with beginner-level scenarios')
      steps.push('Review basic crisis decision-making frameworks')
    } else if (performanceLevel === 'developing') {
      steps.push('Work on your weakest competency area first')
      steps.push('Practice with scenarios of increasing complexity')
      steps.push('Seek feedback from experienced practitioners')
    } else if (performanceLevel === 'proficient') {
      steps.push('Challenge yourself with advanced scenarios')
      steps.push('Focus on consistency across all competency areas')
      steps.push('Consider mentoring less experienced trainees')
    } else {
      steps.push('Explore cutting-edge crisis management techniques')
      steps.push('Lead training sessions for other users')
      steps.push('Contribute to scenario development and best practices')
    }

    // Add specific steps based on weak areas
    const weakAreas = scoreResult.breakdown.filter(b => b.score < 70)
    if (weakAreas.length > 0) {
      steps.push(`Prioritize improvement in: ${weakAreas.map(w => w.category).join(', ')}`)
    }

    return steps
  }
}

// Type definitions for feedback system
export interface SessionFeedback {
  overallAssessment: OverallAssessment
  performanceAnalysis: PerformanceAnalysis
  learningRecommendations: LearningRecommendation[]
  improvementPlan: ImprovementPlan
  nextSteps: string[]
  encouragementMessage: string
  detailedInsights: DetailedInsight[]
}

export interface OverallAssessment {
  performanceLevel: 'novice' | 'developing' | 'proficient' | 'expert'
  scorePercentile: number
  keyInsights: string[]
  readinessForAdvancement: boolean
  summary: string
}

export interface PerformanceAnalysis {
  overallTrend: 'improving' | 'declining' | 'stable'
  consistencyScore: number
  strengths: string[]
  weaknesses: string[]
  improvementAreas: string[]
  decisionPatterns: string[]
  riskTakingPattern: string
  timeManagementPattern: string
}

export interface LearningRecommendation {
  category: string
  priority: 'low' | 'medium' | 'high'
  reasoning: string
  resources: LearningResource[]
  estimatedImpact: number
  timeCommitment: number
}

export interface ImprovementPlan {
  shortTermGoals: Goal[]
  longTermGoals: Goal[]
  practiceExercises: PracticeExercise[]
  milestones: Milestone[]
  estimatedTimeframe: string
  successMetrics: string[]
}

export interface Goal {
  description: string
  targetValue: number
  timeframe: string
  actionItems: string[]
}

export interface PracticeExercise {
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration: number
  focusAreas: string[]
}

export interface Milestone {
  title: string
  description: string
  targetDate: string
  successCriteria: string[]
}

export interface DetailedInsight {
  decisionId: string
  decisionText: string
  insight: string
  lessonsLearned: string[]
  alternativeApproaches: string[]
  impactAnalysis: DecisionImpactAnalysis
}

interface WeakArea {
  category: string
  score: number
  reasoning: string
  improvementPotential: 'low' | 'medium' | 'high'
}