import { GeneratedContent, ValidationResult, ValidationIssue } from './types';

/**
 * Validator for quality assurance of AI-generated content
 */
export class ContentValidator {
  private readonly minScenarioLength = 100;
  private readonly maxScenarioLength = 2000;
  private readonly minCharacters = 0;
  private readonly maxCharacters = 10;
  private readonly bannedWords = [
    'inappropriate', 'offensive', 'harmful', 'dangerous',
    'illegal', 'unethical', 'discriminatory'
  ];
  private readonly requiredElements = [
    'decision', 'choice', 'consequence', 'impact', 'stakeholder'
  ];

  /**
   * Validate generated content comprehensively
   */
  validate(content: GeneratedContent): ValidationResult {
    const issues: ValidationIssue[] = [];
    let score = 100;

    // Validate scenario content
    const scenarioIssues = this.validateScenario(content.scenario);
    issues.push(...scenarioIssues);
    score -= scenarioIssues.length * 10;

    // Validate characters
    const characterIssues = this.validateCharacters(content.characters);
    issues.push(...characterIssues);
    score -= characterIssues.length * 5;

    // Validate environmental factors
    const environmentalIssues = this.validateEnvironmentalFactors(content.environmentalFactors);
    issues.push(...environmentalIssues);
    score -= environmentalIssues.length * 3;

    // Validate adaptive elements
    const adaptiveIssues = this.validateAdaptiveElements(content.adaptiveElements);
    issues.push(...adaptiveIssues);
    score -= adaptiveIssues.length * 3;

    // Validate metadata
    const metadataIssues = this.validateMetadata(content.metadata);
    issues.push(...metadataIssues);
    score -= metadataIssues.length * 2;

    // Overall content quality checks
    const qualityIssues = this.validateOverallQuality(content);
    issues.push(...qualityIssues);
    score -= qualityIssues.length * 15;

    const finalScore = Math.max(0, Math.min(100, score));
    const isValid = finalScore >= 60 && !issues.some(issue => issue.severity === 'high');

    return {
      isValid,
      score: finalScore,
      issues,
      suggestions: this.generateSuggestions(issues, content)
    };
  }

  /**
   * Validate scenario text content
   */
  private validateScenario(scenario: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!scenario || scenario.trim().length === 0) {
      issues.push({
        type: 'content',
        severity: 'high',
        message: 'Scenario content is empty',
        field: 'scenario'
      });
      return issues;
    }

    const trimmedScenario = scenario.trim();

    // Length validation
    if (trimmedScenario.length < this.minScenarioLength) {
      issues.push({
        type: 'content',
        severity: 'medium',
        message: `Scenario is too short (${trimmedScenario.length} chars, minimum ${this.minScenarioLength})`,
        field: 'scenario'
      });
    }

    if (trimmedScenario.length > this.maxScenarioLength) {
      issues.push({
        type: 'content',
        severity: 'medium',
        message: `Scenario is too long (${trimmedScenario.length} chars, maximum ${this.maxScenarioLength})`,
        field: 'scenario'
      });
    }

    // Content quality validation
    const sentences = trimmedScenario.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 3) {
      issues.push({
        type: 'quality',
        severity: 'medium',
        message: 'Scenario lacks sufficient detail (too few sentences)',
        field: 'scenario'
      });
    }

    // Check for required elements
    const lowerScenario = trimmedScenario.toLowerCase();
    const missingElements = this.requiredElements.filter(element => 
      !lowerScenario.includes(element)
    );

    if (missingElements.length > 2) {
      issues.push({
        type: 'quality',
        severity: 'medium',
        message: `Scenario missing key elements: ${missingElements.join(', ')}`,
        field: 'scenario'
      });
    }

    // Safety validation
    const safetyIssues = this.checkContentSafety(trimmedScenario);
    issues.push(...safetyIssues.map(issue => ({ ...issue, field: 'scenario' })));

    return issues;
  }

  /**
   * Validate character definitions
   */
  private validateCharacters(characters: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!Array.isArray(characters)) {
      issues.push({
        type: 'structure',
        severity: 'medium',
        message: 'Characters should be an array',
        field: 'characters'
      });
      return issues;
    }

    if (characters.length < this.minCharacters) {
      // This is actually okay - scenarios might not need characters
    }

    if (characters.length > this.maxCharacters) {
      issues.push({
        type: 'content',
        severity: 'medium',
        message: `Too many characters (${characters.length}, maximum ${this.maxCharacters})`,
        field: 'characters'
      });
    }

    characters.forEach((character, index) => {
      if (!character.id || typeof character.id !== 'string') {
        issues.push({
          type: 'structure',
          severity: 'medium',
          message: `Character ${index + 1} missing or invalid ID`,
          field: `characters[${index}].id`
        });
      }

      if (!character.name || typeof character.name !== 'string' || character.name.trim().length === 0) {
        issues.push({
          type: 'content',
          severity: 'medium',
          message: `Character ${index + 1} missing or empty name`,
          field: `characters[${index}].name`
        });
      }

      if (!character.role || typeof character.role !== 'string' || character.role.trim().length === 0) {
        issues.push({
          type: 'content',
          severity: 'low',
          message: `Character ${index + 1} missing or empty role`,
          field: `characters[${index}].role`
        });
      }

      if (character.motivations && !Array.isArray(character.motivations)) {
        issues.push({
          type: 'structure',
          severity: 'low',
          message: `Character ${index + 1} motivations should be an array`,
          field: `characters[${index}].motivations`
        });
      }
    });

    return issues;
  }

  /**
   * Validate environmental factors
   */
  private validateEnvironmentalFactors(factors: string[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!Array.isArray(factors)) {
      issues.push({
        type: 'structure',
        severity: 'medium',
        message: 'Environmental factors should be an array',
        field: 'environmentalFactors'
      });
      return issues;
    }

    if (factors.length === 0) {
      issues.push({
        type: 'content',
        severity: 'low',
        message: 'No environmental factors provided',
        field: 'environmentalFactors'
      });
    }

    factors.forEach((factor, index) => {
      if (typeof factor !== 'string' || factor.trim().length === 0) {
        issues.push({
          type: 'content',
          severity: 'low',
          message: `Environmental factor ${index + 1} is empty or invalid`,
          field: `environmentalFactors[${index}]`
        });
      }

      if (factor.length > 200) {
        issues.push({
          type: 'content',
          severity: 'low',
          message: `Environmental factor ${index + 1} is too long`,
          field: `environmentalFactors[${index}]`
        });
      }
    });

    return issues;
  }

  /**
   * Validate adaptive elements
   */
  private validateAdaptiveElements(elements: string[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!Array.isArray(elements)) {
      issues.push({
        type: 'structure',
        severity: 'medium',
        message: 'Adaptive elements should be an array',
        field: 'adaptiveElements'
      });
      return issues;
    }

    elements.forEach((element, index) => {
      if (typeof element !== 'string' || element.trim().length === 0) {
        issues.push({
          type: 'content',
          severity: 'low',
          message: `Adaptive element ${index + 1} is empty or invalid`,
          field: `adaptiveElements[${index}]`
        });
      }
    });

    return issues;
  }

  /**
   * Validate metadata
   */
  private validateMetadata(metadata: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!metadata || typeof metadata !== 'object') {
      issues.push({
        type: 'structure',
        severity: 'medium',
        message: 'Metadata is missing or invalid',
        field: 'metadata'
      });
      return issues;
    }

    if (typeof metadata.complexity !== 'number' || metadata.complexity < 1 || metadata.complexity > 5) {
      issues.push({
        type: 'content',
        severity: 'low',
        message: 'Complexity should be a number between 1 and 5',
        field: 'metadata.complexity'
      });
    }

    if (typeof metadata.estimatedDuration !== 'number' || metadata.estimatedDuration < 1) {
      issues.push({
        type: 'content',
        severity: 'low',
        message: 'Estimated duration should be a positive number',
        field: 'metadata.estimatedDuration'
      });
    }

    if (!Array.isArray(metadata.tags)) {
      issues.push({
        type: 'structure',
        severity: 'low',
        message: 'Tags should be an array',
        field: 'metadata.tags'
      });
    }

    return issues;
  }

  /**
   * Validate overall content quality
   */
  private validateOverallQuality(content: GeneratedContent): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for coherence between scenario and characters
    if (Array.isArray(content.characters) && content.characters.length > 0) {
      const scenarioLower = content.scenario.toLowerCase();
      const mentionedCharacters = content.characters.filter(char => 
        scenarioLower.includes(char.name.toLowerCase()) || 
        scenarioLower.includes(char.role.toLowerCase())
      );

      if (mentionedCharacters.length === 0) {
        issues.push({
          type: 'quality',
          severity: 'medium',
          message: 'Characters are not referenced in the scenario',
          field: 'overall'
        });
      }
    }

    // Check for realistic complexity
    if (content.metadata && typeof content.metadata.complexity === 'number') {
      const wordCount = content.scenario.split(/\s+/).length;
      const expectedComplexity = Math.min(5, Math.max(1, Math.floor(wordCount / 50)));
      
      if (Math.abs(content.metadata.complexity - expectedComplexity) > 2) {
        issues.push({
          type: 'quality',
          severity: 'low',
          message: 'Complexity rating may not match content depth',
          field: 'metadata.complexity'
        });
      }
    }

    return issues;
  }

  /**
   * Check content for safety issues
   */
  private checkContentSafety(text: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lowerText = text.toLowerCase();

    for (const bannedWord of this.bannedWords) {
      if (lowerText.includes(bannedWord)) {
        issues.push({
          type: 'safety',
          severity: 'high',
          message: `Content contains potentially inappropriate term: ${bannedWord}`
        });
      }
    }

    // Check for excessive violence or graphic content
    const violenceKeywords = ['kill', 'death', 'blood', 'violence', 'murder'];
    const violenceCount = violenceKeywords.filter(word => lowerText.includes(word)).length;
    
    if (violenceCount > 2) {
      issues.push({
        type: 'safety',
        severity: 'medium',
        message: 'Content may contain excessive violent themes'
      });
    }

    return issues;
  }

  /**
   * Generate improvement suggestions based on validation issues
   */
  private generateSuggestions(issues: ValidationIssue[], content: GeneratedContent): string[] {
    const suggestions: string[] = [];

    const hasContentIssues = issues.some(issue => issue.type === 'content');
    const hasQualityIssues = issues.some(issue => issue.type === 'quality');
    const hasStructureIssues = issues.some(issue => issue.type === 'structure');

    if (hasContentIssues) {
      suggestions.push('Consider regenerating content with more specific prompts');
      suggestions.push('Ensure all required fields are properly populated');
    }

    if (hasQualityIssues) {
      suggestions.push('Add more detail to the scenario description');
      suggestions.push('Include more specific stakeholder motivations');
      suggestions.push('Ensure characters are relevant to the scenario');
    }

    if (hasStructureIssues) {
      suggestions.push('Verify the response format matches expected structure');
      suggestions.push('Check that all arrays and objects are properly formatted');
    }

    const highSeverityIssues = issues.filter(issue => issue.severity === 'high');
    if (highSeverityIssues.length > 0) {
      suggestions.push('Address high-severity issues before using this content');
    }

    if (content.scenario.length < this.minScenarioLength) {
      suggestions.push('Expand the scenario with more context and detail');
    }

    if (content.characters.length === 0) {
      suggestions.push('Consider adding relevant stakeholders or characters');
    }

    return suggestions;
  }

  /**
   * Quick validation for basic content requirements
   */
  quickValidate(content: GeneratedContent): boolean {
    return !!(
      content.scenario &&
      content.scenario.trim().length >= this.minScenarioLength &&
      Array.isArray(content.characters) &&
      Array.isArray(content.environmentalFactors) &&
      Array.isArray(content.adaptiveElements) &&
      content.metadata &&
      typeof content.metadata.complexity === 'number'
    );
  }

  /**
   * Get validation summary
   */
  getValidationSummary(result: ValidationResult): string {
    const { isValid, score, issues } = result;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;

    return `Validation ${isValid ? 'PASSED' : 'FAILED'} (Score: ${score}/100) - ` +
           `Issues: ${highIssues} high, ${mediumIssues} medium, ${lowIssues} low`;
  }
}