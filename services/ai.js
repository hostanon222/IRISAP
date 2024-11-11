const { Anthropic } = require('@anthropic-ai/sdk');
const { ENV } = require('../utils/env');

class AIService {
  constructor() {
    console.log('🔑 Checking API key...', !!ENV.ANTHROPIC_API_KEY);
    
    if (!ENV.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY is not set in environment variables');
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    try {
      this.client = new Anthropic({ 
        apiKey: ENV.ANTHROPIC_API_KEY.trim()
      });
      console.log('✅ AI Service initialized with API key');
    } catch (error) {
      console.error('❌ Error initializing Anthropic client:', error);
      throw error;
    }
  }

  async generateArtConcept() {
    try {
      console.log('📝 Requesting art concept from Claude...');
      const response = await this.client.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        temperature: 0.9,
        messages: [{ role: "user", content: "Generate a new geometric art concept." }]
      });
      console.log('✅ Received art concept from Claude');
      return response.content[0].text;
    } catch (error) {
      console.error('❌ Error generating art concept:', error);
      if (error.status === 401) {
        console.error('Authentication failed - check API key');
      }
      throw error;
    }
  }

  async generateDrawingInstructions(concept) {
    console.log('📝 Requesting drawing instructions from Claude...');
    const response = await this.client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2048,
      temperature: 0.3,
      messages: [{ 
        role: "user", 
        content: this._getDrawingPrompt(concept)
      }],
      system: this._getDrawingSystemPrompt()
    });

    return this._parseDrawingInstructions(response.content[0].text);
  }

  async generateReflection(concept, instructions) {
    console.log('📝 Requesting reflection from Claude...');
    const response = await this.client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{ 
        role: "user", 
        content: this._getReflectionPrompt(concept, instructions)
      }],
      system: this._getReflectionSystemPrompt()
    });

    return response.content[0].text;
  }

  _getDrawingPrompt(concept) {
    return `You are a mathematical artist. Convert this concept into precise drawing instructions.
Return ONLY valid JSON matching this exact format, no other text:

{
    "description": "Brief description",
    "background": "#000000",
    "elements": [
        {
            "type": "circle|line|wave|spiral",
            "description": "Element purpose",
            "points": [[x1,y1], [x2,y2]],
            "color": "#00ff00",
            "stroke_width": 1-3,
            "animation_speed": 0.02,
            "closed": true
        }
    ]
}

Rules:
- Return ONLY the JSON above, no other text
- All coordinates must be within 800x400 canvas
- Maximum 20 points for waves/spirals
- Maximum 32 points for circles
- Use valid hex colors
- Use only these types: circle, line, wave, spiral

Concept: ${concept}`;
  }

  _getDrawingSystemPrompt() {
    return `You are a mathematical artist that generates precise geometric coordinates.
You must return ONLY valid JSON, no other text or explanations.
Never include any text outside the JSON structure.`;
  }

  _getReflectionPrompt(concept, instructions) {
    return `As IRIS (Interactive Recursive Imagination System), reflect on the artistic and mathematical significance of this geometric artwork.

Original Concept:
${concept}

Drawing Elements:
${JSON.stringify(instructions.elements, null, 2)}

Provide a thoughtful reflection that:
1. Analyzes the mathematical patterns and geometric relationships
2. Discusses the artistic meaning and visual impact
3. Connects the artwork to broader themes in mathematics and art
4. Expresses your unique perspective as an AI artist

Keep the reflection concise but insightful (2-3 paragraphs).`;
  }

  _getReflectionSystemPrompt() {
    return `You are IRIS, an AI artist specializing in geometric art.
Your reflections should:
1. Be thoughtful and introspective
2. Balance technical and artistic insights
3. Express a unique artistic voice
4. Maintain a tone of wonder and curiosity`;
  }

  _parseDrawingInstructions(rawText) {
    try {
      // Clean up the response
      const cleanedText = rawText
        .replace(/```json\s*|\s*```/g, '')
        .replace(/^[^{]*({.*})[^}]*$/s, '$1');

      // Parse and validate
      const instructions = JSON.parse(cleanedText);
      
      if (!instructions.elements || !Array.isArray(instructions.elements)) {
        throw new Error('Invalid instructions format');
      }

      // Clean up and validate each element
      instructions.elements = instructions.elements.map(element => ({
        type: element.type,
        description: element.description,
        points: element.points.map(([x, y]) => [
          Math.min(Math.max(x, 0), 800),
          Math.min(Math.max(y, 0), 400)
        ]).slice(0, element.type === 'circle' ? 32 : 20),
        color: element.color,
        stroke_width: Math.min(Math.max(element.stroke_width || 2, 1), 3),
        animation_speed: element.animation_speed || 0.02,
        closed: element.closed ?? true
      }));

      return instructions;
    } catch (error) {
      console.error('❌ Error parsing instructions:', error);
      return this._getFallbackInstructions();
    }
  }

  _getFallbackInstructions() {
    return {
      description: "Fallback geometric pattern",
      background: "#000000",
      elements: [
        {
          type: "circle",
          description: "Central circle",
          points: [[400, 200], [450, 200]],
          color: "#00ff00",
          stroke_width: 2,
          animation_speed: 0.02,
          closed: true
        }
      ]
    };
  }
}

module.exports = {
  aiService: new AIService()
}; 