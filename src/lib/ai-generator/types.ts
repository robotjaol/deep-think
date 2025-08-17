/**
 * Types and interfaces for AI content generation
 */

export interface GenerationContext {
  domain: string;
  jobRole: string;
  riskProfile: 'conservative' | 'balanced' | 'aggressive';
  scenarioHistory: string[];
  currentState?: string;
  previousDecisions?: string[];
}

export interface Character {
  id: string;
  name: string;
  role: string;
  personality: string;
  motivations: string[];
}

export interface GeneratedContent {
  scenario: string;
  characters: Character[];
  environmentalFactors: string[];
  adaptiveElements: string[];
  metadata: {
    complexity: number;
    estimatedDuration: number;
    tags: string[];
  };
}

export interface PromptTemplate {
  system: string;
  user: string;
  context: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'content' | 'structure' | 'quality' | 'safety';
  severity: 'low' | 'medium' | 'high';
  message: string;
  field?: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
}

export interface GenerationOptions {
  maxRetries: number;
  timeout: number;
  fallbackContent?: Partial<GeneratedContent>;
  validateContent: boolean;
}