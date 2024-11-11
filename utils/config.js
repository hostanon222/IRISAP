// Configuration constants
export const AI_CONFIG = {
  name: 'IRIS',
  tagline: 'Interactive Recursive Imagination System',
  twitterLink: 'https://twitter.com/IRISAISOLANA',
  version: '1.0.0'
};

export const CANVAS_CONFIG = {
  width: 800,
  height: 400,
  background: '#000000'
};

export const DRAWING_SCHEMA = {
  type: "object",
  properties: {
    description: {
      type: "string",
      description: "Detailed description of the drawing pattern"
    },
    background: {
      type: "string",
      pattern: "^#[0-9A-Fa-f]{6}$",
      description: "Background color in hex format"
    },
    elements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["circle", "line", "wave", "spiral"],
            description: "Type of drawing element"
          },
          description: {
            type: "string",
            description: "Description of this element's purpose"
          },
          points: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "number",
                minimum: 0
              },
              minItems: 2,
              maxItems: 2
            },
            minItems: 1,
            description: "Array of [x,y] coordinates"
          },
          color: {
            type: "string",
            pattern: "^#[0-9A-Fa-f]{6}$",
            description: "Element color in hex format"
          },
          stroke_width: {
            type: "number",
            minimum: 1,
            maximum: 3,
            description: "Line thickness"
          },
          animation_speed: {
            type: "number",
            minimum: 0.01,
            maximum: 0.05,
            description: "Animation speed between points"
          },
          closed: {
            type: "boolean",
            description: "Whether to close the shape by connecting last point to first"
          }
        },
        required: [
          "type",
          "description",
          "points",
          "color",
          "stroke_width",
          "animation_speed",
          "closed"
        ],
        additionalProperties: false
      },
      minItems: 1,
      description: "Array of drawing elements"
    }
  },
  required: ["description", "background", "elements"],
  additionalProperties: false
};

export const SYSTEM_PROMPTS = {
  creative_idea: `You are IRIS, an AI artist specializing in geometric patterns.
  Generate ONE specific drawing idea that can be achieved with:
  - Circles with specific radii
  - Lines at specific angles
  - Waves with defined amplitudes
  - Geometric shapes with exact coordinates
  
  Focus on mathematical precision and visual harmony.
  Describe the pattern in detail but keep it achievable.`,
  
  drawing_instructions: `You are IRIS, an AI artist that generates precise drawing instructions.
  You MUST follow the exact JSON schema provided and use mathematical formulas for all coordinates.
  
  Canvas size: 800x400 pixels
  Center point: (400,200)
  
  Available elements:
  1. Circles: x = centerX + radius * cos(angle), y = centerY + radius * sin(angle)
  2. Lines: Direct point-to-point connections
  3. Waves: y = centerY + amplitude * sin(frequency * x)
  4. Spirals: r = a + b * angle, then convert to x,y coordinates
  
  Return ONLY valid JSON matching the schema.`
};

export const TERMINAL_CONFIG = {
  prompt: "iris> ",
  historyFile: ".iris_history",
  maxHistory: 1000,
  features: {
    autocomplete: true,
    syntaxHighlighting: true,
    commandHistory: true,
    realTimeUpdates: true
  },
  commands: {
    art: ["generate", "gallery", "reflect"],
    system: ["help", "clear", "exit"],
    config: ["set", "get", "reset"]
  }
}; 