/**
 * Example usage of the AI Generator components
 * This file demonstrates how to use the Gemini API integration
 */

import { createAIGenerator, GenerationContext } from './index';

// Example usage function
export async function generateScenarioExample() {
  try {
    // Create AI generator with default configuration
    const { client, promptBuilder, validator } = createAIGenerator();

    // Define generation context
    const context: GenerationContext = {
      domain: 'cybersecurity',
      jobRole: 'Security Analyst',
      riskProfile: 'balanced',
      scenarioHistory: [
        'Previous phishing attack simulation',
        'Network intrusion response training'
      ],
      currentState: 'Active incident response',
      previousDecisions: [
        'Isolated affected systems',
        'Notified stakeholders',
        'Initiated forensic analysis'
      ]
    };

    // Build prompt for scenario generation
    const prompt = promptBuilder.buildScenarioPrompt(context);
    console.log('Generated prompt:', prompt);

    // Generate content using Gemini API
    const generatedContent = await client.generateContent(prompt, {
      maxRetries: 3,
      timeout: 30000,
      validateContent: true
    });

    // Validate the generated content
    const validationResult = validator.validate(generatedContent);
    
    if (validationResult.isValid) {
      console.log('✅ Content validation passed');
      console.log('Generated scenario:', generatedContent.scenario);
      console.log('Characters:', generatedContent.characters);
      console.log('Environmental factors:', generatedContent.environmentalFactors);
      console.log('Adaptive elements:', generatedContent.adaptiveElements);
    } else {
      console.log('❌ Content validation failed');
      console.log('Issues:', validationResult.issues);
      console.log('Suggestions:', validationResult.suggestions);
    }

    return generatedContent;

  } catch (error) {
    console.error('Error generating scenario:', error);
    throw error;
  }
}

// Example character interaction
export async function characterInteractionExample() {
  try {
    const { client, promptBuilder } = createAIGenerator();

    const context: GenerationContext = {
      domain: 'healthcare',
      jobRole: 'Emergency Room Doctor',
      riskProfile: 'conservative',
      scenarioHistory: [],
      currentState: 'Multiple trauma patients arriving simultaneously'
    };

    // Build character interaction prompt
    const characterPrompt = promptBuilder.buildCharacterPrompt(
      context,
      'Head Nurse',
      'What is the current status of bed availability?'
    );

    // Generate character response
    const response = await client.generateContent(characterPrompt, {
      maxRetries: 2,
      timeout: 15000,
      validateContent: false // Character responses don't need full validation
    });

    console.log('Character response:', response.scenario);
    return response;

  } catch (error) {
    console.error('Error in character interaction:', error);
    throw error;
  }
}

// Example adaptive content generation
export async function adaptiveContentExample() {
  try {
    const { client, promptBuilder, validator } = createAIGenerator();

    const context: GenerationContext = {
      domain: 'aerospace',
      jobRole: 'Flight Controller',
      riskProfile: 'aggressive',
      scenarioHistory: [],
      currentState: 'Spacecraft experiencing system anomalies',
      previousDecisions: [
        'Switched to backup power',
        'Initiated emergency protocols'
      ]
    };

    // Generate adaptive content based on new trigger
    const adaptivePrompt = promptBuilder.buildAdaptivePrompt(
      context,
      'Communication system failure detected'
    );

    const adaptiveContent = await client.generateContent(adaptivePrompt);
    
    // Quick validation
    const isValid = validator.quickValidate(adaptiveContent);
    console.log('Adaptive content valid:', isValid);
    
    return adaptiveContent;

  } catch (error) {
    console.error('Error generating adaptive content:', error);
    throw error;
  }
}

// Example with custom configuration
export async function customConfigExample() {
  try {
    const customGenerator = createAIGenerator({
      temperature: 0.9, // More creative
      maxTokens: 1024,  // Shorter responses
      topP: 0.9
    });

    const context: GenerationContext = {
      domain: 'finance',
      jobRole: 'Risk Manager',
      riskProfile: 'conservative',
      scenarioHistory: []
    };

    const prompt = customGenerator.promptBuilder.buildScenarioPrompt(context);
    const content = await customGenerator.client.generateContent(prompt);
    
    const validation = customGenerator.validator.validate(content);
    const summary = customGenerator.validator.getValidationSummary(validation);
    
    console.log('Validation summary:', summary);
    return content;

  } catch (error) {
    console.error('Error with custom configuration:', error);
    throw error;
  }
}

// Example error handling and fallback
export async function errorHandlingExample() {
  try {
    const { client } = createAIGenerator();

    const fallbackContent = {
      scenario: 'A critical system failure has occurred requiring immediate decision-making.',
      characters: [{
        id: 'fallback_char',
        name: 'System Administrator',
        role: 'Technical Lead',
        personality: 'Calm under pressure',
        motivations: ['System recovery', 'Minimize downtime']
      }],
      environmentalFactors: ['Time pressure', 'Limited information'],
      adaptiveElements: ['Evolving situation'],
      metadata: {
        complexity: 3,
        estimatedDuration: 10,
        tags: ['fallback', 'system-failure']
      }
    };

    // This will use fallback content if API fails
    const content = await client.generateContent('Generate a scenario', {
      maxRetries: 1,
      timeout: 5000,
      fallbackContent,
      validateContent: true
    });

    console.log('Content generated (possibly fallback):', content);
    return content;

  } catch (error) {
    console.error('All generation methods failed:', error);
    throw error;
  }
}

// Export all examples for easy testing
export const examples = {
  generateScenarioExample,
  characterInteractionExample,
  adaptiveContentExample,
  customConfigExample,
  errorHandlingExample
};