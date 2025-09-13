'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Image, Palette, Loader2, Upload } from 'lucide-react';
import { PresetPalette, PRESET_PALETTES, GenerationContext } from '@/types';

interface GeneratorControlsProps {
  onGenerate: (context: GenerationContext) => Promise<void>;
  isGenerating: boolean;
  lockedColorsCount: number;
  colorCount: number;
  onColorCountChange: (count: number) => void;
}

export function GeneratorControls({ onGenerate, isGenerating, lockedColorsCount, colorCount, onColorCountChange }: GeneratorControlsProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<PresetPalette[]>([]);
  const [presetMode, setPresetMode] = useState<'inspired' | 'strict'>('inspired');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const handlePresetToggle = (preset: PresetPalette) => {
    if (presetMode === 'strict') {
      // Strict mode: only one preset allowed
      setSelectedPresets(selectedPresets.includes(preset) ? [] : [preset]);
    } else {
      // Inspired mode: multiple presets allowed
      setSelectedPresets(prev => 
        prev.includes(preset) 
          ? prev.filter(p => p !== preset)
          : [...prev, preset]
      );
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!prompt.trim()) return;
    
    await onGenerate({
      type: 'prompt',
      prompt: prompt.trim(),
      colorCount: colorCount
    });
  };

  const handleGeneratePreset = async () => {
    if (selectedPresets.length === 0) return;
    
    await onGenerate({
      type: presetMode === 'inspired' ? 'preset_inspired' : 'preset_strict',
      presetPalettes: selectedPresets,
      colorCount: colorCount
    });
  };

  const handleGenerateScreenshot = async () => {
    if (!screenshot) return;
    
    // For now, we'll implement a simplified version
    // In a real implementation, you'd upload the image and get analysis questions
    await onGenerate({
      type: 'screenshot_refined',
      screenshotAnalysis: {
        imageData: screenshotPreview || '',
        answers: {}
      },
      colorCount: colorCount
    });
  };

  const presetGroups = PRESET_PALETTES.reduce((groups, preset) => {
    if (!groups[preset.group]) {
      groups[preset.group] = [];
    }
    groups[preset.group].push(preset);
    return groups;
  }, {} as Record<string, PresetPalette[]>);

  return (
    <div className="w-full max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Palette
          </CardTitle>
          <CardDescription>
            Create a new color palette using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
              <TabsTrigger value="preset">Presets</TabsTrigger>
              <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
            </TabsList>

            {/* Prompt Tab */}
            <TabsContent value="prompt" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Describe your palette</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., A vibrant retro arcade, A serene minimalist yoga studio, Modern tech startup..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Number of Colors: {colorCount}</Label>
                <Slider
                  value={[colorCount]}
                  onValueChange={(value) => onColorCountChange(value[0])}
                  min={6}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Minimal (6)</span>
                  <span>Balanced (12)</span>
                  <span>Rich (20)</span>
                </div>
              </div>
              
              <Button 
                onClick={handleGeneratePrompt} 
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate from Prompt
              </Button>
            </TabsContent>

            {/* Preset Tab */}
            <TabsContent value="preset" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Preset Mode</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="preset-mode"
                      checked={presetMode === 'strict'}
                      onCheckedChange={(checked) => {
                        setPresetMode(checked ? 'strict' : 'inspired');
                        setSelectedPresets([]);
                      }}
                    />
                    <Label htmlFor="preset-mode">
                      {presetMode === 'strict' ? 'Strict (Single palette)' : 'Inspired (Multiple palettes)'}
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-3">
                    <Label>Number of Colors: {colorCount}</Label>
                    <Slider
                      value={[colorCount]}
                      onValueChange={(value) => onColorCountChange(value[0])}
                      min={6}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Minimal (6)</span>
                      <span>Balanced (12)</span>
                      <span>Rich (20)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {Object.entries(presetGroups).map(([group, presets]) => (
                    <div key={group} className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">{group}</h4>
                      {presets.map((preset) => (
                        <div
                          key={preset.name}
                          className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                            selectedPresets.includes(preset)
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handlePresetToggle(preset)}
                        >
                          <div className="flex gap-1">
                            {preset.colors.slice(0, 4).map((color, index) => (
                              <div
                                key={index}
                                className="w-4 h-4 rounded border border-border"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{preset.name}</p>
                            {preset.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {preset.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleGeneratePreset} 
                  disabled={selectedPresets.length === 0 || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Palette className="h-4 w-4 mr-2" />
                  )}
                  Generate from Preset{selectedPresets.length > 1 ? 's' : ''}
                </Button>
              </div>
            </TabsContent>

            {/* Screenshot Tab */}
            <TabsContent value="screenshot" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="screenshot">Upload UI Screenshot</Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="screenshot"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {screenshotPreview ? (
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      )}
                    </label>
                    <input
                      id="screenshot"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateScreenshot} 
                  disabled={!screenshot || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Image className="h-4 w-4 mr-2" />
                  )}
                  Analyze & Generate
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Locked Colors Info */}
      {lockedColorsCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              {lockedColorsCount} color{lockedColorsCount > 1 ? 's' : ''} locked
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Locked colors will be preserved when generating new palettes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
