'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Sparkles, 
  Palette, 
  RefreshCw, 
  Check, 
  Eye, 
  Settings, 
  Wand2, 
  Lightbulb,
} from 'lucide-react';
import { ColorCard } from './ColorCard';
import { UIPalette, Color, GenerationContext } from '@/types';
import { 
  generateHarmonyColors, 
  ColorHarmonyType, 
  generateShades, 
  generateTints,
  adjustColorLightness,
} from '@/utils/harmony';
import { meetsWCAGAA } from '@/utils/color';
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
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [settings, setSettings] = useState<HarmonySettings>({
    includeShades: true,
    includeTints: true,
    maxColors: 12,
    minContrast: 4.5,
    preferAccessible: true,
    harmonyTypes: ['complementary', 'analogous', 'triadic', 'tetradic', 'splitComplementary']
  });

  // Get locked colors for harmony analysis
  const lockedColors = Object.values(palette).flat().filter(color => color.locked);
  
  // Analyze existing palette for better suggestions
  const paletteAnalysis = useMemo(() => {
    const allColors = Object.values(palette).flat();
    const avgSaturation = allColors.reduce((sum, color) => {
      const hsl = hexToHsl(color.hex);
      return sum + (hsl?.s || 0);
    }, 0) / allColors.length;
    
    const avgLightness = allColors.reduce((sum, color) => {
      const hsl = hexToHsl(color.hex);
      return sum + (hsl?.l || 0);
    }, 0) / allColors.length;
    
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
      })
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
          const harmonyColors = generateHarmonyColors(lockedColor.hex, type);
          
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
    if (!hsl) return [];
    
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
    if (!hsl) return [];
    
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
    
    // Harmony type preference
    const typeWeights = {
      complementary: 0.9,
      analogous: 0.8,
      triadic: 0.7,
      tetradic: 0.6,
      splitComplementary: 0.75
    };
    confidence += typeWeights[type] * 0.3;
    
    // Color count bonus
    confidence += Math.min(harmonyColors.length * 0.05, 0.2);
    
    // Saturation match
    const baseHsl = hexToHsl(baseColor.hex);
    if (baseHsl) {
      const saturationDiff = Math.abs(baseHsl.s - analysis.avgSaturation);
      confidence += (100 - saturationDiff) / 100 * 0.2;
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
    confidence += accessibilityScore * 0.2;
    
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
    if (analysis.avgSaturation > 70) reasons.push('Vibrant color scheme');
    if (analysis.avgLightness > 60) reasons.push('Light theme friendly');
    
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
    setSelectedSuggestion(suggestion.id);
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
    setSelectedSuggestion(suggestion.id);
  };

  const handleRegenerate = () => {
    setSuggestions([]);
    setSelectedSuggestion(null);
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
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
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
        </div>
      </CardHeader>
      
      {showSettings && (
        <CardContent className="border-t">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Colors</Label>
                <Slider
                  value={[settings.maxColors]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, maxColors: value }))}
                  min={6}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">{settings.maxColors} colors</p>
              </div>
              <div className="space-y-2">
                <Label>Min Contrast</Label>
                <Slider
                  value={[settings.minContrast]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, minContrast: value }))}
                  min={3}
                  max={7}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">{settings.minContrast}:1 ratio</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeShades"
                  checked={settings.includeShades}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeShades: checked }))}
                />
                <Label htmlFor="includeShades">Include Shades</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeTints"
                  checked={settings.includeTints}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeTints: checked }))}
                />
                <Label htmlFor="includeTints">Include Tints</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="preferAccessible"
                  checked={settings.preferAccessible}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, preferAccessible: checked }))}
                />
                <Label htmlFor="preferAccessible">Prefer Accessible</Label>
              </div>
            </div>
          </div>
        </CardContent>
      )}

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
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({suggestions.length})</TabsTrigger>
              <TabsTrigger value="recommended">
                Recommended ({suggestions.filter(s => s.confidence >= 0.7).length})
              </TabsTrigger>
              <TabsTrigger value="accessible">
                Accessible ({suggestions.filter(s => s.accessibilityScore >= 0.7).length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {suggestions.map((suggestion) => (
                <HarmonySuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  isSelected={selectedSuggestion === suggestion.id}
                  onApply={() => handleApplySuggestion(suggestion)}
                  onGenerate={() => handleGenerateWithHarmony(suggestion)}
                  onPreview={() => setPreviewMode(!previewMode)}
                  isGenerating={isGenerating}
                  previewMode={previewMode}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="recommended" className="space-y-4">
              {suggestions
                .filter(s => s.confidence >= 0.7)
                .map((suggestion) => (
                  <HarmonySuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    isSelected={selectedSuggestion === suggestion.id}
                    onApply={() => handleApplySuggestion(suggestion)}
                    onGenerate={() => handleGenerateWithHarmony(suggestion)}
                    onPreview={() => setPreviewMode(!previewMode)}
                    isGenerating={isGenerating}
                    previewMode={previewMode}
                  />
                ))}
            </TabsContent>
            
            <TabsContent value="accessible" className="space-y-4">
              {suggestions
                .filter(s => s.accessibilityScore >= 0.7)
                .map((suggestion) => (
                  <HarmonySuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    isSelected={selectedSuggestion === suggestion.id}
                    onApply={() => handleApplySuggestion(suggestion)}
                    onGenerate={() => handleGenerateWithHarmony(suggestion)}
                    onPreview={() => setPreviewMode(!previewMode)}
                    isGenerating={isGenerating}
                    previewMode={previewMode}
                  />
                ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

interface HarmonySuggestionCardProps {
  suggestion: HarmonySuggestion;
  isSelected: boolean;
  onApply: () => void;
  onGenerate: () => void;
  onPreview: () => void;
  isGenerating: boolean;
  previewMode: boolean;
}

function HarmonySuggestionCard({
  suggestion,
  isSelected,
  onApply,
  onGenerate,
  onPreview,
  isGenerating,
  previewMode
}: HarmonySuggestionCardProps) {
  return (
    <Card className={cn("overflow-hidden", isSelected && "ring-2 ring-primary")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {suggestion.name}
              <Badge variant="outline" className="text-xs">
                {Math.round(suggestion.confidence * 100)}%
              </Badge>
              <Badge 
                variant={suggestion.accessibilityScore >= 0.7 ? "default" : "secondary"}
                className="text-xs"
              >
                {Math.round(suggestion.accessibilityScore * 100)}% accessible
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {suggestion.description}
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-1">
              {suggestion.reasoning}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={onApply}
              disabled={isGenerating}
              variant={isSelected ? "default" : "outline"}
            >
              {isSelected ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Applied
                </>
              ) : (
                'Apply'
              )}
            </Button>
            <Button
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
              variant="secondary"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {previewMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(suggestion.preview).map(([category, colors]) => (
                colors.length > 0 && (
                  <div key={category} className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground capitalize">
                      {category}
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {colors.slice(0, 4).map((color: Color, index: number) => (
                        <div
                          key={index}
                          className="aspect-square rounded border border-border"
                          style={{ backgroundColor: color.hex }}
                          title={color.hex}
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {suggestion.colors.map((color, index) => (
              <div key={index} className="space-y-2">
                <ColorCard
                  color={color}
                  onColorChange={() => {}} // Read-only
                  onLockToggle={() => {}} // Read-only
                  onRemove={() => {}} // Read-only
                  className="pointer-events-none"
                />
                <p className="text-xs text-center text-muted-foreground">
                  {color.role}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
