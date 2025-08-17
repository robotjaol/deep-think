/**
 * AI Content Generation Module
 * 
 * This module provides integration with Google's Gemini API for generating
 * dynamic crisis scenario content, character interactions, and adaptive elements.
 */

import { GeminiClient } from './gemini-client';
import { PromptBuilder } from './prompt-builder';
import { ContentValidator } from './content-validator';
import type { ValidationIssue } from './types';

export { GeminiClient, PromptBuilder, ContentValidator };

export type {
  GenerationContext,
  Character,
  GeneratedContent,
  PromptTemplate,
  ValidationResult,
  ValidationIssue,
  GeminiConfig,
  GenerationOptions
} from './types';

import { GeminiConfig } from './types';

// Default configuration factory
export function createDefaultGeminiConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  return {
    apiKey,
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.8,
    topK: 40
  };
}

// Convenience factory for creating a complete AI generator setup
export function createAIGenerator(config?: Partial<GeminiConfig>) {
  const fullConfig = { ...createDefaultGeminiConfig(), ...config };
  
  return {
    client: new GeminiClient(fullConfig),
    promptBuilder: new PromptBuilder(),
    validator: new ContentValidator()
  };
}

// Error classes for better error handling
export class AIGenerationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'AIGenerationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly issues: ValidationIssue[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}