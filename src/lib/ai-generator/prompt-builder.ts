import { GenerationContext, PromptTemplate } from './types';

/**
 * Builder for constructing context-aware prompts for Gemini API
 */
export class PromptBuilder {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Build a complete prompt for scenario generation
   */
  buildScenarioPrompt(context: GenerationContext): string {
    const template = this.templates.get('scenario');
    if (!template) {
      throw new Error('Scenario template not found');
    }

    const systemPrompt = this.interpolateTemplate(template.system, context);
    const userPrompt = this.interpolateTemplate(template.user, context);
    const contextPrompt = this.buildContextSection(context);

    return `${systemPrompt}\n\n${contextPrompt}\n\n${userPrompt}`;
  }

  /**
   * Build a prompt for character interaction
   */
  buildCharacterPrompt(context: GenerationContext, characterName: string, userMessage: string): string {
    const template = this.templates.get('character');
    if (!template) {
      throw new Error('Character template not found');
    }

    const characterContext = {
      ...context,
      characterName,
      userMessage,
      currentState: context.currentState || 'ongoing crisis'
    };

    return this.interpolateTemplate(template.user, characterContext);
  }

  /**
   * Build a prompt for adaptive content generation
   */
  buildAdaptivePrompt(context: GenerationContext, trigger: string): string {
    const template = this.templates.get('adaptive');
    if (!template) {
      throw new Error('Adaptive template not found');
    }

    const adaptiveContext = {
      ...context,
      trigger,
      recentDecisions: context.previousDecisions?.slice(-3) || []
    };

    return this.interpolateTemplate(template.user, adaptiveContext);
  }

  /**
   * Build context section with user parameters
   */
  private buildContextSection(context: GenerationContext): string {
    const sections = [
      `**Domain:** ${context.domain}`,
      `**Job Role:** ${context.jobRole}`,
      `**Risk Profile:** ${context.riskProfile}`,
    ];

    if (context.currentState) {
      sections.push(`**Current Situation:** ${context.currentState}`);
    }

    if (context.previousDecisions && context.previousDecisions.length > 0) {
      sections.push(`**Previous Decisions:** ${context.previousDecisions.join(', ')}`);
    }

    if (context.scenarioHistory && context.scenarioHistory.length > 0) {
      const recentHistory = context.scenarioHistory.slice(-2);
      sections.push(`**Recent Training History:** ${recentHistory.join('; ')}`);
    }

    return sections.join('\n');
  }

  /**
   * Interpolate template with context variables
   */
  private interpolateTemplate(template: string, context: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = context[key];
      if (value === undefined) {
        console.warn(`Template variable '${key}' not found in context`);
        return match;
      }
      return Array.isArray(value) ? value.join(', ') : String(value);
    });
  }

  /**
   * Initialize prompt templates
   */
  private initializeTemplates(): void {
    // Scenario generation template
    this.templates.set('scenario', {
      system: `You are an expert crisis simulation designer. Create realistic, high-stakes crisis scenarios for professional decision-making training. 

Your scenarios should:
- Be domain-specific and technically accurate
- Present genuine dilemmas with no obvious "right" answer
- Include time pressure and incomplete information
- Feature realistic stakeholders with conflicting interests
- Have cascading consequences that test second-order thinking

Return your response as a JSON object with this exact structure:
{
  "scenario": "Detailed crisis description (200-400 words)",
  "characters": [
    {
      "id": "unique_id",
      "name": "Character Name",
      "role": "Their position/title",
      "personality": "Key personality traits",
      "motivations": ["primary motivation", "secondary motivation"]
    }
  ],
  "environmentalFactors": ["factor1", "factor2", "factor3"],
  "adaptiveElements": ["element1", "element2"],
  "metadata": {
    "complexity": 1-5,
    "estimatedDuration": 5-20,
    "tags": ["relevant", "tags"]
  }
}`,
      user: `Generate a crisis scenario for:
Domain: {{domain}}
Role: {{jobRole}}
Risk Profile: {{riskProfile}}

The scenario should challenge decision-making skills appropriate for someone in {{jobRole}} within {{domain}}. 
Consider their {{riskProfile}} risk tolerance when designing the complexity and stakes.

Make it realistic, engaging, and educational.`,
      context: ''
    });

    // Character interaction template
    this.templates.set('character', {
      system: `You are roleplaying as {{characterName}} in a crisis scenario. Stay in character and respond realistically based on your role, personality, and motivations. Keep responses concise but authentic.`,
      user: `As {{characterName}}, respond to this message: "{{userMessage}}"

Context: {{currentState}}
Your role and motivations should guide your response. Be realistic about what information you would or wouldn't share, and how you would react under pressure.`,
      context: ''
    });

    // Adaptive content template
    this.templates.set('adaptive', {
      system: `You are a crisis scenario engine. Generate adaptive content that responds to user decisions and evolves the scenario naturally.`,
      user: `The scenario has evolved due to: {{trigger}}

Previous decisions: {{recentDecisions}}
Current context: {{currentState}}

Generate 2-3 new environmental factors or complications that would realistically emerge from this situation. Keep them concise and impactful.

Return as JSON array: ["factor1", "factor2", "factor3"]`,
      context: ''
    });

    // Feedback generation template
    this.templates.set('feedback', {
      system: `You are an expert crisis management instructor. Provide constructive feedback on decision-making performance.`,
      user: `Analyze this decision sequence and provide educational feedback:

Domain: {{domain}}
Decisions made: {{previousDecisions}}
Outcomes: {{outcomes}}

Provide:
1. What went well
2. Areas for improvement  
3. Alternative approaches
4. Key learning points

Be specific and actionable.`,
      context: ''
    });
  }

  /**
   * Add or update a custom template
   */
  addTemplate(name: string, template: PromptTemplate): void {
    this.templates.set(name, template);
  }

  /**
   * Get available template names
   */
  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Validate template syntax
   */
  validateTemplate(template: PromptTemplate): boolean {
    try {
      // Check for balanced template variables
      const variables = template.user.match(/\{\{(\w+)\}\}/g) || [];
      const systemVariables = template.system.match(/\{\{(\w+)\}\}/g) || [];
      
      // Basic validation - ensure no malformed variables
      const allVariables = [...variables, ...systemVariables];
      return allVariables.every(variable => 
        variable.startsWith('{{') && variable.endsWith('}}')
      );
    } catch {
      return false;
    }
  }

  /**
   * Get template preview with sample context
   */
  previewTemplate(templateName: string, sampleContext: GenerationContext): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return this.interpolateTemplate(template.user, sampleContext);
  }
}