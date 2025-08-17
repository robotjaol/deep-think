# AI Generator Module

This module provides integration with Google's Gemini API for generating dynamic crisis scenario content, character interactions, and adaptive elements for the Deep-Think training simulator.

## Features

- **Dynamic Content Generation**: Create realistic crisis scenarios using AI
- **Context-Aware Prompts**: Build prompts that incorporate user context and history
- **Content Validation**: Ensure generated content meets quality and safety standards
- **Error Handling**: Robust retry logic and fallback mechanisms
- **Streaming Support**: Real-time content generation with streaming responses

## Components

### GeminiClient

Handles communication with Google's Gemini API.

```typescript
import { GeminiClient, createDefaultGeminiConfig } from "./index";

const config = createDefaultGeminiConfig();
const client = new GeminiClient(config);

const content = await client.generateContent(prompt, {
  maxRetries: 3,
  timeout: 30000,
  validateContent: true,
});
```

### PromptBuilder

Constructs context-aware prompts for different types of content generation.

```typescript
import { PromptBuilder } from "./index";

const promptBuilder = new PromptBuilder();

// Generate scenario prompt
const scenarioPrompt = promptBuilder.buildScenarioPrompt({
  domain: "cybersecurity",
  jobRole: "Security Analyst",
  riskProfile: "balanced",
  scenarioHistory: [],
});

// Generate character interaction prompt
const characterPrompt = promptBuilder.buildCharacterPrompt(
  context,
  "Emergency Manager",
  "What is the current status?"
);
```

### ContentValidator

Validates generated content for quality, safety, and completeness.

```typescript
import { ContentValidator } from "./index";

const validator = new ContentValidator();
const result = validator.validate(generatedContent);

if (result.isValid) {
  console.log("Content is valid");
} else {
  console.log("Issues found:", result.issues);
  console.log("Suggestions:", result.suggestions);
}
```

## Quick Start

```typescript
import { createAIGenerator } from "./index";

// Create complete AI generator setup
const { client, promptBuilder, validator } = createAIGenerator();

// Define generation context
const context = {
  domain: "healthcare",
  jobRole: "Emergency Doctor",
  riskProfile: "balanced",
  scenarioHistory: [],
};

// Generate and validate content
const prompt = promptBuilder.buildScenarioPrompt(context);
const content = await client.generateContent(prompt);
const validation = validator.validate(content);

if (validation.isValid) {
  console.log("Generated scenario:", content.scenario);
}
```

## Configuration

### Environment Variables

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Custom Configuration

```typescript
const customGenerator = createAIGenerator({
  temperature: 0.9, // More creative (0.0 - 1.0)
  maxTokens: 2048, // Response length
  topP: 0.8, // Nucleus sampling
  topK: 40, // Top-k sampling
});
```

## Content Types

### Scenario Generation

Generates complete crisis scenarios with:

- Detailed situation description
- Character definitions with motivations
- Environmental factors
- Adaptive elements
- Metadata (complexity, duration, tags)

### Character Interactions

Generates realistic character responses based on:

- Character personality and role
- Current scenario context
- User message or question

### Adaptive Content

Generates dynamic content that responds to:

- User decisions and actions
- Changing scenario conditions
- Environmental triggers

## Error Handling

The module includes comprehensive error handling:

```typescript
try {
  const content = await client.generateContent(prompt, {
    maxRetries: 3,
    timeout: 30000,
    fallbackContent: {
      scenario: "Fallback scenario content...",
      // ... other fallback data
    },
  });
} catch (error) {
  if (error instanceof AIGenerationError) {
    console.log("AI generation failed:", error.message);
  } else if (error instanceof ValidationError) {
    console.log("Content validation failed:", error.issues);
  }
}
```

## Validation

Content validation checks for:

- **Content Quality**: Appropriate length, detail, and structure
- **Safety**: No inappropriate or harmful content
- **Completeness**: All required fields present
- **Coherence**: Characters referenced in scenarios
- **Metadata**: Realistic complexity and duration estimates

## Testing

Run the test suite:

```bash
npm test -- --testPathPatterns="ai-generator"
```

The module includes comprehensive unit tests for:

- API integration with mocked responses
- Prompt building and template interpolation
- Content validation with various scenarios
- Error handling and fallback mechanisms

## Examples

See `example-usage.ts` for complete examples of:

- Basic scenario generation
- Character interactions
- Adaptive content generation
- Custom configurations
- Error handling with fallbacks

## API Reference

### Types

```typescript
interface GenerationContext {
  domain: string;
  jobRole: string;
  riskProfile: "conservative" | "balanced" | "aggressive";
  scenarioHistory: string[];
  currentState?: string;
  previousDecisions?: string[];
}

interface GeneratedContent {
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

interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions: string[];
}
```

### Error Classes

- `AIGenerationError`: API communication failures
- `ValidationError`: Content validation failures
- `ConfigurationError`: Setup and configuration issues

## Best Practices

1. **Always validate content** before using in production
2. **Use appropriate retry settings** for your use case
3. **Provide fallback content** for critical scenarios
4. **Monitor API usage** to stay within quotas
5. **Test with various contexts** to ensure robustness
6. **Handle errors gracefully** with user-friendly messages

## Contributing

When adding new features:

1. Add comprehensive unit tests
2. Update type definitions
3. Document new functionality
4. Follow existing code patterns
5. Test error scenarios

## License

This module is part of the Deep-Think project and follows the same license terms.
