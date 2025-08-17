import { 
  LearningResource, 
  SessionDecision, 
  ScoreResult, 
  RiskProfile,
  ResourceType 
} from '../types'

/**
 * ResourceMatcher finds and ranks learning resources based on user decisions and performance
 */
export class ResourceMatcher {
  private resourceDatabase: LearningResource[] = []

  constructor(resources: LearningResource[] = []) {
    this.resourceDatabase = resources
  }

  /**
   * Find relevant learning resources based on decision patterns and score results
   */
  findRelevantResources(
    sessionDecisions: SessionDecision[],
    scoreResult: ScoreResult,
    userRiskProfile: RiskProfile,
    userTrainingLevel: number = 1,
    maxResults: number = 10
  ): RankedResource[] {
    const decisionKeywords = this.extractDecisionKeywords(sessionDecisions)
    const weaknessKeywords = this.extractWeaknessKeywords(scoreResult)
    const profileKeywords = this.getProfileKeywords(userRiskProfile)

    const allKeywords = [...decisionKeywords, ...weaknessKeywords, ...profileKeywords]
    
    const rankedResources = this.resourceDatabase
      .map(resource => ({
        resource,
        relevanceScore: this.calculateRelevanceScore(resource, allKeywords, userTrainingLevel),
        matchingKeywords: this.findMatchingKeywords(resource, allKeywords),
        difficultyMatch: this.calculateDifficultyMatch(resource, userTrainingLevel)
      }))
      .filter(ranked => ranked.relevanceScore > 0.3) // Minimum relevance threshold
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)

    return rankedResources
  }

  /**
   * Find resources for specific competency areas
   */
  findResourcesForCompetency(
    competencyArea: string,
    userTrainingLevel: number = 1,
    resourceTypes: ResourceType[] = ['paper', 'textbook', 'video', 'case-study'],
    maxResults: number = 5
  ): RankedResource[] {
    const competencyKeywords = this.getCompetencyKeywords(competencyArea)
    
    const rankedResources = this.resourceDatabase
      .filter(resource => resourceTypes.includes(resource.type))
      .map(resource => ({
        resource,
        relevanceScore: this.calculateCompetencyRelevance(resource, competencyKeywords),
        matchingKeywords: this.findMatchingKeywords(resource, competencyKeywords),
        difficultyMatch: this.calculateDifficultyMatch(resource, userTrainingLevel)
      }))
      .filter(ranked => ranked.relevanceScore > 0.4)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)

    return rankedResources
  }

  /**
   * Find resources based on specific decision consequences
   */
  findResourcesForConsequences(
    sessionDecisions: SessionDecision[],
    userTrainingLevel: number = 1,
    maxResults: number = 8
  ): RankedResource[] {
    const consequenceKeywords = this.extractConsequenceKeywords(sessionDecisions)
    const impactPatterns = this.analyzeImpactPatterns(sessionDecisions)
    
    const rankedResources = this.resourceDatabase
      .map(resource => ({
        resource,
        relevanceScore: this.calculateConsequenceRelevance(resource, consequenceKeywords, impactPatterns),
        matchingKeywords: this.findMatchingKeywords(resource, consequenceKeywords),
        difficultyMatch: this.calculateDifficultyMatch(resource, userTrainingLevel)
      }))
      .filter(ranked => ranked.relevanceScore > 0.35)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)

    return rankedResources
  }

  /**
   * Get personalized resource recommendations based on learning preferences
   */
  getPersonalizedRecommendations(
    sessionDecisions: SessionDecision[],
    scoreResult: ScoreResult,
    userPreferences: UserLearningPreferences,
    maxResults: number = 12
  ): PersonalizedRecommendation[] {
    const baseResources = this.findRelevantResources(
      sessionDecisions,
      scoreResult,
      userPreferences.riskProfile,
      userPreferences.trainingLevel,
      maxResults * 2 // Get more to filter by preferences
    )

    const personalizedResources = baseResources
      .map(ranked => ({
        ...ranked,
        personalizedScore: this.calculatePersonalizedScore(ranked, userPreferences),
        learningPath: this.determineLearningPath(ranked.resource, userPreferences),
        estimatedEffectiveness: this.estimateEffectiveness(ranked.resource, scoreResult, userPreferences)
      }))
      .sort((a, b) => b.personalizedScore - a.personalizedScore)
      .slice(0, maxResults)

    return personalizedResources.map(resource => ({
      resource: resource.resource,
      relevanceScore: resource.relevanceScore,
      personalizedScore: resource.personalizedScore,
      matchingKeywords: resource.matchingKeywords,
      learningPath: resource.learningPath,
      estimatedEffectiveness: resource.estimatedEffectiveness,
      recommendationReason: this.generateRecommendationReason(resource, scoreResult)
    }))
  }

  /**
   * Add resources to the database
   */
  addResources(resources: LearningResource[]): void {
    this.resourceDatabase.push(...resources)
  }

  /**
   * Update resource database
   */
  updateResourceDatabase(resources: LearningResource[]): void {
    this.resourceDatabase = resources
  }

  // Private helper methods

  private extractDecisionKeywords(sessionDecisions: SessionDecision[]): string[] {
    const keywords = new Set<string>()
    
    for (const decision of sessionDecisions) {
      // Extract keywords from decision text
      const decisionKeywords = this.extractKeywordsFromText(decision.decision_text)
      decisionKeywords.forEach(keyword => keywords.add(keyword))
      
      // Extract keywords from consequences
      for (const consequence of decision.consequences) {
        const consequenceKeywords = this.extractKeywordsFromText(consequence.description)
        consequenceKeywords.forEach(keyword => keywords.add(keyword))
      }
    }
    
    return Array.from(keywords).slice(0, 20) // Limit to top 20 keywords
  }

  private extractWeaknessKeywords(scoreResult: ScoreResult): string[] {
    const keywords = new Set<string>()
    
    for (const breakdown of scoreResult.breakdown) {
      if (breakdown.score < 70) {
        // Convert category to keywords
        const categoryKeywords = breakdown.category.toLowerCase().split(' ')
        categoryKeywords.forEach(keyword => keywords.add(keyword))
        
        // Extract keywords from improvement suggestions
        for (const suggestion of breakdown.improvementSuggestions) {
          const suggestionKeywords = this.extractKeywordsFromText(suggestion)
          suggestionKeywords.forEach(keyword => keywords.add(keyword))
        }
      }
    }
    
    return Array.from(keywords)
  }

  private getProfileKeywords(riskProfile: RiskProfile): string[] {
    const profileKeywords: Record<RiskProfile, string[]> = {
      'conservative': ['risk-averse', 'cautious', 'careful', 'prudent', 'safe'],
      'balanced': ['balanced', 'moderate', 'measured', 'pragmatic', 'flexible'],
      'aggressive': ['bold', 'decisive', 'rapid', 'assertive', 'proactive']
    }
    
    return profileKeywords[riskProfile] || []
  }

  private getCompetencyKeywords(competencyArea: string): string[] {
    const competencyKeywords: Record<string, string[]> = {
      'Direct Impact Management': [
        'stakeholder', 'impact', 'immediate', 'direct', 'consequences', 'analysis', 'assessment'
      ],
      'Second-Order Effects Anticipation': [
        'systems', 'thinking', 'cascading', 'second-order', 'ripple', 'effects', 'long-term', 'indirect'
      ],
      'Risk Management Strategy': [
        'risk', 'management', 'mitigation', 'assessment', 'strategy', 'uncertainty', 'probability'
      ],
      'Decision Timing Efficiency': [
        'timing', 'speed', 'efficiency', 'rapid', 'quick', 'time', 'pressure', 'urgency'
      ]
    }
    
    return competencyKeywords[competencyArea] || []
  }

  private extractConsequenceKeywords(sessionDecisions: SessionDecision[]): string[] {
    const keywords = new Set<string>()
    
    for (const decision of sessionDecisions) {
      for (const consequence of decision.consequences) {
        const consequenceKeywords = this.extractKeywordsFromText(consequence.description)
        consequenceKeywords.forEach(keyword => keywords.add(keyword))
        
        // Add type-specific keywords
        keywords.add(consequence.type)
        
        // Add impact level keywords
        if (consequence.impact_score > 70) keywords.add('high-impact')
        else if (consequence.impact_score > 40) keywords.add('medium-impact')
        else keywords.add('low-impact')
      }
    }
    
    return Array.from(keywords)
  }

  private analyzeImpactPatterns(sessionDecisions: SessionDecision[]): ImpactPattern[] {
    const patterns: ImpactPattern[] = []
    
    // Analyze timing patterns
    const immediateConsequences = sessionDecisions.flatMap(d => 
      d.consequences.filter(c => !c.delay_minutes || c.delay_minutes <= 5)
    )
    const delayedConsequences = sessionDecisions.flatMap(d => 
      d.consequences.filter(c => c.delay_minutes && c.delay_minutes > 30)
    )
    
    if (immediateConsequences.length > delayedConsequences.length) {
      patterns.push({ type: 'immediate-heavy', strength: 0.8 })
    } else if (delayedConsequences.length > immediateConsequences.length) {
      patterns.push({ type: 'delayed-heavy', strength: 0.8 })
    }
    
    // Analyze impact severity patterns
    const highImpactCount = sessionDecisions.flatMap(d => d.consequences).filter(c => c.impact_score > 70).length
    const totalConsequences = sessionDecisions.flatMap(d => d.consequences).length
    
    if (highImpactCount / totalConsequences > 0.5) {
      patterns.push({ type: 'high-severity', strength: 0.9 })
    }
    
    return patterns
  }

  private calculateRelevanceScore(
    resource: LearningResource,
    keywords: string[],
    userTrainingLevel: number
  ): number {
    let score = 0
    
    // Keyword matching score (0-0.6)
    const keywordScore = this.calculateKeywordMatchScore(resource, keywords)
    score += keywordScore * 0.6
    
    // Difficulty level match (0-0.2)
    const difficultyScore = this.calculateDifficultyMatch(resource, userTrainingLevel)
    score += difficultyScore * 0.2
    
    // Resource type preference (0-0.1)
    const typeScore = this.getResourceTypeScore(resource.type)
    score += typeScore * 0.1
    
    // Recency bonus (0-0.1)
    const recencyScore = this.calculateRecencyScore(resource)
    score += recencyScore * 0.1
    
    return Math.min(1.0, score)
  }

  private calculateCompetencyRelevance(resource: LearningResource, competencyKeywords: string[]): number {
    const keywordScore = this.calculateKeywordMatchScore(resource, competencyKeywords)
    const tagScore = this.calculateTagMatchScore(resource, competencyKeywords)
    
    // Boost relevance if resource has any matching keywords
    const hasMatches = keywordScore > 0 || tagScore > 0
    const baseScore = (keywordScore * 0.7) + (tagScore * 0.3)
    
    return hasMatches ? Math.max(0.5, baseScore) : baseScore
  }

  private calculateConsequenceRelevance(
    resource: LearningResource,
    consequenceKeywords: string[],
    impactPatterns: ImpactPattern[]
  ): number {
    let score = 0
    
    // Keyword matching
    const keywordScore = this.calculateKeywordMatchScore(resource, consequenceKeywords)
    score += keywordScore * 0.6
    
    // Pattern matching
    for (const pattern of impactPatterns) {
      if (this.resourceMatchesPattern(resource, pattern)) {
        score += pattern.strength * 0.4
      }
    }
    
    // Boost relevance if there are any matches
    if (keywordScore > 0 || impactPatterns.some(p => this.resourceMatchesPattern(resource, p))) {
      score = Math.max(0.4, score)
    }
    
    return Math.min(1.0, score)
  }

  private calculatePersonalizedScore(
    rankedResource: RankedResource,
    preferences: UserLearningPreferences
  ): number {
    let score = rankedResource.relevanceScore
    
    // Learning style preference
    if (preferences.preferredResourceTypes.includes(rankedResource.resource.type)) {
      score += 0.2
    }
    
    // Time availability
    const resourceTime = rankedResource.resource.estimated_time_minutes || 60
    if (resourceTime <= preferences.availableTimeMinutes) {
      score += 0.1
    } else {
      score -= 0.1
    }
    
    // Difficulty preference
    const resourceDifficulty = rankedResource.resource.difficulty_level || 1
    if (Math.abs(resourceDifficulty - preferences.trainingLevel) <= 1) {
      score += 0.1
    }
    
    return Math.min(1.0, score)
  }

  private calculateKeywordMatchScore(resource: LearningResource, keywords: string[]): number {
    const resourceText = [
      resource.title,
      resource.description || '',
      ...resource.tags,
      ...resource.relevance_keywords
    ].join(' ').toLowerCase()
    
    let matches = 0
    for (const keyword of keywords) {
      if (resourceText.includes(keyword.toLowerCase())) {
        matches++
      }
    }
    
    return keywords.length > 0 ? matches / keywords.length : 0
  }

  private calculateTagMatchScore(resource: LearningResource, keywords: string[]): number {
    const resourceTags = resource.tags.map(tag => tag.toLowerCase())
    const keywordSet = new Set(keywords.map(k => k.toLowerCase()))
    
    let matches = 0
    for (const tag of resourceTags) {
      if (keywordSet.has(tag)) {
        matches++
      }
    }
    
    return resourceTags.length > 0 ? matches / resourceTags.length : 0
  }

  private calculateDifficultyMatch(resource: LearningResource, userTrainingLevel: number): number {
    const resourceLevel = resource.difficulty_level || 1
    const levelDifference = Math.abs(resourceLevel - userTrainingLevel)
    
    if (levelDifference === 0) return 1.0
    if (levelDifference === 1) return 0.8
    if (levelDifference === 2) return 0.6
    return 0.4
  }

  private getResourceTypeScore(type: ResourceType): number {
    // Preference scores for different resource types
    const typeScores: Record<ResourceType, number> = {
      'video': 0.9,      // Generally preferred for learning
      'case-study': 0.8, // Highly relevant for crisis training
      'textbook': 0.7,   // Comprehensive but time-consuming
      'paper': 0.6       // Academic but may be dense
    }
    
    return typeScores[type] || 0.5
  }

  private calculateRecencyScore(resource: LearningResource): number {
    const resourceDate = new Date(resource.created_at)
    const now = new Date()
    const daysDifference = (now.getTime() - resourceDate.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysDifference <= 30) return 1.0    // Very recent
    if (daysDifference <= 90) return 0.8    // Recent
    if (daysDifference <= 365) return 0.6   // Within a year
    return 0.4 // Older content
  }

  private resourceMatchesPattern(resource: LearningResource, pattern: ImpactPattern): boolean {
    const resourceText = [resource.title, resource.description || ''].join(' ').toLowerCase()
    
    const patternKeywords: Record<string, string[]> = {
      'immediate-heavy': ['immediate', 'instant', 'direct', 'rapid'],
      'delayed-heavy': ['long-term', 'delayed', 'future', 'cascading'],
      'high-severity': ['critical', 'severe', 'major', 'significant']
    }
    
    const keywords = patternKeywords[pattern.type] || []
    return keywords.some(keyword => resourceText.includes(keyword))
  }

  private findMatchingKeywords(resource: LearningResource, keywords: string[]): string[] {
    const resourceText = [
      resource.title,
      resource.description || '',
      ...resource.tags,
      ...resource.relevance_keywords
    ].join(' ').toLowerCase()
    
    return keywords.filter(keyword => resourceText.includes(keyword.toLowerCase()))
  }

  private determineLearningPath(resource: LearningResource, preferences: UserLearningPreferences): string {
    const resourceTime = resource.estimated_time_minutes || 60
    const difficulty = resource.difficulty_level || 1
    
    if (resource.type === 'case-study') {
      return 'practical-application'
    } else if (difficulty > preferences.trainingLevel + 1) {
      return 'advanced-track'
    } else if (resourceTime > preferences.availableTimeMinutes) {
      return 'extended-learning'
    } else {
      return 'core-curriculum'
    }
  }

  private estimateEffectiveness(
    resource: LearningResource,
    scoreResult: ScoreResult,
    preferences: UserLearningPreferences
  ): number {
    let effectiveness = 0.5 // Base effectiveness
    
    // Resource type effectiveness for crisis training
    const typeEffectiveness: Record<ResourceType, number> = {
      'case-study': 0.9,
      'video': 0.8,
      'textbook': 0.7,
      'paper': 0.6
    }
    
    effectiveness += (typeEffectiveness[resource.type] || 0.5) * 0.3
    
    // Difficulty match effectiveness
    const difficultyMatch = this.calculateDifficultyMatch(resource, preferences.trainingLevel)
    effectiveness += difficultyMatch * 0.2
    
    return Math.min(1.0, effectiveness)
  }

  private generateRecommendationReason(
    resource: RankedResource & { personalizedScore: number },
    scoreResult: ScoreResult
  ): string {
    const weakestArea = scoreResult.breakdown
      .sort((a, b) => a.score - b.score)[0]?.category
    
    if (resource.matchingKeywords.length > 3) {
      return `Highly relevant to your decision patterns (${resource.matchingKeywords.slice(0, 3).join(', ')})`
    } else if (weakestArea && resource.matchingKeywords.some(k => 
      weakestArea.toLowerCase().includes(k.toLowerCase())
    )) {
      return `Addresses your weakest area: ${weakestArea}`
    } else if (resource.personalizedScore > 0.8) {
      return 'Matches your learning preferences and training level'
    } else {
      return 'Relevant to crisis decision-making skills'
    }
  }

  private extractKeywordsFromText(text: string): string[] {
    // Simple keyword extraction - in production, use NLP libraries
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word))
      .slice(0, 10)
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      'this', 'that', 'with', 'from', 'they', 'will', 'have', 'been',
      'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there',
      'could', 'other', 'after', 'first', 'well', 'also', 'where', 'much'
    ]
    return stopWords.includes(word.toLowerCase())
  }
}

// Type definitions
export interface RankedResource {
  resource: LearningResource
  relevanceScore: number
  matchingKeywords: string[]
  difficultyMatch: number
}

export interface PersonalizedRecommendation {
  resource: LearningResource
  relevanceScore: number
  personalizedScore: number
  matchingKeywords: string[]
  learningPath: string
  estimatedEffectiveness: number
  recommendationReason: string
}

export interface UserLearningPreferences {
  riskProfile: RiskProfile
  trainingLevel: number
  preferredResourceTypes: ResourceType[]
  availableTimeMinutes: number
  focusAreas: string[]
}

interface ImpactPattern {
  type: string
  strength: number
}