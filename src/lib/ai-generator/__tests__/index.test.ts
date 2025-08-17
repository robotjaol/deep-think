import {
  GeminiClient,
  PromptBuilder,
  ContentValidator,
  createDefaultGeminiConfig,
  createAIGenerator,
  AIGenerationError,
  ValidationError,
  ConfigurationError
} from '../index';

// Mock environment variable
const originalEnv = process.env;

describe('AI Generator Index', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('exports', () => {
    it('should export all main classes', () => {
      expect(GeminiClient).toBeDefined();
      expect(PromptBuilder).toBeDefined();
      expect(ContentValidator).toBeDefined();
    });

    it('should export factory functions', () => {
      expect(createDefaultGeminiConfig).toBeDefined();
      expect(createAIGenerator).toBeDefined();
    });

    it('should export error classes', () => {
      expect(AIGenerationError).toBeDefined();
      expect(ValidationError).toBeDefined();
      expect(ConfigurationError).toBeDefined();
    });
  });

  describe('createDefaultGeminiConfig', () => {
    it('should create default config with API key from environment', () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const config = createDefaultGeminiConfig();

      expect(config).toEqual({
        apiKey: 'test-api-key',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.8,
        topK: 40
      });
    });

    it('should throw error when API key is missing', () => {
      delete process.env.GEMINI_API_KEY;

      expect(() => createDefaultGeminiConfig())
        .toThrow('GEMINI_API_KEY environment variable is required');
    });
  });

  describe('createAIGenerator', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should create complete AI generator setup', () => {
      const generator = createAIGenerator();

      expect(generator.client).toBeInstanceOf(GeminiClient);
      expect(generator.promptBuilder).toBeInstanceOf(PromptBuilder);
      expect(generator.validator).toBeInstanceOf(ContentValidator);
    });

    it('should accept custom configuration', () => {
      const customConfig = { temperature: 0.9 };
      const generator = createAIGenerator(customConfig);

      expect(generator.client).toBeInstanceOf(GeminiClient);
      expect(generator.promptBuilder).toBeInstanceOf(PromptBuilder);
      expect(generator.validator).toBeInstanceOf(ContentValidator);
    });
  });

  describe('error classes', () => {
    it('should create AIGenerationError correctly', () => {
      const originalError = new Error('Original error');
      const error = new AIGenerationError('Generation failed', originalError);

      expect(error.name).toBe('AIGenerationError');
      expect(error.message).toBe('Generation failed');
      expect(error.cause).toBe(originalError);
    });

    it('should create ValidationError correctly', () => {
      const issues = [
        {
          type: 'content' as const,
          severity: 'high' as const,
          message: 'Content issue'
        }
      ];
      const error = new ValidationError('Validation failed', issues);

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error.issues).toBe(issues);
    });

    it('should create ConfigurationError correctly', () => {
      const error = new ConfigurationError('Config error');

      expect(error.name).toBe('ConfigurationError');
      expect(error.message).toBe('Config error');
    });
  });

  describe('integration', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should work together in a typical workflow', () => {
      const generator = createAIGenerator();
      
      // Test that all components are properly initialized
      expect(generator.client).toBeDefined();
      expect(generator.promptBuilder).toBeDefined();
      expect(generator.validator).toBeDefined();

      // Test that prompt builder can create prompts
      const context = {
        domain: 'test',
        jobRole: 'tester',
        riskProfile: 'balanced' as const,
        scenarioHistory: []
      };

      const prompt = generator.promptBuilder.buildScenarioPrompt(context);
      expect(prompt).toContain('test');

      // Test that validator can validate content
      const content = {
        scenario: 'A test scenario with decision making and stakeholder impact consequences.',
        characters: [],
        environmentalFactors: ['Time pressure'],
        adaptiveElements: ['Evolving situation'],
        metadata: {
          complexity: 3,
          estimatedDuration: 10,
          tags: ['test']
        }
      };

      const validation = generator.validator.validate(content);
      expect(validation.isValid).toBe(true);
    });
  });
});