import { meetsWCAGAA } from './color';
import { hexToHsl, hslToHex } from './harmony';
import { HSLColor, ColorHarmonyType } from './harmony';

// Color psychology and emotional impact
export const COLOR_PSYCHOLOGY = {
  RED: {
    emotions: ['energy', 'passion', 'urgency', 'danger', 'power'],
    associations: ['fire', 'blood', 'stop', 'warning', 'love'],
    temperature: 'warm',
    useCases: ['call-to-action', 'error states', 'urgent notifications', 'passion brands']
  },
  BLUE: {
    emotions: ['trust', 'calm', 'stability', 'professionalism', 'security'],
    associations: ['sky', 'water', 'ocean', 'technology', 'reliability'],
    temperature: 'cool',
    useCases: ['primary actions', 'trust indicators', 'professional brands', 'calming interfaces']
  },
  GREEN: {
    emotions: ['growth', 'success', 'harmony', 'nature', 'balance'],
    associations: ['nature', 'money', 'go', 'health', 'environment'],
    temperature: 'cool',
    useCases: ['success states', 'eco-friendly brands', 'financial apps', 'health interfaces']
  },
  YELLOW: {
    emotions: ['optimism', 'creativity', 'warmth', 'caution', 'energy'],
    associations: ['sun', 'gold', 'warning', 'happiness', 'light'],
    temperature: 'warm',
    useCases: ['attention-grabbing', 'creative brands', 'warning states', 'optimistic messaging']
  },
  PURPLE: {
    emotions: ['luxury', 'creativity', 'mystery', 'sophistication', 'spirituality'],
    associations: ['royalty', 'magic', 'premium', 'artistic', 'wisdom'],
    temperature: 'cool',
    useCases: ['luxury brands', 'creative platforms', 'premium products', 'artistic interfaces']
  },
  ORANGE: {
    emotions: ['enthusiasm', 'creativity', 'warmth', 'energy', 'fun'],
    associations: ['fire', 'sunset', 'autumn', 'vibrance', 'playfulness'],
    temperature: 'warm',
    useCases: ['fun brands', 'creative tools', 'energetic interfaces', 'playful applications']
  },
  PINK: {
    emotions: ['compassion', 'playfulness', 'romance', 'gentleness', 'care'],
    associations: ['flowers', 'femininity', 'love', 'softness', 'nurturing'],
    temperature: 'warm',
    useCases: ['feminine brands', 'healthcare', 'romance apps', 'gentle interfaces']
  },
  GRAY: {
    emotions: ['neutrality', 'sophistication', 'balance', 'professionalism', 'stability'],
    associations: ['metal', 'stone', 'neutral', 'professional', 'minimalist'],
    temperature: 'neutral',
    useCases: ['text colors', 'backgrounds', 'professional brands', 'minimalist designs']
  }
} as const;

// Professional color system patterns
export const PROFESSIONAL_COLOR_PATTERNS = {
  CORPORATE: {
    description: 'Professional, trustworthy, conservative',
    temperature: 'cool',
    saturation: 'moderate',
    harmony: 'analogous',
    primaryHues: [200, 220, 240], // Blues
    secondaryHues: [180, 200], // Cyan-Blue
    accentHues: [300, 320] // Purple accents
  },
  CREATIVE: {
    description: 'Bold, innovative, artistic',
    temperature: 'warm',
    saturation: 'vibrant',
    harmony: 'triadic',
    primaryHues: [0, 30, 60], // Reds, Oranges, Yellows
    secondaryHues: [300, 330], // Purples, Magentas
    accentHues: [120, 150] // Greens
  },
  MINIMALIST: {
    description: 'Clean, simple, sophisticated',
    temperature: 'neutral',
    saturation: 'muted',
    harmony: 'monochromatic',
    primaryHues: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330], // All hues with low saturation
    secondaryHues: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
    accentHues: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
  },
  TECH: {
    description: 'Modern, innovative, digital',
    temperature: 'cool',
    saturation: 'moderate',
    harmony: 'complementary',
    primaryHues: [200, 220], // Blues
    secondaryHues: [0, 20], // Reds
    accentHues: [120, 140] // Greens
  },
  HEALTHCARE: {
    description: 'Calming, trustworthy, healing',
    temperature: 'cool',
    saturation: 'muted',
    harmony: 'analogous',
    primaryHues: [120, 140, 160], // Greens
    secondaryHues: [180, 200], // Blues
    accentHues: [60, 80] // Yellows
  }
} as const;

export type ColorPattern = keyof typeof PROFESSIONAL_COLOR_PATTERNS;

// Advanced color analysis functions
export function analyzeColorPsychology(hex: string): {
  dominantEmotion: string;
  temperature: 'warm' | 'cool' | 'neutral';
  associations: string[];
  recommendedUseCases: string[];
} {
  const hsl = hexToHsl(hex);
  if (!hsl) {
    return {
      dominantEmotion: 'neutral',
      temperature: 'neutral',
      associations: ['unknown'],
      recommendedUseCases: ['general']
    };
  }

  const hue = hsl.h;
  const saturation = hsl.s;
  const lightness = hsl.l;

  // Determine color family based on hue
  let colorFamily: keyof typeof COLOR_PSYCHOLOGY;
  if (hue >= 0 && hue < 30) colorFamily = 'RED';
  else if (hue >= 30 && hue < 60) colorFamily = 'ORANGE';
  else if (hue >= 60 && hue < 90) colorFamily = 'YELLOW';
  else if (hue >= 90 && hue < 150) colorFamily = 'GREEN';
  else if (hue >= 150 && hue < 210) colorFamily = 'BLUE';
  else if (hue >= 210 && hue < 270) colorFamily = 'PURPLE';
  else if (hue >= 270 && hue < 330) colorFamily = 'PINK';
  else colorFamily = 'RED'; // Wrap around

  const psychology = COLOR_PSYCHOLOGY[colorFamily];
  
  // Adjust emotions based on saturation and lightness
  let dominantEmotion = psychology.emotions[0];
  if (saturation < 30) {
    dominantEmotion = psychology.emotions[0]; // Use first emotion for low saturation
  } else if (lightness < 30) {
    dominantEmotion = psychology.emotions[0]; // Use first emotion for dark colors
  } else if (lightness > 70) {
    dominantEmotion = psychology.emotions[0]; // Use first emotion for light colors
  }

  return {
    dominantEmotion,
    temperature: psychology.temperature as 'warm' | 'cool' | 'neutral',
    associations: [...psychology.associations],
    recommendedUseCases: [...psychology.useCases]
  };
}

export function generatePatternBasedPalette(pattern: ColorPattern): string[] {
  const patternConfig = PROFESSIONAL_COLOR_PATTERNS[pattern];
  const colors: string[] = [];

  // Generate primary colors
  const primaryHue = patternConfig.primaryHues[Math.floor(Math.random() * patternConfig.primaryHues.length)];
  const primarySaturation = getSaturationForLevel(patternConfig.saturation);
  const primaryLightness = 50 + (Math.random() - 0.5) * 20; // 40-60%

  colors.push(hslToHex({ h: primaryHue, s: primarySaturation, l: primaryLightness }));

  // Generate secondary colors based on harmony type
  switch (patternConfig.harmony) {
    case 'analogous':
      colors.push(hslToHex({ h: (primaryHue + 30) % 360, s: primarySaturation * 0.8, l: primaryLightness }));
      colors.push(hslToHex({ h: (primaryHue - 30 + 360) % 360, s: primarySaturation * 0.8, l: primaryLightness }));
      break;
    case 'complementary':
      colors.push(hslToHex({ h: (primaryHue + 180) % 360, s: primarySaturation * 0.8, l: primaryLightness }));
      colors.push(hslToHex({ h: (primaryHue + 150) % 360, s: primarySaturation * 0.6, l: primaryLightness + 10 }));
      break;
    case 'triadic':
      colors.push(hslToHex({ h: (primaryHue + 120) % 360, s: primarySaturation * 0.8, l: primaryLightness }));
      colors.push(hslToHex({ h: (primaryHue + 240) % 360, s: primarySaturation * 0.8, l: primaryLightness }));
      break;
    case 'monochromatic':
      colors.push(hslToHex({ h: primaryHue, s: primarySaturation * 0.6, l: primaryLightness + 20 }));
      colors.push(hslToHex({ h: primaryHue, s: primarySaturation * 0.4, l: primaryLightness - 20 }));
      break;
  }

  // Add neutral colors
  const neutralHue = patternConfig.temperature === 'warm' ? 30 : 200;
  colors.push(hslToHex({ h: neutralHue, s: 15, l: 50 }));
  colors.push(hslToHex({ h: neutralHue, s: 10, l: 85 }));

  return colors;
}

function getSaturationForLevel(level: string): number {
  switch (level) {
    case 'vibrant': return 70 + Math.random() * 30; // 70-100%
    case 'moderate': return 40 + Math.random() * 30; // 40-70%
    case 'muted': return 20 + Math.random() * 20; // 20-40%
    case 'neutral': return Math.random() * 20; // 0-20%
    default: return 50;
  }
}

export function calculatePaletteHarmonyScore(colors: string[]): {
  score: number;
  harmonyType: ColorHarmonyType | null;
  strengths: string[];
  improvements: string[];
} {
  if (colors.length < 2) {
    return {
      score: 0,
      harmonyType: null,
      strengths: [],
      improvements: ['Add more colors to create a proper palette']
    };
  }

  const hslColors = colors.map(hex => hexToHsl(hex)).filter(Boolean) as HSLColor[];
  if (hslColors.length < 2) {
    return {
      score: 0,
      harmonyType: null,
      strengths: [],
      improvements: ['Invalid color values detected']
    };
  }

  let score = 0;
  const strengths: string[] = [];
  const improvements: string[] = [];

  // Analyze hue relationships
  const baseHue = hslColors[0].h;
  const hueDiffs = hslColors.slice(1).map(hsl => {
    const diff = Math.abs(hsl.h - baseHue);
    return Math.min(diff, 360 - diff);
  });

  // Check for established harmony types
  let harmonyType: ColorHarmonyType | null = null;
  
  if (hueDiffs.some(diff => diff >= 150 && diff <= 210)) {
    harmonyType = 'complementary';
    score += 0.3;
    strengths.push('Strong complementary contrast');
  } else if (hueDiffs.every(diff => diff <= 60)) {
    harmonyType = 'analogous';
    score += 0.25;
    strengths.push('Harmonious analogous colors');
  } else if (hueDiffs.some(diff => diff >= 110 && diff <= 130) && 
             hueDiffs.some(diff => diff >= 230 && diff <= 250)) {
    harmonyType = 'triadic';
    score += 0.2;
    strengths.push('Balanced triadic harmony');
  }

  // Analyze saturation consistency
  const avgSaturation = hslColors.reduce((sum, hsl) => sum + hsl.s, 0) / hslColors.length;
  const saturationVariance = hslColors.reduce((sum, hsl) => sum + Math.abs(hsl.s - avgSaturation), 0) / hslColors.length;
  
  if (saturationVariance < 20) {
    score += 0.2;
    strengths.push('Consistent saturation levels');
  } else {
    improvements.push('Consider more consistent saturation levels');
  }

  // Analyze lightness distribution
  const lightnessValues = hslColors.map(hsl => hsl.l).sort((a, b) => a - b);
  const lightnessRange = lightnessValues[lightnessValues.length - 1] - lightnessValues[0];
  
  if (lightnessRange >= 40 && lightnessRange <= 80) {
    score += 0.2;
    strengths.push('Good lightness distribution');
  } else if (lightnessRange < 40) {
    improvements.push('Add more lightness variation for better contrast');
  } else {
    improvements.push('Consider reducing lightness range for better cohesion');
  }

  // Check accessibility
  let accessiblePairs = 0;
  let totalPairs = 0;
  
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      totalPairs++;
      if (meetsWCAGAA(colors[i], colors[j])) {
        accessiblePairs++;
      }
    }
  }
  
  const accessibilityRatio = totalPairs > 0 ? accessiblePairs / totalPairs : 0;
  if (accessibilityRatio >= 0.8) {
    score += 0.2;
    strengths.push('Good accessibility contrast');
  } else {
    improvements.push('Improve contrast ratios for better accessibility');
  }

  // Check color count
  if (colors.length >= 5 && colors.length <= 8) {
    score += 0.1;
    strengths.push('Appropriate color count');
  } else if (colors.length < 5) {
    improvements.push('Consider adding more colors for a complete palette');
  } else {
    improvements.push('Consider reducing colors for better focus');
  }

  return {
    score: Math.min(1, score),
    harmonyType,
    strengths,
    improvements
  };
}

export function suggestPaletteImprovements(colors: string[]): string[] {
  const analysis = calculatePaletteHarmonyScore(colors);
  const suggestions: string[] = [];

  // Add analysis-based suggestions
  suggestions.push(...analysis.improvements);

  // Add specific color theory suggestions
  if (analysis.score < 0.5) {
    suggestions.push('Consider using established color harmony principles (complementary, analogous, triadic)');
  }

  if (analysis.harmonyType === null) {
    suggestions.push('Establish a clear color harmony relationship between your colors');
  }

  // Check for color temperature consistency
  const temperatures = colors.map(hex => {
    const hsl = hexToHsl(hex);
    if (!hsl) return 'neutral';
    return hsl.h >= 0 && hsl.h <= 60 ? 'warm' : 
           hsl.h >= 180 && hsl.h <= 300 ? 'cool' : 'neutral';
  });

  const uniqueTemperatures = new Set(temperatures);
  if (uniqueTemperatures.size > 2) {
    suggestions.push('Consider focusing on either warm or cool colors for better cohesion');
  }

  return suggestions;
}
