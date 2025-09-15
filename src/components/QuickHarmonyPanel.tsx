'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Sparkles, Zap, Target, Lightbulb } from 'lucide-react';
import { UIPalette, GenerationContext } from '@/types';
import { generateHarmonyColors, ColorHarmonyType } from '@/utils/harmony';
import { cn } from '@/lib/utils';

interface QuickHarmonyPanelProps {
  palette: UIPalette;
  onGenerateWithHarmony: (context: GenerationContext) => Promise<void>;
  isGenerating: boolean;
}

export function QuickHarmonyPanel({
  palette,
  onGenerateWithHarmony,
  isGenerating
}: QuickHarmonyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHarmony, setSelectedHarmony] = useState<ColorHarmonyType | null>(null);

  function getHarmonyDisplayName(type: ColorHarmonyType): string {
    const names = {
      complementary: 'Complementary',
      analogous: 'Analogous',
      triadic: 'Triadic',
      tetradic: 'Tetradic',
      splitComplementary: 'Split Complementary'
    } as const;
    return names[type];
  }

  function getHarmonyDescription(type: ColorHarmonyType): string {
    const descriptions = {
      complementary: 'High contrast',
      analogous: 'Harmonious',
      triadic: 'Balanced',
      tetradic: 'Rich variety',
      splitComplementary: 'Subtle contrast'
    } as const;
    return descriptions[type];
  }

  // Get locked colors for quick harmony generation
  const lockedColors = Object.values(palette).flat().filter(color => color.locked);
  
  // Generate quick harmony options
  const quickHarmonyOptions = useMemo(() => {
    if (lockedColors.length === 0) return [];
    
    const baseColor = lockedColors[0];
    const harmonyTypes: ColorHarmonyType[] = ['complementary', 'analogous', 'triadic'];
    
    return harmonyTypes.map(type => {
      const colors = generateHarmonyColors(baseColor.hex, type);
      return {
        type,
        name: getHarmonyDisplayName(type),
        description: getHarmonyDescription(type),
        colors: colors.slice(0, 3), // Limit to 3 for quick preview
        baseColor: baseColor.hex
      };
    });
  }, [lockedColors]);

  

  const handleQuickGenerate = async (harmonyType: ColorHarmonyType) => {
    if (!lockedColors.length) return;
    
    const baseColor = lockedColors[0];
    const harmonyColors = generateHarmonyColors(baseColor.hex, harmonyType);
    
    // Create locked colors for AI generation
    const lockedHarmonyColors = harmonyColors.map((hex, index) => ({
      hex,
      role: getRoleForHarmonyColor(harmonyType, index),
      locked: true,
      isCustom: false
    }));
    
    const context: GenerationContext = {
      type: 'prompt',
      prompt: `Generate a complete UI palette using ${getHarmonyDisplayName(harmonyType)} color harmony. Create a professional, accessible color scheme with proper contrast ratios.`,
      lockedColors: lockedHarmonyColors,
      colorCount: 12
    };
    
    setSelectedHarmony(harmonyType);
    await onGenerateWithHarmony(context);
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

  if (lockedColors.length === 0) {
    return null; // Don't show if no locked colors
  }

  return (
    <Card className="border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Quick Harmony</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {lockedColors.length} locked
                </Badge>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </div>
            <CardDescription className="text-xs">
              Generate complete palettes using color theory
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {quickHarmonyOptions.map((option) => (
                <div
                  key={option.type}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {option.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{option.name}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={selectedHarmony === option.type ? "default" : "outline"}
                    onClick={() => handleQuickGenerate(option.type)}
                    disabled={isGenerating}
                    className="h-8"
                  >
                    {selectedHarmony === option.type ? (
                      <>
                        <Zap className="h-3 w-3 mr-1" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Target className="h-3 w-3 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              ))}
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  AI will generate complete palettes with proper UI color roles
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
