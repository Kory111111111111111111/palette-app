'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Palette,
  RefreshCw,
  Check,
  Wand2,
} from 'lucide-react';
import { UIPalette, Color, GenerationContext } from '@/types';
import { 
  ColorHarmonyType, 
  generateShades, 
  generateTints,
  adjustColorLightness,
  generateProfessionalUIHarmony,
  calculateColorHarmonyScore,
} from '@/utils/harmony';
import { meetsWCAGAA } from '@/utils/color';
import { analyzeColorPsychology, calculatePaletteHarmonyScore } from '@/utils/colorTheory';
import { cn } from '@/lib/utils';

interface EnhancedColorHarmonySuggestionsProps {
  palette: UIPalette;
  onApplySuggestion: (suggestion: UIPalette) => void;
  onGenerateWithHarmony: (context: GenerationContext) => Promise<void>;
  isGenerating: boolean;
}

interface HarmonySuggestion {
  id: string;
  type: ColorHarmonyType;
  name: string;
  description: string;
  colors: Color[];
  confidence: number;
  preview: UIPalette;
  reasoning: string;
  accessibilityScore: number;
}

interface HarmonySettings {
  includeShades: boolean;
  includeTints: boolean;
  maxColors: number;
  minContrast: number;
  preferAccessible: boolean;
  harmonyTypes: ColorHarmonyType[];
}

export function EnhancedColorHarmonySuggestions({
  palette,
  onApplySuggestion,
  onGenerateWithHarmony,
  isGenerating
}: EnhancedColorHarmonySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<HarmonySuggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [appliedSuggestion, setAppliedSuggestion] = useState<string | null>(null);
  const [settings, setSettings] = useState<HarmonySettings>({
    includeShades: true,
    includeTints: true,
    maxColors: 12,
    minContrast: 4.5,
    preferAccessible: true,
    harmonyTypes: ['complementary', 'analogous', 'triadic', 'tetradic', 'splitComplementary']
  });

  // Get locked colors for harmony analysis - memoized for performance
  const lockedColors = useMemo(() =>
    Object.values(palette).flat().filter(color => color.locked),
    [palette]
  );

  // Analyze existing palette for better suggestions - expensive computation, memoized
  const paletteAnalysis = useMemo(() => {
    const allColors = Object.values(palette).flat();
    if (allColors.length === 0) return null;

    const hexColors = allColors.map(color => color.hex);

    const avgSaturation = allColors.reduce((sum, color) => {
      const hsl = hexToHsl(color.hex);
      return sum + (hsl?.s || 0);
    }, 0) / allColors.length;

    const avgLightness = allColors.reduce((sum, color) => {
      const hsl = hexToHsl(color.hex);
      return sum + (hsl?.l || 0);
    }, 0) / allColors.length;

    // Use advanced color theory analysis
    const harmonyAnalysis = calculatePaletteHarmonyScore(hexColors);
    const colorPsychologies = hexColors.map(hex => analyzeColorPsychology(hex));

    return {
      avgSaturation: Math.round(avgSaturation),
      avgLightness: Math.round(avgLightness),
      colorCount: allColors.length,
      hasWarmColors: allColors.some(color => {
        const hsl = hexToHsl(color.hex);
        return hsl && (hsl.h < 60 || hsl.h > 300);
      }),
      hasCoolColors: allColors.some(color => {
        const hsl = hexToHsl(color.hex);
        return hsl && hsl.h >= 180 && hsl.h <= 300;
      }),
      harmonyScore: harmonyAnalysis.score,
      harmonyType: harmonyAnalysis.harmonyType,
      strengths: harmonyAnalysis.strengths,
      improvements: harmonyAnalysis.improvements,
      dominantEmotions: colorPsychologies.map(psych => psych.dominantEmotion),
      colorTemperatures: colorPsychologies.map(psych => psych.temperature)
    };
  }, [palette]);

  const createCompletePaletteSuggestion = async (
    baseColor: Color,
    harmonyColors: string[],
    type: ColorHarmonyType,
    analysis: typeof paletteAnalysis
  ): Promise<HarmonySuggestion | null> => {
    try {
      // Create base colors from harmony
      const baseColors = harmonyColors.map((hex, index) => ({
        hex,
        role: getRoleForHarmonyColor(type, index),
        locked: false,
        isCustom: false
      }));

      // Generate shades and tints if enabled
      const extendedColors: Color[] = [];
      if (settings.includeShades) {
        const shades = generateShades(baseColor.hex, 3).map(hex => ({
          hex,
          role: 'Shade',
          locked: false,
          isCustom: false
        }));
        extendedColors.push(...shades);
      }
      
      if (settings.includeTints) {
        const tints = generateTints(baseColor.hex, 3).map(hex => ({
          hex,
          role: 'Tint',
          locked: false,
          isCustom: false
        }));
        extendedColors.push(...tints);
      }

      // Create complete palette structure
      const preview: UIPalette = {
        brand: baseColors.slice(0, 3),
        surface: generateSurfaceColors(baseColors[0]?.hex || baseColor.hex, analysis),
        text: generateTextColors(baseColors[0]?.hex || baseColor.hex, analysis),
        feedback: generateFeedbackColors(baseColors[0]?.hex || baseColor.hex),
        extended: extendedColors.slice(0, 6),
        custom: []
      };

      // Calculate confidence and accessibility
      const confidence = calculateAdvancedConfidence(baseColor, harmonyColors, type, analysis);
      const accessibilityScore = calculateAccessibilityScore(preview);
      const reasoning = generateReasoning(type, confidence, accessibilityScore, analysis);

      return {
        id: `${type}-${baseColor.hex}-${Date.now()}`,
        type,
        name: getHarmonyDisplayName(type),
        description: getHarmonyDescription(type),
        colors: baseColors,
        confidence,
        preview,
        reasoning,
        accessibilityScore
      };
    } catch (error) {
      console.error('Error creating palette suggestion:', error);
      return null;
    }
  };

  const generateSuggestions = useCallback(async () => {
    if (lockedColors.length === 0) {
      return;
    }

    setIsGeneratingSuggestions(true);
    
    try {
      const newSuggestions: HarmonySuggestion[] = [];
      
      // Generate suggestions for each locked color
      for (const lockedColor of lockedColors) {
        for (const type of settings.harmonyTypes) {
          // Use professional UI harmony generation
          const harmonyColors = generateProfessionalUIHarmony(lockedColor.hex, type, true);
          
          if (harmonyColors.length > 0) {
            // Create a complete palette suggestion
            const suggestion = await createCompletePaletteSuggestion(
              lockedColor,
              harmonyColors,
              type,
              paletteAnalysis
            );
            
            if (suggestion) {
              newSuggestions.push(suggestion);
            }
          }
        }
      }
      
      // Remove duplicates and sort by confidence
      const uniqueSuggestions = removeDuplicateSuggestions(newSuggestions);
      uniqueSuggestions.sort((a, b) => b.confidence - a.confidence);
      
      setSuggestions(uniqueSuggestions.slice(0, 8)); // Limit to top 8
    } catch (error) {
      console.error('Error generating harmony suggestions:', error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [lockedColors, settings, paletteAnalysis]);


  const generateSurfaceColors = (baseHex: string, analysis: typeof paletteAnalysis): Color[] => {
    const hsl = hexToHsl(baseHex);
    if (!hsl || !analysis) return [];

    // Generate surface colors with appropriate lightness
    const surfaceLightness = analysis.avgLightness > 50 ? 95 : 15; // Light or dark theme
    const surfaceHex = hslToHex({ ...hsl, l: surfaceLightness });

    return [
      { hex: surfaceHex, role: 'Background', locked: false, isCustom: false },
      { hex: adjustColorLightness(surfaceHex, -10), role: 'Surface', locked: false, isCustom: false }
    ];
  };

  const generateTextColors = (baseHex: string, analysis: typeof paletteAnalysis): Color[] => {
    const hsl = hexToHsl(baseHex);
    if (!hsl || !analysis) return [];

    // Generate text colors with high contrast
    const textLightness = analysis.avgLightness > 50 ? 10 : 90;
    const textHex = hslToHex({ ...hsl, l: textLightness });

    return [
      { hex: textHex, role: 'Text Primary', locked: false, isCustom: false },
      { hex: adjustColorLightness(textHex, 20), role: 'Text Secondary', locked: false, isCustom: false }
    ];
  };

  const generateFeedbackColors = (baseHex: string): Color[] => {
    const hsl = hexToHsl(baseHex);
    if (!hsl) return [];
    
    // Generate feedback colors with different hues
    return [
      { hex: hslToHex({ h: 120, s: Math.min(hsl.s + 20, 100), l: 50 }), role: 'Success', locked: false, isCustom: false },
      { hex: hslToHex({ h: 45, s: Math.min(hsl.s + 20, 100), l: 50 }), role: 'Warning', locked: false, isCustom: false },
      { hex: hslToHex({ h: 0, s: Math.min(hsl.s + 20, 100), l: 50 }), role: 'Error', locked: false, isCustom: false }
    ];
  };

  const calculateAdvancedConfidence = (
    baseColor: Color,
    harmonyColors: string[],
    type: ColorHarmonyType,
    analysis: typeof paletteAnalysis
  ): number => {
    let confidence = 0.3; // Base confidence
    
    // Use color theory harmony score
    const harmonyScore = calculateColorHarmonyScore(harmonyColors);
    confidence += harmonyScore * 0.4;
    
    // Harmony type preference
    const typeWeights = {
      complementary: 0.9,
      analogous: 0.8,
      triadic: 0.7,
      tetradic: 0.6,
      splitComplementary: 0.75
    };
    confidence += typeWeights[type] * 0.2;
    
    // Color count bonus
    confidence += Math.min(harmonyColors.length * 0.05, 0.15);
    
    // Saturation match
    const baseHsl = hexToHsl(baseColor.hex);
    if (baseHsl && analysis) {
      const saturationDiff = Math.abs(baseHsl.s - analysis.avgSaturation);
      confidence += (100 - saturationDiff) / 100 * 0.15;
    }
    
    // Accessibility bonus
    const accessibilityScore = calculateAccessibilityScore({ 
      brand: harmonyColors.map(hex => ({ hex, role: 'Brand', locked: false, isCustom: false })),
      surface: [],
      text: [],
      feedback: [],
      extended: [],
      custom: []
    });
    confidence += accessibilityScore * 0.1;
    
    return Math.min(confidence, 1.0);
  };

  const calculateAccessibilityScore = (palette: UIPalette): number => {
    const allColors = Object.values(palette).flat();
    let accessiblePairs = 0;
    let totalPairs = 0;
    
    for (let i = 0; i < allColors.length; i++) {
      for (let j = i + 1; j < allColors.length; j++) {
        totalPairs++;
        if (meetsWCAGAA(allColors[i].hex, allColors[j].hex)) {
          accessiblePairs++;
        }
      }
    }
    
    return totalPairs > 0 ? accessiblePairs / totalPairs : 0;
  };

  const generateReasoning = (
    type: ColorHarmonyType,
    confidence: number,
    accessibilityScore: number,
    analysis: typeof paletteAnalysis
  ): string => {
    const reasons = [];
    
    if (confidence > 0.8) reasons.push('High color harmony match');
    if (accessibilityScore > 0.7) reasons.push('Good accessibility');

    if (analysis) {
      if (analysis.avgSaturation > 70) reasons.push('Vibrant color scheme');
      if (analysis.avgLightness > 60) reasons.push('Light theme friendly');

      // Add color theory insights
      if (analysis.harmonyScore > 0.7) {
        reasons.push('Strong color theory foundation');
      }
      if (analysis.strengths.length > 0) {
        reasons.push(`Strengths: ${analysis.strengths.slice(0, 2).join(', ')}`);
      }

      // Add emotional impact insights
      const uniqueEmotions = [...new Set(analysis.dominantEmotions)];
      if (uniqueEmotions.length > 0) {
        reasons.push(`Emotional impact: ${uniqueEmotions.slice(0, 2).join(', ')}`);
      }
    }
    
    switch (type) {
      case 'complementary':
        reasons.push('High contrast for emphasis');
        break;
      case 'analogous':
        reasons.push('Harmonious and calming');
        break;
      case 'triadic':
        reasons.push('Balanced and energetic');
        break;
    }
    
    return reasons.join(' • ') || 'Good color combination';
  };

  const removeDuplicateSuggestions = (suggestions: HarmonySuggestion[]): HarmonySuggestion[] => {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.type + '-' + suggestion.colors.map(c => c.hex).join('-');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getHarmonyDisplayName = (type: ColorHarmonyType): string => {
    const names = {
      complementary: 'Complementary',
      analogous: 'Analogous',
      triadic: 'Triadic',
      tetradic: 'Tetradic',
      splitComplementary: 'Split Complementary'
    };
    return names[type];
  };

  const getHarmonyDescription = (type: ColorHarmonyType): string => {
    const descriptions = {
      complementary: 'High contrast colors for emphasis and callouts',
      analogous: 'Harmonious colors for cohesive design',
      triadic: 'Balanced colors for vibrant interfaces',
      tetradic: 'Rich variety for complex designs',
      splitComplementary: 'Subtle contrast with harmony'
    };
    return descriptions[type];
  };

  const getRoleForHarmonyColor = (type: ColorHarmonyType, index: number): string => {
    const roles = {
      complementary: ['Primary', 'Secondary'],
      analogous: ['Primary', 'Secondary', 'Accent'],
      triadic: ['Primary', 'Secondary', 'Accent'],
      tetradic: ['Primary', 'Secondary', 'Accent', 'Tertiary'],
      splitComplementary: ['Primary', 'Secondary', 'Accent']
    };
    
    const typeRoles = roles[type] || ['Primary', 'Secondary', 'Accent'];
    return typeRoles[index] || 'Accent';
  };

  const handleApplySuggestion = (suggestion: HarmonySuggestion) => {
    onApplySuggestion(suggestion.preview);
    setAppliedSuggestion(suggestion.id);
  };

  const handleGenerateWithHarmony = (suggestion: HarmonySuggestion) => {
    // Create generation context with harmony colors as locked colors
    const lockedHarmonyColors = suggestion.colors.map(color => ({
      ...color,
      locked: true
    }));

    const context: GenerationContext = {
      type: 'prompt',
      prompt: `Generate a complete UI palette using these harmony colors: ${suggestion.name}. ${suggestion.reasoning}`,
      lockedColors: lockedHarmonyColors,
      colorCount: settings.maxColors
    };

    onGenerateWithHarmony(context);
    setAppliedSuggestion(suggestion.id);
  };

  const handleRegenerate = () => {
    setSuggestions([]);
    setAppliedSuggestion(null);
    setShowAllSuggestions(false);
    generateSuggestions();
  };

  // Auto-generate suggestions when locked colors change
  useEffect(() => {
    if (lockedColors.length > 0 && suggestions.length === 0) {
      generateSuggestions();
    }
  }, [lockedColors.length, suggestions.length, generateSuggestions]);

  if (lockedColors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Color Harmony
          </CardTitle>
          <CardDescription>
            Lock colors to get intelligent harmony suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Lock colors to see AI-powered harmony suggestions based on color theory
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">Complementary</Badge>
              <Badge variant="outline">Analogous</Badge>
              <Badge variant="outline">Triadic</Badge>
              <Badge variant="outline">Tetradic</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Smart Color Harmony
            </CardTitle>
            <CardDescription>
              AI-powered suggestions with complete palette generation
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isGeneratingSuggestions}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isGeneratingSuggestions && "animate-spin")} />
            Regenerate
          </Button>
        </div>
      </CardHeader>
      

      <CardContent>
        {isGeneratingSuggestions ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Generating smart harmony suggestions...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No suggestions available. Try adjusting settings or lock different colors.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Display top suggestions (3 by default, or all if showAllSuggestions is true) */}
            {suggestions
              .slice(0, showAllSuggestions ? suggestions.length : 3)
              .map((suggestion) => (
                <SimplifiedHarmonySuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  isApplied={appliedSuggestion === suggestion.id}
                  onApply={() => handleApplySuggestion(suggestion)}
                  onGenerate={() => handleGenerateWithHarmony(suggestion)}
                  isGenerating={isGenerating}
                />
              ))}

            {/* Show More/Less button */}
            {suggestions.length > 3 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                  className="text-sm"
                >
                  {showAllSuggestions ? 'Show Less' : `Show ${suggestions.length - 3} More Suggestions`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SimplifiedHarmonySuggestionCardProps {
  suggestion: HarmonySuggestion;
  isApplied: boolean;
  onApply: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const SimplifiedHarmonySuggestionCard = memo(function SimplifiedHarmonySuggestionCard({
  suggestion,
  isApplied,
  onApply,
  onGenerate,
  isGenerating
}: SimplifiedHarmonySuggestionCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all", isApplied && "ring-2 ring-primary bg-primary/5")}>
      <CardHeader className="pb-3">
        <div className="space-y-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              {suggestion.name}
              <Badge variant="outline" className="text-xs">
                {Math.round(suggestion.confidence * 100)}% match
              </Badge>
              {suggestion.accessibilityScore >= 0.7 && (
                <Badge variant="default" className="text-xs">
                  ♿ Accessible
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {suggestion.description}
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {suggestion.reasoning}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <Wand2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Generate New</span>
              <span className="sm:hidden">New</span>
            </Button>
            <Button
              size="sm"
              onClick={onApply}
              disabled={isGenerating}
              variant={isApplied ? "default" : "default"}
              className="flex-1 sm:flex-none"
            >
              {isApplied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Applied</span>
                  <span className="sm:hidden">Done</span>
                </>
              ) : (
                <>
                  <Palette className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Apply Colors</span>
                  <span className="sm:hidden">Apply</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {suggestion.colors.map((color, index) => (
            <div key={index} className="space-y-2">
              <div
                className="aspect-square rounded-lg border-2 border-border/50 shadow-sm"
                style={{ backgroundColor: color.hex }}
                title={`${color.hex} - ${color.role}`}
              />
              <p className="text-xs text-center text-muted-foreground font-medium">
                {color.role}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

// Helper function to convert HSL to hex (needed for the component)
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  const { r, g, b } = rgb;
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / diff + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / diff + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToHex(hsl: { h: number; s: number; l: number }): string {
  const { h, s, l } = hsl;
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (sNorm === 0) {
    r = g = b = lNorm; // achromatic
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }
  
  return rgbToHex(
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) return null;
  
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("").toUpperCase();
}
