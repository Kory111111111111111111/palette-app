'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Plus, Sparkles } from 'lucide-react';
import { ColorCard } from './ColorCard';
import { UIPalette, Color } from '@/types';
import { isValidHex, normalizeHex } from '@/utils/color';

interface PaletteDisplayProps {
  palette: UIPalette;
  onColorChange: (category: keyof UIPalette, index: number, hex: string) => void;
  onLockToggle: (category: keyof UIPalette, index: number) => void;
  onRemoveColor: (category: keyof UIPalette, index: number) => void;
  onAddCustomColor: (hex: string) => void;
  onAnalyzePalette: () => void;
  isGenerating: boolean;
}

export function PaletteDisplay({
  palette,
  onColorChange,
  onLockToggle,
  onRemoveColor,
  onAddCustomColor,
  onAnalyzePalette,
  isGenerating
}: PaletteDisplayProps) {
  const [customColorInput, setCustomColorInput] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    brand: true,
    surface: true,
    text: true,
    feedback: true,
    extended: false,
    custom: true
  });

  const handleAddCustomColor = () => {
    const normalized = normalizeHex(customColorInput);
    if (isValidHex(normalized)) {
      onAddCustomColor(normalized);
      setCustomColorInput('');
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderColorSection = (
    title: string,
    colors: Color[],
    category: keyof UIPalette,
    description?: string
  ) => {
    if (colors.length === 0 && category !== 'custom') return null;

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
                  {colors.length} color{colors.length !== 1 ? 's' : ''}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {colors.map((color, index) => (
                <ColorCard
                  key={`${category}-${index}`}
                  color={color}
                  onColorChange={(hex) => onColorChange(category, index, hex)}
                  onLockToggle={() => onLockToggle(category, index)}
                  onRemove={() => onRemoveColor(category, index)}
                  showRemove={category === 'custom'}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const lockedCount = Object.values(palette).reduce(
    (count, colors) => count + colors.filter((c: Color) => c.locked).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header with Analysis Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Color Palette</h2>
          <p className="text-muted-foreground">
            {Object.values(palette).reduce((count, colors) => count + colors.length, 0)} colors total
            {lockedCount > 0 && ` • ${lockedCount} locked`}
          </p>
        </div>
        <Button onClick={onAnalyzePalette} disabled={isGenerating}>
          <Sparkles className="h-4 w-4 mr-2" />
          Analyze Palette
        </Button>
      </div>

      {/* Palette Sections */}
      <Card>
        {renderColorSection(
          'Brand Colors',
          palette.brand,
          'brand',
          'Primary brand colors for logos, buttons, and key UI elements'
        )}
        
        {renderColorSection(
          'Surface Colors',
          palette.surface,
          'surface',
          'Background colors for cards, panels, and elevated surfaces'
        )}
        
        {renderColorSection(
          'Text & Border Colors',
          palette.text,
          'text',
          'Text colors and border colors with proper contrast ratios'
        )}
        
        {renderColorSection(
          'Feedback Colors',
          palette.feedback,
          'feedback',
          'Success, warning, error, and info state colors'
        )}
        
        {renderColorSection(
          'Extended Palette',
          palette.extended,
          'extended',
          'Additional colors for special use cases'
        )}

        {/* Custom Colors Section */}
        <Collapsible
          open={openSections.custom}
          onOpenChange={() => toggleSection('custom')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Custom Colors</CardTitle>
                  <CardDescription>
                    Manually added colors that you can lock for future generations
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {palette.custom.length} color{palette.custom.length !== 1 ? 's' : ''}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openSections.custom ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Add Custom Color Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="custom-color" className="sr-only">
                    Add custom color
                  </Label>
                  <Input
                    id="custom-color"
                    placeholder="#000000"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCustomColor();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleAddCustomColor} disabled={!customColorInput.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Custom Color Cards */}
              {palette.custom.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {palette.custom.map((color, index) => (
                    <ColorCard
                      key={`custom-${index}`}
                      color={color}
                      onColorChange={(hex) => onColorChange('custom', index, hex)}
                      onLockToggle={() => onLockToggle('custom', index)}
                      onRemove={() => onRemoveColor('custom', index)}
                      showRemove={true}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
