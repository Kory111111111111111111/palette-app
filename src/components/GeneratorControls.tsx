'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Image, Palette, Loader2, Upload, FileText, Settings } from 'lucide-react';
import { PresetPalette, PRESET_PALETTES, GenerationContext, AnalysisQuestion, SavedPalette } from '@/types';
import { ScreenshotAnalysisModal } from '@/components/ScreenshotAnalysisModal';
import { ScreenshotPreview } from '@/components/OptimizedImage';
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
  
  // Algorithmic generation state
  const [algorithmicHarmony, setAlgorithmicHarmony] = useState<'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary' | 'monochromatic'>('complementary');
  const [algorithmicBaseColor, setAlgorithmicBaseColor] = useState('');
  const [algorithmicTemperature, setAlgorithmicTemperature] = useState<'warm' | 'cool' | 'neutral' | undefined>(undefined);
  const [algorithmicSaturation, setAlgorithmicSaturation] = useState<'vibrant' | 'moderate' | 'muted' | 'neutral'>('moderate');
  const [algorithmicSeed, setAlgorithmicSeed] = useState<number>(Date.now());
  const [useBaseColor, setUseBaseColor] = useState(false);
  const [useTemperature, setUseTemperature] = useState(false);
  const [useSeed, setUseSeed] = useState(false);
  
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

  const handleGenerateAlgorithmic = async () => {
    incrementCounter('generationsCount');
    
    await onGenerate({
      type: 'algorithmic',
      algorithmic: {
        harmonyType: algorithmicHarmony,
        baseColor: useBaseColor && algorithmicBaseColor ? algorithmicBaseColor : undefined,
        temperature: useTemperature ? algorithmicTemperature : undefined,
        saturationLevel: algorithmicSaturation,
        seed: useSeed ? algorithmicSeed : undefined
      },
      colorCount: colorCount
    });
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
      {/* Unified Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Palette Generator
          </CardTitle>
          <CardDescription>
            Create palettes using quick templates or advanced options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Generate Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Quick Start</h3>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => handleQuickGenerate('brand')}
                  disabled={isGenerating}
                  className="h-auto p-4 flex items-center gap-3 justify-start text-left"
                  variant="outline"
                >
                  <Palette className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Brand Colors</div>
                    <div className="text-xs text-muted-foreground">Primary, secondary & accent colors</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleQuickGenerate('ui')}
                  disabled={isGenerating}
                  className="h-auto p-4 flex items-center gap-3 justify-start text-left"
                  variant="outline"
                >
                  <Image className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Complete UI System</div>
                    <div className="text-xs text-muted-foreground">Full design system with all color roles</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleQuickGenerate('web')}
                  disabled={isGenerating}
                  className="h-auto p-4 flex items-center gap-3 justify-start text-left"
                  variant="outline"
                >
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Web Application</div>
                    <div className="text-xs text-muted-foreground">Modern web app color palette</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced Generation
              </h3>
              <Tabs defaultValue="prompt" className="w-full">
                <TabsList className="grid w-full grid-cols-5 gap-1">
                  <TabsTrigger value="prompt" className="text-xs">Prompt</TabsTrigger>
                  <TabsTrigger value="preset" className="text-xs">Presets</TabsTrigger>
                  <TabsTrigger value="algorithmic" className="text-xs">Algorithm</TabsTrigger>
                  <TabsTrigger value="screenshot" className="text-xs">Screenshot</TabsTrigger>
                  <TabsTrigger value="saved" className="text-xs">Saved</TabsTrigger>
                </TabsList>

                {/* Prompt Tab */}
                <TabsContent value="prompt" className="space-y-4 mt-4">
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
                <TabsContent value="preset" className="space-y-4 mt-4">
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

                    <ScrollArea className="h-64 w-full rounded-md border">
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

                {/* Algorithmic Tab */}
                <TabsContent value="algorithmic" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Harmony Type</Label>
                      <RadioGroup value={algorithmicHarmony} onValueChange={(value: any) => setAlgorithmicHarmony(value)}>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary/50 transition-colors">
                            <RadioGroupItem value="complementary" id="harmony-complementary" />
                            <Label htmlFor="harmony-complementary" className="flex-1 cursor-pointer">
                              Complementary
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary/50 transition-colors">
                            <RadioGroupItem value="analogous" id="harmony-analogous" />
                            <Label htmlFor="harmony-analogous" className="flex-1 cursor-pointer">
                              Analogous
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary/50 transition-colors">
                            <RadioGroupItem value="triadic" id="harmony-triadic" />
                            <Label htmlFor="harmony-triadic" className="flex-1 cursor-pointer">
                              Triadic
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary/50 transition-colors">
                            <RadioGroupItem value="tetradic" id="harmony-tetradic" />
                            <Label htmlFor="harmony-tetradic" className="flex-1 cursor-pointer">
                              Tetradic
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary/50 transition-colors">
                            <RadioGroupItem value="splitComplementary" id="harmony-split" />
                            <Label htmlFor="harmony-split" className="flex-1 cursor-pointer">
                              Split Comp.
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary/50 transition-colors">
                            <RadioGroupItem value="monochromatic" id="harmony-mono" />
                            <Label htmlFor="harmony-mono" className="flex-1 cursor-pointer">
                              Monochromatic
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="use-base-color"
                          checked={useBaseColor}
                          onCheckedChange={setUseBaseColor}
                        />
                        <Label htmlFor="use-base-color">Use Base Color</Label>
                      </div>
                      {useBaseColor && (
                        <div className="space-y-2 pl-6">
                          <Label htmlFor="base-color">Base Color</Label>
                          <Input
                            id="base-color"
                            type="color"
                            value={algorithmicBaseColor}
                            onChange={(e) => setAlgorithmicBaseColor(e.target.value)}
                            className="h-10 w-full"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="use-temperature"
                          checked={useTemperature}
                          onCheckedChange={setUseTemperature}
                        />
                        <Label htmlFor="use-temperature">Set Temperature</Label>
                      </div>
                      {useTemperature && (
                        <div className="space-y-2 pl-6">
                          <RadioGroup value={algorithmicTemperature || ''} onValueChange={(value: any) => setAlgorithmicTemperature(value)}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="warm" id="temp-warm" />
                              <Label htmlFor="temp-warm">Warm</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="cool" id="temp-cool" />
                              <Label htmlFor="temp-cool">Cool</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="neutral" id="temp-neutral" />
                              <Label htmlFor="temp-neutral">Neutral</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Saturation Level</Label>
                      <RadioGroup value={algorithmicSaturation} onValueChange={(value: any) => setAlgorithmicSaturation(value)}>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="vibrant" id="sat-vibrant" />
                            <Label htmlFor="sat-vibrant">Vibrant</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="moderate" id="sat-moderate" />
                            <Label htmlFor="sat-moderate">Moderate</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="muted" id="sat-muted" />
                            <Label htmlFor="sat-muted">Muted</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="neutral" id="sat-neutral" />
                            <Label htmlFor="sat-neutral">Neutral</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="use-seed"
                          checked={useSeed}
                          onCheckedChange={setUseSeed}
                        />
                        <Label htmlFor="use-seed">Use Seed (Reproducible)</Label>
                      </div>
                      {useSeed && (
                        <div className="space-y-2 pl-6">
                          <Label htmlFor="seed">Seed Number</Label>
                          <div className="flex gap-2">
                            <Input
                              id="seed"
                              type="number"
                              value={algorithmicSeed}
                              onChange={(e) => setAlgorithmicSeed(parseInt(e.target.value) || 0)}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={() => setAlgorithmicSeed(Date.now())}
                              size="sm"
                            >
                              Random
                            </Button>
                          </div>
                        </div>
                      )}
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
                      onClick={handleGenerateAlgorithmic} 
                      disabled={isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Generate Algorithmically
                    </Button>
                  </div>
                </TabsContent>

                {/* Screenshot Tab */}
                <TabsContent value="screenshot" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="screenshot">Upload UI Screenshot</Label>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="screenshot"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          {screenshotPreview ? (
                            <ScreenshotPreview
                              src={screenshotPreview}
                              alt="Screenshot preview"
                              className="w-full h-full"
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
                <TabsContent value="saved" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {savedPalettes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No saved palettes yet</p>
                        <p className="text-sm">Generate and save palettes to see them here</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-64 w-full rounded-md border">
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
            </div>
          </div>
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
