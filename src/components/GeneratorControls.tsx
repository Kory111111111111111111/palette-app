'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Image, Palette, Loader2, Upload, FileText, Settings } from 'lucide-react';
import { PresetPalette, PRESET_PALETTES, GenerationContext, AnalysisQuestion, SavedPalette } from '@/types';
import { ScreenshotAnalysisModal } from '@/components/ScreenshotAnalysisModal';
import { QuickHarmonyPanel } from '@/components/QuickHarmonyPanel';
import { AIService } from '@/services/ai';
import { processImage, validateImage, compressImage } from '@/utils/image';
import { useUserJourney } from '@/contexts/UserJourneyContext';

interface GeneratorControlsProps {
  onGenerate: (context: GenerationContext) => Promise<void>;
  isGenerating: boolean;
  lockedColorsCount: number;
  colorCount: number;
  onColorCountChange: (count: number) => void;
  aiService: AIService | null;
  savedPalettes: SavedPalette[];
  onLoadPalette: (palette: SavedPalette) => void;
  onDeletePalette: (id: string) => void;
  palette: any; // UIPalette
}

export function GeneratorControls({ onGenerate, isGenerating, lockedColorsCount, colorCount, onColorCountChange, aiService, savedPalettes, onLoadPalette, onDeletePalette, palette }: GeneratorControlsProps) {
  const { shouldShowAdvancedFeatures, incrementCounter } = useUserJourney();

  const [generationMethod, setGenerationMethod] = useState<'quick' | 'prompt' | 'preset' | 'screenshot'>('quick');
  const [prompt, setPrompt] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<PresetPalette[]>([]);
  const [presetMode, setPresetMode] = useState<'inspired' | 'strict'>('inspired');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
  // Screenshot analysis state
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisQuestions, setAnalysisQuestions] = useState<AnalysisQuestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 [GeneratorControls] Starting image upload...');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('📸 [GeneratorControls] No file selected');
      return;
    }

    console.log('📸 [GeneratorControls] File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      console.log('📸 [GeneratorControls] Validating image...');
      // Validate the image
      const validation = validateImage(file);
      console.log('📸 [GeneratorControls] Validation result:', validation);
      
      if (!validation.isValid) {
        console.error('📸 [GeneratorControls] Validation failed:', validation.error);
        alert(validation.error);
        return;
      }

      console.log('📸 [GeneratorControls] Processing image...');
      // Process and compress the image
      const imageDataUrl = await processImage(file);
      console.log('📸 [GeneratorControls] Image processed, length:', imageDataUrl.length);
      
      console.log('📸 [GeneratorControls] Compressing image...');
      const compressedImage = await compressImage(imageDataUrl, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.8
      });
      console.log('📸 [GeneratorControls] Image compressed, length:', compressedImage.length);

      setScreenshot(file);
      setScreenshotPreview(compressedImage);
      setAnalysisError(null);
      console.log('📸 [GeneratorControls] Image upload completed successfully!');
    } catch (error) {
      console.error('📸 [GeneratorControls] Error processing image:', error);
      console.error('📸 [GeneratorControls] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert('Failed to process image. Please try again.');
    }
  };

  const handleQuickGenerate = async (type: 'brand' | 'ui' | 'web') => {
    incrementCounter('generationsCount');

    if (!aiService) {
      // For demo mode, we'll use a special context that the main page can handle
      await onGenerate({
        type: 'prompt',
        prompt: `DEMO_MODE_${type}`,
        colorCount: type === 'brand' ? 8 : type === 'ui' ? 16 : 12
      });
      return;
    }

    const quickPrompts = {
      brand: 'Generate a professional brand color palette with primary, secondary, and accent colors that work well together',
      ui: 'Generate a complete UI design system palette including brand colors, surface colors, text colors, and feedback colors with proper accessibility',
      web: 'Generate a modern web application color palette suitable for websites and web apps'
    };

    const smartColorCounts = {
      brand: 8,
      ui: 16,
      web: 12
    };

    await onGenerate({
      type: 'prompt',
      prompt: quickPrompts[type],
      colorCount: smartColorCounts[type]
    });
  };

  const handleGeneratePrompt = async () => {
    if (!prompt.trim()) return;

    incrementCounter('generationsCount');
    await onGenerate({
      type: 'prompt',
      prompt: prompt.trim(),
      colorCount: colorCount
    });
  };

  const handleGeneratePreset = async () => {
    if (selectedPresets.length === 0) return;
    
    incrementCounter('generationsCount');
    await onGenerate({
      type: presetMode === 'inspired' ? 'preset_inspired' : 'preset_strict',
      presetPalettes: selectedPresets,
      colorCount: colorCount
    });
  };

  const handleGenerateScreenshot = async () => {
    console.log('🎯 [GeneratorControls] Starting screenshot generation...');
    console.log('🎯 [GeneratorControls] Screenshot exists:', !!screenshot);
    console.log('🎯 [GeneratorControls] Screenshot preview exists:', !!screenshotPreview);
    console.log('🎯 [GeneratorControls] AI service exists:', !!aiService);
    
    if (!screenshot || !screenshotPreview || !aiService) {
      if (!aiService) {
        console.error('🎯 [GeneratorControls] No AI service available');
        alert('Please configure your API key in settings first.');
      }
      return;
    }

    try {
      console.log('🎯 [GeneratorControls] Setting up analysis state...');
      setAnalysisError(null);
      setIsAnalyzing(true);
      setAnalysisQuestions([]);
      setAnalysisModalOpen(true);

      console.log('🎯 [GeneratorControls] Calling AI service...');
      console.log('🎯 [GeneratorControls] Screenshot preview length:', screenshotPreview.length);
      
      // Analyze the image and generate questions
      const questions = await aiService.analyzeImageAndSuggestQuestions(screenshotPreview);
      
      console.log('🎯 [GeneratorControls] AI service returned questions:', questions);
      console.log('🎯 [GeneratorControls] Questions count:', questions.length);
      
      console.log('🎯 [GeneratorControls] Setting questions and stopping analysis...');
      setAnalysisQuestions(questions);
      setIsAnalyzing(false);
      console.log('🎯 [GeneratorControls] Analysis completed successfully!');
    } catch (error) {
      console.error('🎯 [GeneratorControls] Error analyzing screenshot:', error);
      console.error('🎯 [GeneratorControls] Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('🎯 [GeneratorControls] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze screenshot');
      setIsAnalyzing(false);
    }
  };

  const handleAnalysisComplete = async (answers: Record<string, string>) => {
    if (!screenshotPreview) return;

    try {
      await onGenerate({
        type: 'screenshot_refined',
        screenshotAnalysis: {
          imageData: screenshotPreview,
          answers: answers
        },
        colorCount: colorCount
      });
      setAnalysisModalOpen(false);
    } catch (error) {
      console.error('Error generating palette:', error);
      setAnalysisError('Failed to generate palette. Please try again.');
    }
  };

  const handleAnalyzeRetry = async () => {
    if (!screenshotPreview || !aiService) return;
    
    try {
      setAnalysisError(null);
      setIsAnalyzing(true);
      setAnalysisQuestions([]);

      const questions = await aiService.analyzeImageAndSuggestQuestions(screenshotPreview);
      setAnalysisQuestions(questions);
    } catch (error) {
      console.error('Error analyzing screenshot:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze screenshot');
      setIsAnalyzing(false);
    }
  };

  const presetGroups = PRESET_PALETTES.reduce((groups, preset) => {
    if (!groups[preset.group]) {
      groups[preset.group] = [];
    }
    groups[preset.group].push(preset);
    return groups;
  }, {} as Record<string, PresetPalette[]>);

  return (
    <div className="w-full space-y-6">
      {/* Generation Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            How would you like to generate colors?
          </CardTitle>
          <CardDescription>
            Choose your preferred method to create the perfect palette
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={generationMethod}
            onValueChange={(value) => setGenerationMethod(value as typeof generationMethod)}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quick" id="quick" />
              <Label htmlFor="quick" className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="h-4 w-4" />
                <div>
                  <div className="font-medium">Quick Start</div>
                  <div className="text-sm text-muted-foreground">Smart defaults for common needs</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="prompt" id="prompt" />
              <Label htmlFor="prompt" className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                <div>
                  <div className="font-medium">Describe It</div>
                  <div className="text-sm text-muted-foreground">Tell us what you need</div>
                </div>
              </Label>
            </div>

            {shouldShowAdvancedFeatures() && (
              <>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="preset" id="preset" />
                  <Label htmlFor="preset" className="flex items-center gap-2 cursor-pointer">
                    <Palette className="h-4 w-4" />
                    <div>
                      <div className="font-medium">From Presets</div>
                      <div className="text-sm text-muted-foreground">Inspired by existing palettes</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="screenshot" id="screenshot" />
                  <Label htmlFor="screenshot" className="flex items-center gap-2 cursor-pointer">
                    <Image className="h-4 w-4" />
                    <div>
                      <div className="font-medium">From Image</div>
                      <div className="text-sm text-muted-foreground">Extract colors from photos</div>
                    </div>
                  </Label>
                </div>
              </>
            )}
          </RadioGroup>
        </CardContent>
      </Card>


      {generationMethod === 'prompt' && (
        <Card>
          <CardHeader>
            <CardTitle>Describe your ideal palette</CardTitle>
            <CardDescription>
              Tell us about your project, brand, or the mood you&apos;re going for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">What kind of colors do you need?</Label>
              <Textarea
                id="prompt"
                placeholder="e.g., A vibrant retro arcade game, A serene minimalist yoga studio, A modern tech startup..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-between items-center">
              <Button
                onClick={handleGeneratePrompt}
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate from Description
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Options
          </CardTitle>
          <CardDescription>
            Fine-tune your palette generation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Color Count Slider */}
          <div className="space-y-2">
            <Label>Number of Colors: {colorCount}</Label>
            <Slider
              value={[colorCount]}
              onValueChange={(value) => onColorCountChange(value[0])}
              min={6}
              max={35}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground px-2">
              <span>Minimal (6)</span>
              <span>Balanced (12)</span>
              <span>Rich (20)</span>
              <span>Extended (35)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legacy Quick Generate Section - Remove after testing */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Generate
          </CardTitle>
          <CardDescription>
            Generate a palette with one click using smart defaults
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              onClick={() => handleQuickGenerate('brand')}
              disabled={isGenerating}
              className="h-auto p-4 flex flex-col items-center gap-2 whitespace-normal break-words text-pretty w-full"
              variant="outline"
            >
              <Palette className="h-6 w-6" />
              <div className="text-center leading-snug">
                <div className="font-medium">Brand Colors</div>
                <div className="text-xs text-muted-foreground">Primary, secondary & accent</div>
              </div>
            </Button>

            <Button
              onClick={() => handleQuickGenerate('ui')}
              disabled={isGenerating}
              className="h-auto p-4 flex flex-col items-center gap-2 whitespace-normal break-words text-pretty w-full"
              variant="outline"
            >
              <Image className="h-6 w-6" />
              <div className="text-center leading-snug">
                <div className="font-medium">Complete UI</div>
                <div className="text-xs text-muted-foreground">Full design system</div>
              </div>
            </Button>

            <Button
              onClick={() => handleQuickGenerate('web')}
              disabled={isGenerating}
              className="h-auto p-4 flex flex-col items-center gap-2 whitespace-normal break-words text-pretty w-full"
              variant="outline"
            >
              <FileText className="h-6 w-6" />
              <div className="text-center leading-snug">
                <div className="font-medium">Web Palette</div>
                <div className="text-xs text-muted-foreground">Modern web colors</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Advanced Generation
          </CardTitle>
          <CardDescription>
            Fine-tune your palette generation with custom prompts and presets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
              <TabsTrigger value="preset">Presets</TabsTrigger>
              <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
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
                  max={35}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground px-2">
                  <span className="text-center">Minimal<br />(6)</span>
                  <span className="text-center">Balanced<br />(12)</span>
                  <span className="text-center">Rich<br />(20)</span>
                  <span className="text-center">Extended<br />(35)</span>
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
                      max={35}
                      step={1}
                      className="w-full"
                    />
                     <div className="flex justify-between text-xs text-muted-foreground px-2">
                       <span className="text-center">Minimal<br />(6)</span>
                       <span className="text-center">Balanced<br />(12)</span>
                       <span className="text-center">Rich<br />(20)</span>
                       <span className="text-center">Extended<br />(35)</span>
                     </div>
                  </div>
                </div>

                <ScrollArea className="h-72 w-full rounded-md border">
                  <div className="p-4 space-y-3">
                    {Object.entries(presetGroups).map(([group, presets]) => (
                      <div key={group} className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">{group}</h4>
                        {presets.map((preset) => (
                          <div
                            key={preset.name}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedPresets.includes(preset)
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => handlePresetToggle(preset)}
                          >
                            <div className="flex gap-1 flex-shrink-0 mt-0.5">
                              {preset.colors.slice(0, 4).map((color, index) => (
                                <div
                                  key={index}
                                  className="w-4 h-4 rounded border border-border"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{preset.name}</p>
                              {preset.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {preset.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

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
                        // eslint-disable-next-line @next/next/no-img-element
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

            {/* Saved Palettes Tab */}
            <TabsContent value="saved" className="space-y-4">
              <div className="space-y-4">
                {savedPalettes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No saved palettes yet</p>
                    <p className="text-sm">Generate and save palettes to see them here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-72 w-full rounded-md border">
                    <div className="p-4 space-y-3">
                      {savedPalettes.map((palette) => (
                        <div
                          key={palette.id}
                          className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:border-primary/50 group"
                          onClick={() => onLoadPalette(palette)}
                        >
                          <div className="flex gap-1 flex-shrink-0 mt-0.5">
                            {palette.preview.slice(0, 4).map((color, index) => (
                              <div
                                key={index}
                                className="w-4 h-4 rounded border border-border"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{palette.name}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {new Date(palette.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePalette(palette.id);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
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

      {/* Quick Harmony Panel */}
      <QuickHarmonyPanel
        palette={palette}
        onGenerateWithHarmony={onGenerate}
        isGenerating={isGenerating}
      />

      {/* Screenshot Analysis Modal */}
      <ScreenshotAnalysisModal
        open={analysisModalOpen}
        onOpenChange={setAnalysisModalOpen}
        questions={analysisQuestions}
        imagePreview={screenshotPreview || ''}
        isAnalyzing={isAnalyzing}
        onAnalyze={handleAnalyzeRetry}
        onGenerate={handleAnalysisComplete}
        isGenerating={isGenerating}
        error={analysisError || undefined}
      />
    </div>
  );
}
