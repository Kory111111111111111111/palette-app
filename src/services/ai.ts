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
        const answers = context.screenshotAnalysis?.answers || {};
        const answerText = Object.entries(answers)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        prompt += `Generate a refined UI color palette based on the screenshot analysis and user responses.

User's preferences from the analysis:
${answerText}

Consider the uploaded screenshot context and create a palette that:
1. Addresses the specific needs identified in the analysis
2. Maintains visual harmony with the existing design elements
3. Improves upon any accessibility or usability issues
4. Aligns with the user's stated preferences for mood, audience, and brand personality

Focus on creating a cohesive color system that enhances the existing UI while meeting the user's specific requirements.`;
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
    console.log('🔍 [AI Service] Starting image analysis...');
    console.log('🔍 [AI Service] Image data length:', imageData.length);
    console.log('🔍 [AI Service] Image data type:', typeof imageData);
    console.log('🔍 [AI Service] Image data starts with:', imageData.substring(0, 50));
    
    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp"
    });
    console.log('🔍 [AI Service] Model initialized:', model);

    const prompt = `You are a UI/UX consultant analyzing a screenshot of a user interface. Based on this image, generate exactly 5 multiple-choice questions that will help understand the user's goals for creating a new color palette.

First, analyze the image and identify:
- The current color scheme and visual style
- The type of application/website (e.g., e-commerce, dashboard, portfolio)
- The target audience based on visual cues
- Any accessibility concerns you notice
- The overall mood and personality of the design

Then generate exactly 5 multiple-choice questions with 3-4 options each. Focus on:
1. Mood/feeling they want to achieve (e.g., "What mood should your new palette convey?")
2. Target audience (e.g., "Who is your primary target audience?")
3. Brand personality (e.g., "How would you describe your brand personality?")
4. Color preferences (e.g., "What type of color scheme appeals to you most?")
5. Accessibility needs (e.g., "How important is accessibility in your design?")

Return as JSON array with this exact structure:
[
  {
    "id": "mood",
    "question": "What mood should your new palette convey?",
    "options": ["Professional and trustworthy", "Creative and energetic", "Calm and minimalist", "Bold and modern"]
  },
  {
    "id": "audience", 
    "question": "Who is your primary target audience?",
    "options": ["Business professionals", "Young adults", "General consumers", "Tech-savvy users"]
  },
  {
    "id": "personality",
    "question": "How would you describe your brand personality?",
    "options": ["Traditional and reliable", "Innovative and cutting-edge", "Friendly and approachable", "Luxury and premium"]
  },
  {
    "id": "colors",
    "question": "What type of color scheme appeals to you most?",
    "options": ["Monochromatic with subtle variations", "Complementary colors", "Analogous harmony", "Triadic contrast"]
  },
  {
    "id": "accessibility",
    "question": "How important is accessibility in your design?",
    "options": ["Critical - must meet WCAG AAA", "Important - must meet WCAG AA", "Somewhat important", "Not a priority"]
  }
]

CRITICAL: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.`;

    try {
      console.log('🔍 [AI Service] Converting image data...');
      
      // Convert base64 data URL to proper format for Gemini
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const mimeType = imageData.includes('data:') 
        ? imageData.split(';')[0].split(':')[1] 
        : 'image/jpeg';

      console.log('🔍 [AI Service] Base64 data length:', base64Data.length);
      console.log('🔍 [AI Service] MIME type:', mimeType);
      console.log('🔍 [AI Service] Base64 data starts with:', base64Data.substring(0, 50));

      console.log('🔍 [AI Service] Calling Gemini API...');
      const startTime = Date.now();
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]);
      
      const endTime = Date.now();
      console.log('🔍 [AI Service] API call completed in:', endTime - startTime, 'ms');
      
      console.log('🔍 [AI Service] Processing response...');
      const response = await result.response;
      console.log('🔍 [AI Service] Response object:', response);
      
      const rawText = response.text();
      console.log('🔍 [AI Service] Raw response length:', rawText.length);
      console.log('🔍 [AI Service] Raw response:', rawText);
      
      const cleanedText = cleanJsonResponse(rawText);
      console.log('🔍 [AI Service] Cleaned response:', cleanedText);
      
      console.log('🔍 [AI Service] Parsing JSON...');
      // Validate the response structure
      const questions = JSON.parse(cleanedText) as AnalysisQuestion[];
      console.log('🔍 [AI Service] Parsed questions:', questions);
      
      if (!Array.isArray(questions) || questions.length !== 5) {
        console.error('🔍 [AI Service] Invalid response format: expected exactly 5 questions, got:', questions.length);
        throw new Error('Invalid response format: expected exactly 5 questions');
      }
      
      console.log('🔍 [AI Service] Validating question structure...');
      // Validate each question structure
      questions.forEach((q, index) => {
        console.log('🔍 [AI Service] Validating question', index, ':', q);
        if (!q.id || !q.question || !Array.isArray(q.options) || q.options.length < 3) {
          console.error('🔍 [AI Service] Invalid question structure at index', index, ':', q);
          throw new Error(`Invalid question structure at index ${index}`);
        }
      });
      
      console.log('🔍 [AI Service] All questions validated successfully!');
      return questions;
    } catch (error) {
      console.error('🔍 [AI Service] Error analyzing image:', error);
      console.error('🔍 [AI Service] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof SyntaxError) {
        console.error('🔍 [AI Service] JSON parsing error');
        throw new Error('Failed to parse AI response. Please try again.');
      }
      
      if (error instanceof Error && error.message.includes('API_KEY')) {
        console.error('🔍 [AI Service] API key error');
        throw new Error('Invalid or missing API key. Please check your settings.');
      }
      
      if (error instanceof Error && error.message.includes('quota')) {
        console.error('🔍 [AI Service] Quota exceeded');
        throw new Error('API quota exceeded. Please try again later.');
      }
      
      console.error('🔍 [AI Service] Generic error, rethrowing...');
      throw new Error('Failed to analyze screenshot. Please check your API key and try again.');
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
