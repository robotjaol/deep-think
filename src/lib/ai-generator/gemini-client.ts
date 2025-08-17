import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GeminiConfig, GenerationOptions, GeneratedContent } from './types';

/**
 * Client for interacting with Google's Gemini API
 */
export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.model,
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        topP: config.topP,
        topK: config.topK,
      },
    });
  }

  /**
   * Generate content using Gemini API
   */
  async generateContent(
    prompt: string, 
    options: GenerationOptions = this.getDefaultOptions()
  ): Promise<GeneratedContent> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < options.maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          this.model.generateContent(prompt),
          this.createTimeoutPromise(options.timeout)
        ]);

        const response = await result.response;
        const text = response.text();
        
        if (!text) {
          throw new Error('Empty response from Gemini API');
        }

        const parsedContent = this.parseGeneratedContent(text);
        
        if (options.validateContent) {
          // Basic validation - more comprehensive validation handled by ContentValidator
          if (!parsedContent.scenario || parsedContent.scenario.length < 50) {
            throw new Error('Generated scenario is too short or empty');
          }
        }

        return parsedContent;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Gemini API attempt ${attempt + 1} failed:`, error);
        
        if (attempt < options.maxRetries - 1) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // If all retries failed, return fallback content or throw error
    if (options.fallbackContent) {
      console.warn('Using fallback content due to API failures');
      return this.createFallbackContent(options.fallbackContent);
    }

    throw new Error(`Gemini API failed after ${options.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Generate content with streaming response
   */
  async generateContentStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options: GenerationOptions = this.getDefaultOptions()
  ): Promise<GeneratedContent> {
    try {
      const result = await this.model.generateContentStream(prompt);
      let fullText = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(chunkText);
      }

      return this.parseGeneratedContent(fullText);
    } catch (error) {
      console.error('Streaming generation failed:', error);
      throw error;
    }
  }

  /**
   * Parse the raw text response into structured content
   */
  private parseGeneratedContent(text: string): GeneratedContent {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(text);
      return this.validateAndNormalizeContent(parsed);
    } catch {
      // If not JSON, try to extract structured content from text
      return this.extractContentFromText(text);
    }
  }

  /**
   * Extract structured content from plain text response
   */
  private extractContentFromText(text: string): GeneratedContent {
    const lines = text.split('\n').filter(line => line.trim());
    
    let scenario = '';
    const characters: any[] = [];
    const environmentalFactors: string[] = [];
    const adaptiveElements: string[] = [];

    let currentSection = 'scenario';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes('character:')) {
        currentSection = 'characters';
        // Extract character info from the line
        const characterInfo = trimmed.replace(/character:\s*/i, '');
        if (characterInfo.length > 5) {
          characters.push({
            id: `char_${characters.length + 1}`,
            name: characterInfo.split(' ')[0] || `Character ${characters.length + 1}`,
            role: 'Stakeholder',
            personality: characterInfo,
            motivations: [characterInfo]
          });
        }
        continue;
      } else if (trimmed.toLowerCase().includes('environmental factor:')) {
        currentSection = 'environmental';
        const factorInfo = trimmed.replace(/environmental factor:\s*/i, '');
        if (factorInfo.length > 5) {
          environmentalFactors.push(factorInfo);
        }
        continue;
      } else if (trimmed.toLowerCase().includes('adaptive element:')) {
        currentSection = 'adaptive';
        const elementInfo = trimmed.replace(/adaptive element:\s*/i, '');
        if (elementInfo.length > 5) {
          adaptiveElements.push(elementInfo);
        }
        continue;
      }

      // If we're still in scenario section, add to scenario
      if (currentSection === 'scenario') {
        scenario += trimmed + ' ';
      }
    }

    return {
      scenario: scenario.trim() || 'A crisis situation has developed that requires immediate attention.',
      characters,
      environmentalFactors,
      adaptiveElements,
      metadata: {
        complexity: this.estimateComplexity(text),
        estimatedDuration: Math.max(5, Math.floor(text.length / 100)),
        tags: this.extractTags(text)
      }
    };
  }

  /**
   * Validate and normalize parsed content
   */
  private validateAndNormalizeContent(content: any): GeneratedContent {
    return {
      scenario: content.scenario || 'A crisis situation requires your immediate attention.',
      characters: Array.isArray(content.characters) ? content.characters : [],
      environmentalFactors: Array.isArray(content.environmentalFactors) ? content.environmentalFactors : [],
      adaptiveElements: Array.isArray(content.adaptiveElements) ? content.adaptiveElements : [],
      metadata: {
        complexity: content.metadata?.complexity || 3,
        estimatedDuration: content.metadata?.estimatedDuration || 10,
        tags: Array.isArray(content.metadata?.tags) ? content.metadata.tags : []
      }
    };
  }

  /**
   * Create fallback content when API fails
   */
  private createFallbackContent(fallback: Partial<GeneratedContent>): GeneratedContent {
    return {
      scenario: fallback.scenario || 'A critical situation has emerged that requires immediate decision-making.',
      characters: fallback.characters || [],
      environmentalFactors: fallback.environmentalFactors || ['Time pressure', 'Limited information'],
      adaptiveElements: fallback.adaptiveElements || ['Evolving situation'],
      metadata: {
        complexity: fallback.metadata?.complexity || 2,
        estimatedDuration: fallback.metadata?.estimatedDuration || 5,
        tags: fallback.metadata?.tags || ['fallback']
      }
    };
  }

  /**
   * Estimate content complexity based on text analysis
   */
  private estimateComplexity(text: string): number {
    const factors = [
      text.length > 500 ? 1 : 0,
      (text.match(/\b(and|but|however|therefore|because)\b/gi) || []).length > 5 ? 1 : 0,
      (text.match(/\b(stakeholder|impact|consequence|risk)\b/gi) || []).length > 3 ? 1 : 0,
      text.split('.').length > 10 ? 1 : 0
    ];
    
    return Math.max(1, Math.min(5, factors.reduce((sum, factor) => sum + factor, 1)));
  }

  /**
   * Extract relevant tags from content
   */
  private extractTags(text: string): string[] {
    const commonTags = [
      'cybersecurity', 'healthcare', 'aerospace', 'finance', 'emergency',
      'leadership', 'communication', 'risk-management', 'crisis', 'decision-making'
    ];
    
    return commonTags.filter(tag => 
      text.toLowerCase().includes(tag.replace('-', ' '))
    );
  }

  /**
   * Create a timeout promise for API calls
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timeout')), timeout);
    });
  }

  /**
   * Delay utility for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get default generation options
   */
  private getDefaultOptions(): GenerationOptions {
    return {
      maxRetries: 3,
      timeout: 30000,
      validateContent: true
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        topP: this.config.topP,
        topK: this.config.topK,
      },
    });
  }
}