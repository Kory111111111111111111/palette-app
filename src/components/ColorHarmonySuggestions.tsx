'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Palette, RefreshCw, Check } from 'lucide-react';
import { ColorCard } from './ColorCard';
import { UIPalette, Color } from '@/types';
import { generateHarmonyColors, ColorHarmonyType } from '@/utils/harmony';
import { cn } from '@/lib/utils';

interface ColorHarmonySuggestionsProps {
  palette: UIPalette;
  onApplySuggestion: (suggestion: UIPalette) => void;
  isGenerating: boolean;
}

interface HarmonySuggestion {
  id: string;
  type: ColorHarmonyType;
  name: string;
  description: string;
  colors: Color[];
  confidence: number;
}

export function ColorHarmonySuggestions({
  palette,
  onApplySuggestion,
  isGenerating
}: ColorHarmonySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<HarmonySuggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  // Get locked colors for harmony analysis
  const lockedColors = Object.values(palette).flat().filter(color => color.locked);

  const generateSuggestions = useCallback(async () => {
    if (lockedColors.length === 0) {
      return;
    }

    setIsGeneratingSuggestions(true);
    
    try {
      const newSuggestions: HarmonySuggestion[] = [];
      
      // Generate different harmony types
      const harmonyTypes: ColorHarmonyType[] = ['complementary', 'analogous', 'triadic', 'tetradic', 'splitComplementary'];
      
      for (const type of harmonyTypes) {
        const harmonyColors = generateHarmonyColors(lockedColors[0].hex, type);
        
        if (harmonyColors.length > 0) {
          // Create a complete palette suggestion
          const suggestion: HarmonySuggestion = {
            id: `${type}-${Date.now()}`,
            type,
            name: getHarmonyDisplayName(type),
            description: getHarmonyDescription(type),
            colors: harmonyColors.map((hex, index) => ({
              hex,
              role: getRoleForHarmonyColor(type, index),
              locked: false,
              isCustom: false
            })),
            confidence: calculateConfidence(lockedColors[0].hex, harmonyColors, type)
          };
          
          newSuggestions.push(suggestion);
        }
      }
      
      // Sort by confidence
      newSuggestions.sort((a, b) => b.confidence - a.confidence);
      
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating harmony suggestions:', error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [lockedColors]);

  const calculateConfidence = (baseColor: string, harmonyColors: string[], type: ColorHarmonyType): number => {
    // Simple confidence calculation based on color relationships
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for more colors
    confidence += Math.min(harmonyColors.length * 0.1, 0.3);
    
    // Increase confidence for certain harmony types
    switch (type) {
      case 'complementary':
        confidence += 0.2;
        break;
      case 'analogous':
        confidence += 0.15;
        break;
      case 'triadic':
        confidence += 0.1;
        break;
    }
    
    return Math.min(confidence, 1.0);
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
      complementary: 'Colors opposite on the color wheel for high contrast',
      analogous: 'Colors next to each other for harmonious blends',
      triadic: 'Three colors evenly spaced for vibrant balance',
      tetradic: 'Four colors forming a rectangle for rich variety',
      splitComplementary: 'Base color with two adjacent to its complement'
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
    // Create a new palette with the harmony colors
    const newPalette: UIPalette = {
      brand: suggestion.colors.slice(0, 3), // First 3 colors as brand
      surface: [], // Will be generated by AI
      text: [], // Will be generated by AI
      feedback: [], // Will be generated by AI
      extended: suggestion.colors.slice(3), // Remaining as extended
      custom: []
    };
    
    onApplySuggestion(newPalette);
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
            Color Harmony Suggestions
          </CardTitle>
          <CardDescription>
            Lock some colors to get harmony-based suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Lock one or more colors to see harmony suggestions based on color theory
            </p>
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
              Color Harmony Suggestions
            </CardTitle>
            <CardDescription>
              AI-powered suggestions based on color theory and your locked colors
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
            <p className="text-muted-foreground">Generating harmony suggestions...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No suggestions available. Try regenerating or lock different colors.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All Suggestions</TabsTrigger>
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{suggestion.name}</CardTitle>
                        <CardDescription>{suggestion.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {Math.round(suggestion.confidence * 100)}% match
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleApplySuggestion(suggestion)}
                          disabled={isGenerating}
                          variant={selectedSuggestion === suggestion.id ? "default" : "outline"}
                        >
                          {selectedSuggestion === suggestion.id ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Applied
                            </>
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="recommended" className="space-y-4">
              {suggestions
                .filter(s => s.confidence >= 0.7)
                .map((suggestion) => (
                  <Card key={suggestion.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{suggestion.name}</CardTitle>
                          <CardDescription>{suggestion.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">
                            {Math.round(suggestion.confidence * 100)}% match
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handleApplySuggestion(suggestion)}
                            disabled={isGenerating}
                            variant={selectedSuggestion === suggestion.id ? "default" : "outline"}
                          >
                            {selectedSuggestion === suggestion.id ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Applied
                              </>
                            ) : (
                              'Apply'
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
