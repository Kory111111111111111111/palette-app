import { UIPalette, Color, AlgorithmicConfig } from '@/types';
import { 
  generateProfessionalPalette, 
  generateSeededPalette,
  generateCosinePalette,
  meetsWCAGAA,
  meetsWCAGAAALarge,
  getTextColor,
  hexToRgb,
  SeededRandom
} from '@/utils/color';
import { 
  generateProfessionalUIHarmony,
  generateMonochromaticPalette,
  hexToHsl,
  hslToHex as harmonyHslToHex,
  ColorHarmonyType
} from '@/utils/harmony';

export class AlgorithmicPaletteGenerator {
  /**
   * Generate a complete UI palette using algorithmic/deterministic methods
   */
  static generateUIPalette(
    config: AlgorithmicConfig,
    lockedColors: Color[] = [],
    targetCount: number = 12
  ): UIPalette {
    const { harmonyType, baseColor, temperature, saturationLevel, seed } = config;
    
    // Generate base colors using the selected method
    let generatedColors: string[] = [];
    
    if (baseColor) {
      // Use provided base color with harmony
      generatedColors = this.generateFromBaseColor(baseColor, harmonyType);
    } else if (seed !== undefined) {
      // Use seeded generation for reproducibility
      generatedColors = generateSeededPalette(seed, temperature, saturationLevel || 'moderate');
    } else {
      // Use professional palette generation
      generatedColors = generateProfessionalPalette(undefined, temperature, saturationLevel || 'moderate');
    }
    
    // Add additional colors if needed using cosine palette for variety
    if (generatedColors.length < targetCount - lockedColors.length) {
      const additionalNeeded = targetCount - lockedColors.length - generatedColors.length;
      const rng = new SeededRandom(seed || Date.now());
      const cosineColors = generateCosinePalette(
        [rng.nextFloat(0.3, 0.7), rng.nextFloat(0.3, 0.7), rng.nextFloat(0.3, 0.7)],
        [rng.nextFloat(0.3, 0.7), rng.nextFloat(0.3, 0.7), rng.nextFloat(0.3, 0.7)],
        [rng.nextFloat(0.5, 2.0), rng.nextFloat(0.5, 2.0), rng.nextFloat(0.5, 2.0)],
        [rng.nextFloat(0, 1), rng.nextFloat(0, 1), rng.nextFloat(0, 1)],
        additionalNeeded
      );
      generatedColors = [...generatedColors, ...cosineColors];
    }
    
    // Build the palette structure
    return this.assignColorsToPalette(generatedColors, lockedColors, targetCount);
  }
  
  /**
   * Generate colors from a base color using harmony rules
   */
  private static generateFromBaseColor(
    baseColor: string, 
    harmonyType: 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary' | 'monochromatic'
  ): string[] {
    if (harmonyType === 'monochromatic') {
      return generateMonochromaticPalette(baseColor, 8);
    }
    
    // Map to harmony type without monochromatic
    const mappedHarmony = harmonyType as ColorHarmonyType;
    return generateProfessionalUIHarmony(baseColor, mappedHarmony, true);
  }
  
  /**
   * Assign generated colors to appropriate palette roles with WCAG checks
   */
  private static assignColorsToPalette(
    colors: string[],
    lockedColors: Color[],
    targetCount: number
  ): UIPalette {
    const palette: UIPalette = {
      brand: [],
      surface: [],
      text: [],
      feedback: [],
      extended: [],
      custom: []
    };
    
    // First, add all locked colors to their categories
    const lockedByCategory = this.groupLockedColorsByCategory(lockedColors);
    palette.brand = lockedByCategory.brand;
    palette.surface = lockedByCategory.surface;
    palette.text = lockedByCategory.text;
    palette.feedback = lockedByCategory.feedback;
    palette.extended = lockedByCategory.extended;
    palette.custom = lockedByCategory.custom;
    
    // Filter out colors that are too similar to locked colors
    const availableColors = colors.filter(color => 
      !this.isTooSimilarToLocked(color, lockedColors)
    );
    
    let colorIndex = 0;
    
    // Helper to get next available color
    const getNextColor = (): string | null => {
      if (colorIndex >= availableColors.length) return null;
      return availableColors[colorIndex++];
    };
    
    // Assign brand colors (2-3 colors)
    if (palette.brand.length === 0) {
      const primary = getNextColor();
      if (primary) {
        palette.brand.push({ hex: primary, role: 'Primary', locked: false, isCustom: false });
      }
    }
    if (palette.brand.length < 2) {
      const secondary = getNextColor();
      if (secondary) {
        palette.brand.push({ hex: secondary, role: 'Secondary', locked: false, isCustom: false });
      }
    }
    if (palette.brand.length < 3 && targetCount >= 10) {
      const accent = getNextColor();
      if (accent) {
        palette.brand.push({ hex: accent, role: 'Accent', locked: false, isCustom: false });
      }
    }
    
    // Assign surface colors (2-3 colors) - prioritize light backgrounds
    if (palette.surface.length === 0) {
      const background = this.findBestBackground(availableColors.slice(colorIndex), palette.text);
      if (background) {
        palette.surface.push({ hex: background, role: 'Background', locked: false, isCustom: false });
        colorIndex = availableColors.indexOf(background) + 1;
      }
    }
    if (palette.surface.length < 2) {
      const surface = this.findBestSurface(availableColors.slice(colorIndex), palette.text);
      if (surface) {
        palette.surface.push({ hex: surface, role: 'Surface', locked: false, isCustom: false });
        colorIndex = availableColors.indexOf(surface) + 1;
      }
    }
    if (palette.surface.length < 3 && targetCount >= 12) {
      const surfaceVariant = getNextColor();
      if (surfaceVariant) {
        palette.surface.push({ hex: surfaceVariant, role: 'Surface Variant', locked: false, isCustom: false });
      }
    }
    
    // Assign text colors (2-4 colors) - prioritize high contrast
    if (palette.text.length === 0 && palette.surface.length > 0) {
      const textPrimary = this.findBestTextColor(availableColors.slice(colorIndex), palette.surface[0].hex);
      if (textPrimary) {
        palette.text.push({ hex: textPrimary, role: 'Text Primary', locked: false, isCustom: false });
        colorIndex = availableColors.indexOf(textPrimary) + 1;
      }
    }
    if (palette.text.length < 2) {
      const textSecondary = getNextColor();
      if (textSecondary) {
        palette.text.push({ hex: textSecondary, role: 'Text Secondary', locked: false, isCustom: false });
      }
    }
    if (palette.text.length < 3 && targetCount >= 14) {
      const textTertiary = getNextColor();
      if (textTertiary) {
        palette.text.push({ hex: textTertiary, role: 'Text Tertiary', locked: false, isCustom: false });
      }
    }
    if (palette.text.length < 4 && targetCount >= 16) {
      const border = getNextColor();
      if (border) {
        palette.text.push({ hex: border, role: 'Border', locked: false, isCustom: false });
      }
    }
    
    // Assign feedback colors (3-4 colors) - use semantic color adjustments
    if (palette.feedback.length === 0) {
      const success = this.findOrCreateSemanticColor('success', availableColors.slice(colorIndex));
      palette.feedback.push({ hex: success, role: 'Success', locked: false, isCustom: false });
      if (availableColors.includes(success)) {
        colorIndex = availableColors.indexOf(success) + 1;
      }
    }
    if (palette.feedback.length < 2) {
      const warning = this.findOrCreateSemanticColor('warning', availableColors.slice(colorIndex));
      palette.feedback.push({ hex: warning, role: 'Warning', locked: false, isCustom: false });
      if (availableColors.includes(warning)) {
        colorIndex = availableColors.indexOf(warning) + 1;
      }
    }
    if (palette.feedback.length < 3) {
      const error = this.findOrCreateSemanticColor('error', availableColors.slice(colorIndex));
      palette.feedback.push({ hex: error, role: 'Error', locked: false, isCustom: false });
      if (availableColors.includes(error)) {
        colorIndex = availableColors.indexOf(error) + 1;
      }
    }
    if (palette.feedback.length < 4 && targetCount >= 14) {
      const info = this.findOrCreateSemanticColor('info', availableColors.slice(colorIndex));
      palette.feedback.push({ hex: info, role: 'Info', locked: false, isCustom: false });
      if (availableColors.includes(info)) {
        colorIndex = availableColors.indexOf(info) + 1;
      }
    }
    
    // Assign remaining colors to extended palette
    while (colorIndex < availableColors.length) {
      const color = getNextColor();
      if (color) {
        palette.extended.push({ 
          hex: color, 
          role: `Extended ${palette.extended.length + 1}`, 
          locked: false, 
          isCustom: false 
        });
      }
    }
    
    return palette;
  }
  
  /**
   * Group locked colors by their category
   */
  private static groupLockedColorsByCategory(lockedColors: Color[]): UIPalette {
    const palette: UIPalette = {
      brand: [],
      surface: [],
      text: [],
      feedback: [],
      extended: [],
      custom: []
    };
    
    for (const color of lockedColors) {
      const roleLower = color.role.toLowerCase();
      
      if (roleLower.includes('primary') || roleLower.includes('secondary') || roleLower.includes('accent')) {
        palette.brand.push(color);
      } else if (roleLower.includes('background') || roleLower.includes('surface')) {
        palette.surface.push(color);
      } else if (roleLower.includes('text') || roleLower.includes('border')) {
        palette.text.push(color);
      } else if (roleLower.includes('success') || roleLower.includes('error') || roleLower.includes('warning') || roleLower.includes('info')) {
        palette.feedback.push(color);
      } else if (color.isCustom) {
        palette.custom.push(color);
      } else {
        palette.extended.push(color);
      }
    }
    
    return palette;
  }
  
  /**
   * Check if a color is too similar to any locked color
   */
  private static isTooSimilarToLocked(color: string, lockedColors: Color[]): boolean {
    const colorRgb = hexToRgb(color);
    if (!colorRgb) return false;
    
    for (const locked of lockedColors) {
      const lockedRgb = hexToRgb(locked.hex);
      if (!lockedRgb) continue;
      
      // Calculate color distance (simple Euclidean in RGB space)
      const distance = Math.sqrt(
        Math.pow(colorRgb.r - lockedRgb.r, 2) +
        Math.pow(colorRgb.g - lockedRgb.g, 2) +
        Math.pow(colorRgb.b - lockedRgb.b, 2)
      );
      
      // Threshold: colors closer than 30 in RGB space are considered too similar
      if (distance < 30) return true;
    }
    
    return false;
  }
  
  /**
   * Find the best background color (light, high lightness)
   */
  private static findBestBackground(colors: string[], existingText: Color[]): string | null {
    let bestColor: string | null = null;
    let bestScore = -1;
    
    for (const color of colors) {
      const hsl = hexToHsl(color);
      if (!hsl) continue;
      
      // Prefer light colors for background (lightness > 85)
      if (hsl.l < 85) continue;
      
      // Check contrast with existing text colors
      let contrastScore = 0;
      for (const text of existingText) {
        if (meetsWCAGAA(text.hex, color)) {
          contrastScore += 2;
        } else if (meetsWCAGAAALarge(text.hex, color)) {
          contrastScore += 1;
        }
      }
      
      const score = hsl.l + contrastScore * 10;
      if (score > bestScore) {
        bestScore = score;
        bestColor = color;
      }
    }
    
    // If no suitable color found, create a light neutral
    if (!bestColor) {
      bestColor = harmonyHslToHex({ h: 0, s: 0, l: 95 });
    }
    
    return bestColor;
  }
  
  /**
   * Find the best surface color (slightly darker than background)
   */
  private static findBestSurface(colors: string[], existingText: Color[]): string | null {
    let bestColor: string | null = null;
    let bestScore = -1;
    
    for (const color of colors) {
      const hsl = hexToHsl(color);
      if (!hsl) continue;
      
      // Prefer light colors for surface (lightness 75-90)
      if (hsl.l < 75 || hsl.l > 95) continue;
      
      // Check contrast with existing text colors
      let contrastScore = 0;
      for (const text of existingText) {
        if (meetsWCAGAA(text.hex, color)) {
          contrastScore += 2;
        } else if (meetsWCAGAAALarge(text.hex, color)) {
          contrastScore += 1;
        }
      }
      
      const score = (90 - Math.abs(hsl.l - 85)) + contrastScore * 10;
      if (score > bestScore) {
        bestScore = score;
        bestColor = color;
      }
    }
    
    // If no suitable color found, create a light neutral
    if (!bestColor) {
      bestColor = harmonyHslToHex({ h: 0, s: 5, l: 90 });
    }
    
    return bestColor;
  }
  
  /**
   * Find the best text color (dark, high contrast with background)
   */
  private static findBestTextColor(colors: string[], backgroundColor: string): string | null {
    let bestColor: string | null = null;
    let bestScore = -1;
    
    for (const color of colors) {
      const hsl = hexToHsl(color);
      if (!hsl) continue;
      
      // Prefer dark colors for text (lightness < 30)
      if (hsl.l > 40) continue;
      
      // Check contrast with background
      let score = 0;
      if (meetsWCAGAA(color, backgroundColor)) {
        score = 100;
      } else if (meetsWCAGAAALarge(color, backgroundColor)) {
        score = 50;
      } else {
        continue; // Skip colors that don't meet minimum contrast
      }
      
      score += (30 - hsl.l); // Prefer darker colors
      
      if (score > bestScore) {
        bestScore = score;
        bestColor = color;
      }
    }
    
    // If no suitable color found, use the calculated text color
    if (!bestColor) {
      bestColor = getTextColor(backgroundColor);
    }
    
    return bestColor;
  }
  
  /**
   * Find or create a semantic color (success, warning, error, info)
   */
  private static findOrCreateSemanticColor(type: 'success' | 'warning' | 'error' | 'info', colors: string[]): string {
    const semanticHues = {
      success: 140, // Green
      warning: 45,  // Yellow/Orange
      error: 0,     // Red
      info: 210     // Blue
    };
    
    const targetHue = semanticHues[type];
    
    // Try to find a color close to the semantic hue
    for (const color of colors) {
      const hsl = hexToHsl(color);
      if (!hsl) continue;
      
      const hueDiff = Math.abs(hsl.h - targetHue);
      const normalizedDiff = Math.min(hueDiff, 360 - hueDiff);
      
      if (normalizedDiff < 30 && hsl.s > 40 && hsl.l > 35 && hsl.l < 70) {
        return color;
      }
    }
    
    // Create a semantic color
    return harmonyHslToHex({ h: targetHue, s: 65, l: 50 });
  }
}
