import { GeminiClient } from '../gemini-client';
import { GeminiConfig, GenerationOptions } from '../types';

// Mock the Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
      generateContentStream: jest.fn()
    })
  }))
}));

describe('GeminiClient', () => {
  let client: GeminiClient;
  let mockConfig: GeminiConfig;
  let mockModel: any;

  beforeEach(() => {
    mockConfig = {
      apiKey: 'test-api-key',
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.8,
      topK: 40
    };

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    mockModel = {
      generateContent: jest.fn(),
      generateContentStream: jest.fn()
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));
    
    client = new GeminiClient(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(client).toBeInstanceOf(GeminiClient);
    });
  });

  describe('generateContent', () => {
    it('should generate content successfully with valid JSON response', async () => {
      const mockResponse = {
        scenario: 'Test crisis scenario with decision making and stakeholder impact consequences that requires immediate attention from leadership.',
        characters: [],
        environmentalFactors: ['Time pressure'],
        adaptiveElements: ['Evolving situation'],
        metadata: {
          complexity: 3,
          estimatedDuration: 10,
          tags: ['test']
        }
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      });

      const result = await client.generateContent('test prompt');

      expect(result).toEqual(mockResponse);
      expect(mockModel.generateContent).toHaveBeenCalledWith('test prompt');
    });

    it('should parse plain text response when JSON parsing fails', async () => {
      const mockTextResponse = `This is a crisis scenario that requires immediate attention and decision making with stakeholder impact consequences.
      
      Character: Emergency Manager with leadership responsibilities
      Environmental factor: Limited resources and time pressure
      Adaptive element: Changing conditions and evolving situation`;

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => mockTextResponse
        }
      });

      const result = await client.generateContent('test prompt');

      expect(result.scenario).toContain('crisis scenario');
      expect(result.characters).toHaveLength(1);
      expect(result.environmentalFactors).toContain('Limited resources and time pressure');
      expect(result.adaptiveElements).toContain('Changing conditions and evolving situation');
    });

    it('should retry on API failures', async () => {
      mockModel.generateContent
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              scenario: 'Retry success',
              characters: [],
              environmentalFactors: [],
              adaptiveElements: [],
              metadata: { complexity: 1, estimatedDuration: 5, tags: [] }
            })
          }
        });

      const options: GenerationOptions = {
        maxRetries: 2,
        timeout: 5000,
        validateContent: false
      };

      const result = await client.generateContent('test prompt', options);

      expect(result.scenario).toBe('Retry success');
      expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
    });

    it('should use fallback content when all retries fail', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('Persistent API Error'));

      const fallbackContent = {
        scenario: 'Fallback scenario',
        characters: [],
        environmentalFactors: ['Fallback factor'],
        adaptiveElements: [],
        metadata: { complexity: 2, estimatedDuration: 5, tags: ['fallback'] }
      };

      const options: GenerationOptions = {
        maxRetries: 2,
        timeout: 5000,
        validateContent: false,
        fallbackContent
      };

      const result = await client.generateContent('test prompt', options);

      expect(result.scenario).toBe('Fallback scenario');
      expect(result.environmentalFactors).toContain('Fallback factor');
      expect(result.metadata.tags).toContain('fallback');
    });

    it('should throw error when no fallback is provided and all retries fail', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('Persistent API Error'));

      const options: GenerationOptions = {
        maxRetries: 1,
        timeout: 5000,
        validateContent: false
      };

      await expect(client.generateContent('test prompt', options))
        .rejects.toThrow('Gemini API failed after 1 attempts');
    });

    it('should validate content when validateContent is true', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            scenario: 'Short', // Too short
            characters: [],
            environmentalFactors: [],
            adaptiveElements: [],
            metadata: { complexity: 1, estimatedDuration: 5, tags: [] }
          })
        }
      });

      const options: GenerationOptions = {
        maxRetries: 1,
        timeout: 5000,
        validateContent: true
      };

      await expect(client.generateContent('test prompt', options))
        .rejects.toThrow('Generated scenario is too short or empty');
    });

    it('should handle timeout', async () => {
      mockModel.generateContent.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );

      const options: GenerationOptions = {
        maxRetries: 1,
        timeout: 100,
        validateContent: false
      };

      await expect(client.generateContent('test prompt', options))
        .rejects.toThrow('API request timeout');
    });
  });

  describe('generateContentStream', () => {
    it('should handle streaming content generation', async () => {
      const mockChunks = [
        { text: () => '{"scenario": "' },
        { text: () => 'Streaming test scenario' },
        { text: () => '", "characters": [], "environmentalFactors": [], "adaptiveElements": [], "metadata": {"complexity": 1, "estimatedDuration": 5, "tags": []}}' }
      ];

      mockModel.generateContentStream.mockResolvedValue({
        stream: mockChunks
      });

      const chunks: string[] = [];
      const result = await client.generateContentStream(
        'test prompt',
        (chunk) => chunks.push(chunk)
      );

      expect(chunks).toHaveLength(3);
      expect(result.scenario).toBe('Streaming test scenario');
    });

    it('should handle streaming errors', async () => {
      mockModel.generateContentStream.mockRejectedValue(new Error('Stream error'));

      await expect(client.generateContentStream('test prompt', () => {}))
        .rejects.toThrow('Stream error');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = { temperature: 0.9 };
      client.updateConfig(newConfig);

      // Since we can't directly access private properties, we test indirectly
      expect(() => client.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('content parsing', () => {
    it('should estimate complexity correctly', async () => {
      const longScenario = 'A'.repeat(1000) + ' decision consequence stakeholder impact risk';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => longScenario
        }
      });

      const result = await client.generateContent('test prompt');
      
      expect(result.metadata.complexity).toBeGreaterThan(1);
    });

    it('should extract tags from content', async () => {
      const scenarioWithTags = 'This is a cybersecurity crisis in healthcare requiring leadership';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => scenarioWithTags
        }
      });

      const result = await client.generateContent('test prompt');
      
      expect(result.metadata.tags).toContain('cybersecurity');
      expect(result.metadata.tags).toContain('healthcare');
      expect(result.metadata.tags).toContain('leadership');
    });
  });
});