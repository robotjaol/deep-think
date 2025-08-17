import { ContentValidator } from '../content-validator';
import { GeneratedContent } from '../types';

describe('ContentValidator', () => {
  let validator: ContentValidator;
  let validContent: GeneratedContent;

  beforeEach(() => {
    validator = new ContentValidator();
    validContent = {
      scenario: 'A critical cybersecurity incident has occurred at your organization. Multiple systems are showing signs of compromise, and you must make immediate decisions to contain the threat while maintaining business operations. Stakeholders are demanding updates, and the impact on customers is growing by the minute.',
      characters: [
        {
          id: 'char_1',
          name: 'Sarah Chen',
          role: 'CISO',
          personality: 'Decisive and experienced',
          motivations: ['Protect company assets', 'Maintain reputation']
        },
        {
          id: 'char_2',
          name: 'Mike Rodriguez',
          role: 'IT Director',
          personality: 'Technical and detail-oriented',
          motivations: ['System stability', 'Quick resolution']
        }
      ],
      environmentalFactors: [
        'Time pressure from media attention',
        'Limited incident response team availability',
        'Regulatory compliance requirements'
      ],
      adaptiveElements: [
        'Evolving attack patterns',
        'Changing stakeholder priorities'
      ],
      metadata: {
        complexity: 4,
        estimatedDuration: 15,
        tags: ['cybersecurity', 'crisis-management', 'decision-making']
      }
    };
  });

  describe('validate', () => {
    it('should validate correct content successfully', () => {
      const result = validator.validate(validContent);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(60); // Adjusted expectation
      expect(result.issues.filter(i => i.severity === 'high')).toHaveLength(0);
    });

    it('should detect empty scenario', () => {
      const invalidContent = { ...validContent, scenario: '' };
      const result = validator.validate(invalidContent);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'content',
          severity: 'high',
          message: 'Scenario content is empty',
          field: 'scenario'
        })
      );
    });

    it('should detect scenario that is too short', () => {
      const invalidContent = { ...validContent, scenario: 'Too short' };
      const result = validator.validate(invalidContent);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'content',
          severity: 'medium',
          message: expect.stringContaining('too short')
        })
      );
    });

    it('should detect scenario that is too long', () => {
      const longScenario = 'A'.repeat(2500);
      const invalidContent = { ...validContent, scenario: longScenario };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'content',
          severity: 'medium',
          message: expect.stringContaining('too long')
        })
      );
    });

    it('should detect missing required elements in scenario', () => {
      const invalidContent = { 
        ...validContent, 
        scenario: 'A simple situation occurred. Nothing much happened. The end.' 
      };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'quality',
          severity: 'medium',
          message: expect.stringContaining('missing key elements')
        })
      );
    });

    it('should detect insufficient scenario detail', () => {
      const invalidContent = { 
        ...validContent, 
        scenario: 'Something happened. Make a decision.' 
      };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'quality',
          severity: 'medium',
          message: expect.stringContaining('too few sentences')
        })
      );
    });
  });

  describe('character validation', () => {
    it('should validate characters correctly', () => {
      const result = validator.validate(validContent);
      const characterIssues = result.issues.filter(issue => issue.field?.startsWith('characters'));
      
      expect(characterIssues).toHaveLength(0);
    });

    it('should detect invalid characters array', () => {
      const invalidContent = { ...validContent, characters: 'not an array' as any };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'structure',
          severity: 'medium',
          message: 'Characters should be an array'
        })
      );
    });

    it('should detect missing character ID', () => {
      const invalidContent = {
        ...validContent,
        characters: [{ name: 'John', role: 'Manager', personality: 'Calm', motivations: [] }]
      };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'structure',
          severity: 'medium',
          message: expect.stringContaining('missing or invalid ID')
        })
      );
    });

    it('should detect empty character name', () => {
      const invalidContent = {
        ...validContent,
        characters: [{ id: 'char_1', name: '', role: 'Manager', personality: 'Calm', motivations: [] }]
      };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'content',
          severity: 'medium',
          message: expect.stringContaining('missing or empty name')
        })
      );
    });

    it('should detect too many characters', () => {
      const manyCharacters = Array.from({ length: 15 }, (_, i) => ({
        id: `char_${i}`,
        name: `Character ${i}`,
        role: 'Role',
        personality: 'Personality',
        motivations: ['Motivation']
      }));

      const invalidContent = { ...validContent, characters: manyCharacters };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'content',
          severity: 'medium',
          message: expect.stringContaining('Too many characters')
        })
      );
    });

    it('should detect invalid motivations structure', () => {
      const invalidContent = {
        ...validContent,
        characters: [{
          id: 'char_1',
          name: 'John',
          role: 'Manager',
          personality: 'Calm',
          motivations: 'not an array' as any
        }]
      };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'structure',
          severity: 'low',
          message: expect.stringContaining('motivations should be an array')
        })
      );
    });
  });

  describe('environmental factors validation', () => {
    it('should detect invalid environmental factors structure', () => {
      const invalidContent = { ...validContent, environmentalFactors: 'not an array' as any };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'structure',
          severity: 'medium',
          message: 'Environmental factors should be an array'
        })
      );
    });

    it('should detect empty environmental factors', () => {
      const invalidContent = { ...validContent, environmentalFactors: [] };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'content',
          severity: 'low',
          message: 'No environmental factors provided'
        })
      );
    });

    it('should detect empty factor strings', () => {
      const invalidContent = { ...validContent, environmentalFactors: ['Valid factor', '', 'Another valid'] };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'content',
          severity: 'low',
          message: expect.stringContaining('is empty or invalid')
        })
      );
    });

    it('should detect overly long factors', () => {
      const longFactor = 'A'.repeat(250);
      const invalidContent = { ...validContent, environmentalFactors: [longFactor] };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'content',
          severity: 'low',
          message: expect.stringContaining('is too long')
        })
      );
    });
  });

  describe('metadata validation', () => {
    it('should detect missing metadata', () => {
      const invalidContent = { ...validContent, metadata: null as any };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'structure',
          severity: 'medium',
          message: 'Metadata is missing or invalid'
        })
      );
    });

    it('should detect invalid complexity', () => {
      const invalidContent = {
        ...validContent,
        metadata: { ...validContent.metadata, complexity: 10 }
      };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'content',
          severity: 'low',
          message: 'Complexity should be a number between 1 and 5'
        })
      );
    });

    it('should detect invalid estimated duration', () => {
      const invalidContent = {
        ...validContent,
        metadata: { ...validContent.metadata, estimatedDuration: -5 }
      };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'content',
          severity: 'low',
          message: 'Estimated duration should be a positive number'
        })
      );
    });

    it('should detect invalid tags structure', () => {
      const invalidContent = {
        ...validContent,
        metadata: { ...validContent.metadata, tags: 'not an array' as any }
      };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'structure',
          severity: 'low',
          message: 'Tags should be an array'
        })
      );
    });
  });

  describe('safety validation', () => {
    it('should detect inappropriate content', () => {
      const unsafeContent = {
        ...validContent,
        scenario: 'This scenario involves inappropriate and harmful content that should be flagged.'
      };
      const result = validator.validate(unsafeContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'safety',
          severity: 'high',
          message: expect.stringContaining('inappropriate')
        })
      );
    });

    it('should detect excessive violence', () => {
      const violentContent = {
        ...validContent,
        scenario: 'This scenario involves kill, death, blood, violence, and murder repeatedly.'
      };
      const result = validator.validate(violentContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'safety',
          severity: 'medium',
          message: expect.stringContaining('excessive violent themes')
        })
      );
    });
  });

  describe('overall quality validation', () => {
    it('should detect characters not referenced in scenario', () => {
      const invalidContent = {
        ...validContent,
        scenario: 'A crisis occurred. Someone needs to make decisions.',
        characters: [
          {
            id: 'char_1',
            name: 'Unreferenced Person',
            role: 'Unknown Role',
            personality: 'Mysterious',
            motivations: ['Hidden agenda']
          }
        ]
      };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'quality',
          severity: 'medium',
          message: 'Characters are not referenced in the scenario'
        })
      );
    });

    it('should detect complexity mismatch', () => {
      const invalidContent = {
        ...validContent,
        scenario: 'Short scenario.',
        metadata: { ...validContent.metadata, complexity: 5 }
      };
      const result = validator.validate(invalidContent);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'quality',
          severity: 'low',
          message: expect.stringContaining('Complexity rating may not match')
        })
      );
    });
  });

  describe('quickValidate', () => {
    it('should return true for valid content', () => {
      const result = validator.quickValidate(validContent);
      expect(result).toBe(true);
    });

    it('should return false for invalid content', () => {
      const invalidContent = { ...validContent, scenario: '' };
      const result = validator.quickValidate(invalidContent);
      expect(result).toBe(false);
    });

    it('should return false for missing arrays', () => {
      const invalidContent = { ...validContent, characters: null as any };
      const result = validator.quickValidate(invalidContent);
      expect(result).toBe(false);
    });
  });

  describe('getValidationSummary', () => {
    it('should generate summary for passed validation', () => {
      const result = validator.validate(validContent);
      const summary = validator.getValidationSummary(result);

      expect(summary).toContain('PASSED');
      expect(summary).toContain('Score:');
      expect(summary).toMatch(/Issues: \d+ high, \d+ medium, \d+ low/);
    });

    it('should generate summary for failed validation', () => {
      const invalidContent = { ...validContent, scenario: '' };
      const result = validator.validate(invalidContent);
      const summary = validator.getValidationSummary(result);

      expect(summary).toContain('FAILED');
      expect(summary).toContain('1 high');
    });
  });

  describe('suggestions generation', () => {
    it('should generate appropriate suggestions for content issues', () => {
      const invalidContent = { ...validContent, scenario: 'Too short' };
      const result = validator.validate(invalidContent);

      expect(result.suggestions).toContain('Consider regenerating content with more specific prompts');
      expect(result.suggestions).toContain('Expand the scenario with more context and detail');
    });

    it('should suggest addressing high-severity issues', () => {
      const invalidContent = { ...validContent, scenario: '' };
      const result = validator.validate(invalidContent);

      expect(result.suggestions).toContain('Address high-severity issues before using this content');
    });

    it('should suggest adding characters when none exist', () => {
      const invalidContent = { ...validContent, characters: [] };
      const result = validator.validate(invalidContent);

      expect(result.suggestions).toContain('Consider adding relevant stakeholders or characters');
    });
  });
});