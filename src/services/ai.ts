import { GoogleGenerativeAI } from '@google/generative-ai';
import { UIPalette, GenerationContext, AnalysisQuestion } from '@/types';

// Helper function to clean JSON response from AI
function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // If the response starts with ``` or ends with ```, remove them
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
}

const SYSTEM_PROMPT = `You are a professional UI/UX color palette designer with expertise in creating accessible, harmonious color schemes for modern web applications.

Your task is to generate complete UI color palettes that include all necessary colors for a professional application interface. Each palette must include:

BRAND COLORS:
- Primary: Main brand color for primary actions, links, and key highlights (required)
- Secondary: Supporting brand color for secondary actions and accents (required)  
- Accent: Special highlight color for callouts and emphasis (optional)

SURFACE COLORS:
- Background: Main application background color (required)
- Surface: Color for cards, panels, and elevated elements (required)
- Surface Variant: Alternative surface for subtle variations (optional)

TEXT COLORS:
- Text Primary: Primary text color with highest contrast (required)
- Text Secondary: Secondary text color for less prominent content (required)
- Text Tertiary: Tertiary text for subtle information (optional)
- Border: Border color for dividers and outlines (optional)

FEEDBACK COLORS:
- Success: Positive feedback, success states (required)
- Warning: Cautionary feedback, warnings (required)
- Error: Negative feedback, errors, destructive actions (required)
- Info: Informational feedback (optional)

ACCESSIBILITY REQUIREMENTS:
- All text colors must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- UI component colors must meet WCAG AA contrast ratios (3:1 minimum)
- Ensure sufficient contrast between all color combinations
- Consider colorblind accessibility

CRITICAL: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text. Your response must be parseable JSON starting with { and ending with }.

Return your response as valid JSON in this exact format:
{
  "brand": [{"hex": "#hexcode", "role": "role_name", "locked": false, "isCustom": false}],
  "surface": [{"hex": "#hexcode", "role": "role_name", "locked": false, "isCustom": false}],
  "text": [{"hex": "#hexcode", "role": "role_name", "locked": false, "isCustom": false}],
  "feedback": [{"hex": "#hexcode", "role": "role_name", "locked": false, "isCustom": false}],
  "extended": [{"hex": "#hexcode", "role": "role_name", "locked": false, "isCustom": false}],
  "custom": []
}`;

export class AIService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateUIPalette(context: GenerationContext): Promise<UIPalette> {
    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp"
    });

    let prompt = SYSTEM_PROMPT + '\n\n';

    // Add color count instruction
    const colorCount = context.colorCount || 12;
    prompt += `Generate exactly ${colorCount} colors total across all categories. Distribute them as follows:
- Brand Colors: 2-3 colors
- Surface Colors: 2-3 colors  
- Text Colors: 2-4 colors
- Feedback Colors: 3-4 colors
- Extended Palette: remaining colors to reach ${colorCount} total

`;

    switch (context.type) {
      case 'prompt':
        prompt += `Generate a UI color palette based on this theme/prompt: "${context.prompt}"`;
        break;
      
      case 'preset_inspired':
        const presetNames = context.presetPalettes?.map(p => p.name).join(', ');
        prompt += `Generate a new UI color palette inspired by these preset palettes: ${presetNames}. Use them as inspiration but create your own unique palette.`;
        break;
      
      case 'preset_strict':
        const strictPreset = context.presetPalettes?.[0];
        prompt += `Generate a UI color palette using ONLY colors from the ${strictPreset?.name} palette. Assign these colors to appropriate UI roles: ${strictPreset?.colors.join(', ')}`;
        break;
      
      case 'screenshot_refined':
        prompt += `Generate a refined UI color palette based on the screenshot analysis and user responses. User wants: ${JSON.stringify(context.screenshotAnalysis?.answers)}`;
        break;
    }

    if (context.lockedColors && context.lockedColors.length > 0) {
      prompt += `\n\nIMPORTANT: Preserve these locked colors exactly: ${JSON.stringify(context.lockedColors.map(c => ({ hex: c.hex, role: c.role })))}. Generate harmonious colors for all other roles.`;
    }

    let rawText = '';
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      rawText = response.text();
      const cleanedText = cleanJsonResponse(rawText);
      return JSON.parse(cleanedText) as UIPalette;
    } catch (error) {
      console.error('Error generating palette:', error);
      console.error('Raw response that failed to parse:', rawText);
      throw new Error('Failed to generate color palette');
    }
  }

  async analyzeImageAndSuggestQuestions(imageData: string): Promise<AnalysisQuestion[]> {
    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp"
    });

    const prompt = `You are a UI/UX consultant analyzing a screenshot of a user interface. Based on this image, generate exactly 5 multiple-choice questions that will help understand the user's goals for creating a new color palette.

Each question should have 3-4 options. Focus on:
1. Mood/feeling they want to achieve
2. Target audience
3. Brand personality
4. Color preferences
5. Accessibility needs

Return as JSON array with id, question, and options fields.`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: "image/jpeg"
          }
        }
      ]);
      
      const response = await result.response;
      const rawText = response.text();
      const cleanedText = cleanJsonResponse(rawText);
      return JSON.parse(cleanedText) as AnalysisQuestion[];
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze screenshot');
    }
  }

  async analyzePalette(
    palette: UIPalette, 
    useCase?: string,
    onChunk?: (chunk: string) => void
  ): Promise<void> {
    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp"
    });

    const allColors = [
      ...palette.brand,
      ...palette.surface,
      ...palette.text,
      ...palette.feedback,
      ...palette.extended,
      ...palette.custom
    ];

    const prompt = `Analyze this UI color palette as a professional UI/UX designer:

Colors: ${allColors.map(c => `${c.role}: ${c.hex}`).join(', ')}

${useCase ? `Use case: ${useCase}` : ''}

Provide a comprehensive analysis covering:
1. Overall mood and aesthetic
2. Color harmony and relationships
3. Accessibility assessment
4. Brand personality
5. Suitability for the intended use case
6. Strengths and potential improvements
7. Specific recommendations for refinement

Write in a conversational, professional tone.`;

    try {
      const result = await model.generateContentStream(prompt);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        onChunk?.(chunkText);
      }
    } catch (error) {
      console.error('Error analyzing palette:', error);
      throw new Error('Failed to analyze palette');
    }
  }
}
