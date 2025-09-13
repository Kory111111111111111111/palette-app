'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ArrowLeftRight, X, Download } from 'lucide-react';
import { ColorCard } from './ColorCard';
import { UIPalette, Color } from '@/types';
import { getContrastRatio, meetsWCAGAA } from '@/utils/color';

interface PaletteComparisonProps {
  primaryPalette: UIPalette;
  secondaryPalette: UIPalette;
  onClose: () => void;
  onExportComparison: (format: 'svg' | 'css' | 'ff_hex') => void;
}

interface ColorComparison {
  primary: Color | null;
  secondary: Color | null;
  category: keyof UIPalette;
  index: number;
  contrastRatio?: number;
  wcagCompliant?: boolean;
}

export function PaletteComparison({
  primaryPalette,
  secondaryPalette,
  onClose,
  onExportComparison
}: PaletteComparisonProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    brand: true,
    surface: true,
    text: true,
    feedback: true,
    extended: true,
    custom: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Generate color comparisons for each category
  const generateComparisons = (category: keyof UIPalette): ColorComparison[] => {
    const primaryColors = primaryPalette[category] || [];
    const secondaryColors = secondaryPalette[category] || [];
    const maxLength = Math.max(primaryColors.length, secondaryColors.length);
    
    const comparisons: ColorComparison[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const primary = primaryColors[i] || null;
      const secondary = secondaryColors[i] || null;
      
      let contrastRatio: number | undefined;
      let wcagCompliant: boolean | undefined;
      
      if (primary && secondary) {
        contrastRatio = getContrastRatio(primary.hex, secondary.hex);
        wcagCompliant = meetsWCAGAA(primary.hex, secondary.hex);
      }
      
      comparisons.push({
        primary,
        secondary,
        category,
        index: i,
        contrastRatio,
        wcagCompliant
      });
    }
    
    return comparisons;
  };

  const renderComparisonSection = (
    title: string,
    category: keyof UIPalette,
    description?: string
  ) => {
    const comparisons = generateComparisons(category);
    const hasColors = comparisons.some(comp => comp.primary || comp.secondary);
    
    if (!hasColors && category !== 'custom') return null;

    return (
      <Collapsible
        key={category}
        open={openSections[category]}
        onOpenChange={() => toggleSection(category)}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && (
                  <CardDescription>{description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {comparisons.length} comparison{comparisons.length !== 1 ? 's' : ''}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    openSections[category] ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              {comparisons.map((comparison, index) => (
                <div key={`${category}-${index}`} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Color {index + 1}
                      {comparison.primary?.role && ` - ${comparison.primary.role}`}
                    </h4>
                    {comparison.contrastRatio && (
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={comparison.wcagCompliant ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {comparison.contrastRatio.toFixed(2)}:1
                        </Badge>
                        {comparison.wcagCompliant && (
                          <Badge variant="outline" className="text-xs">
                            WCAG AA
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Palette Color */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm font-medium">Primary Palette</span>
                      </div>
                      {comparison.primary ? (
                        <ColorCard
                          color={comparison.primary}
                          onColorChange={() => {}} // Read-only in comparison
                          onLockToggle={() => {}} // Read-only in comparison
                          onRemove={() => {}} // Read-only in comparison
                          className="pointer-events-none"
                        />
                      ) : (
                        <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">No color</span>
                        </div>
                      )}
                    </div>

                    {/* Secondary Palette Color */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-secondary" />
                        <span className="text-sm font-medium">Secondary Palette</span>
                      </div>
                      {comparison.secondary ? (
                        <ColorCard
                          color={comparison.secondary}
                          onColorChange={() => {}} // Read-only in comparison
                          onLockToggle={() => {}} // Read-only in comparison
                          onRemove={() => {}} // Read-only in comparison
                          className="pointer-events-none"
                        />
                      ) : (
                        <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">No color</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const getTotalColors = (palette: UIPalette) => {
    return Object.values(palette).reduce((count, colors) => count + colors.length, 0);
  };

  const getLockedColors = (palette: UIPalette) => {
    return Object.values(palette).reduce(
      (count, colors) => count + colors.filter((c: Color) => c.locked).length,
      0
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Palette Comparison
              </CardTitle>
              <CardDescription>
                Compare two palettes side-by-side with contrast analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportComparison('svg')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Palette Stats */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="font-medium">Primary Palette</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {getTotalColors(primaryPalette)} colors • {getLockedColors(primaryPalette)} locked
              </div>
            </div>

            {/* Secondary Palette Stats */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span className="font-medium">Secondary Palette</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {getTotalColors(secondaryPalette)} colors • {getLockedColors(secondaryPalette)} locked
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Sections */}
      <Card>
        {renderComparisonSection(
          'Brand Colors',
          'brand',
          'Primary brand colors for logos, buttons, and key UI elements'
        )}
        
        {renderComparisonSection(
          'Surface Colors',
          'surface',
          'Background colors for cards, panels, and elevated surfaces'
        )}
        
        {renderComparisonSection(
          'Text & Border Colors',
          'text',
          'Text colors and border colors with proper contrast ratios'
        )}
        
        {renderComparisonSection(
          'Feedback Colors',
          'feedback',
          'Success, warning, error, and info state colors'
        )}
        
        {renderComparisonSection(
          'Extended Palette',
          'extended',
          'Additional colors for special use cases'
        )}

        {renderComparisonSection(
          'Custom Colors',
          'custom',
          'Manually added colors'
        )}
      </Card>
    </div>
  );
}
