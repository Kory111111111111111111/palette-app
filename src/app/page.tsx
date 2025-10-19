'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { Header } from '@/components/Header';
import { GeneratorControls } from '@/components/GeneratorControls';
import { PaletteDisplay } from '@/components/PaletteDisplay';
import { SettingsPanel } from '@/components/SettingsPanel';
import { AnalysisModal } from '@/components/AnalysisModal';
// Lazy load non-critical components
const EnhancedColorHarmonySuggestions = lazy(() => 
  import('@/components/EnhancedColorHarmonySuggestions').then(module => ({
    default: module.EnhancedColorHarmonySuggestions
  }))
);
const ComparisonPaletteSelector = lazy(() => 
  import('@/components/ComparisonPaletteSelector').then(module => ({
    default: module.ComparisonPaletteSelector
  }))
);
const PaletteComparison = lazy(() => 
  import('@/components/PaletteComparison').then(module => ({
    default: module.PaletteComparison
  }))
);
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import { FileText, Code, Gamepad2, ArrowLeftRight, Sparkles } from 'lucide-react';
import { UIPalette, Color, SavedPalette, GenerationContext } from '@/types';
import { AIService } from '@/services/ai';
import { AlgorithmicPaletteGenerator } from '@/services/algorithmic';
import { StorageService } from '@/services/storage';
import { generateCSSVariables, generateSVG, generateFFHex, downloadFile } from '@/utils/color';
import { useTheme } from '@/components/ThemeProvider';
import { DynamicBackground } from '@/components/DynamicBackground';
import { ModalContainer } from '@/components/ModalContainer';
import { useModalQueue } from '@/contexts/ModalQueueContext';
import { useUserJourney } from '@/contexts/UserJourneyContext';
import { PaletteDisplaySkeleton, GeneratorControlsSkeleton, HarmonySuggestionsSkeleton } from '@/components/LoadingSkeleton';

export default function HomePage() {
  // Context hooks
  const { settings } = useTheme();
  const { openModal, closeModal } = useModalQueue();
  const { advanceStage, incrementCounter, recordAction, state: journeyState } = useUserJourney();
  const { currentStage } = journeyState;

  // State
  const [palette, setPalette] = useState<UIPalette>({
    brand: [],
    surface: [],
    text: [],
    feedback: [],
    extended: [],
    custom: []
  });
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [colorCount, setColorCount] = useState(12);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Modal state (simplified - just track data, not open/close state)
  const [saveName, setSaveName] = useState('');

  // Comparison mode
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPalette, setComparisonPalette] = useState<UIPalette | null>(null);

  // Harmony suggestions
  const [showHarmonySuggestions, setShowHarmonySuggestions] = useState(false);

  // Modal handlers using queue system
  const openSettingsModal = () => {
    const modalId = openModal('settings',
      <SettingsPanel
        open={true}
        onOpenChange={() => closeModal(modalId)}
      />
    );
  };

  const openAnalysisModal = () => {
    const modalId = openModal('analysis',
      <AnalysisModal
        open={true}
        onOpenChange={() => closeModal(modalId)}
        palette={palette}
        onAnalyze={handleAnalyzePalette}
        analysis={analysis}
        isAnalyzing={isAnalyzing}
      />
    );
  };

  const openSaveModal = () => {
    const modalId = openModal('save',
      <Dialog open={true} onOpenChange={() => closeModal(modalId)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Palette</DialogTitle>
            <DialogDescription>
              Give your palette a memorable name for easy identification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="palette-name">Palette Name</Label>
              <Input
                id="palette-name"
                placeholder="My Awesome Palette"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSavePalette();
                    closeModal(modalId);
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => closeModal(modalId)}>
                Cancel
              </Button>
              <Button onClick={() => { handleSavePalette(); closeModal(modalId); }} disabled={!saveName.trim()}>
                Save Palette
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const openExportModal = () => {
    const modalId = openModal('export',
      <Dialog open={true} onOpenChange={() => closeModal(modalId)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Palette</DialogTitle>
            <DialogDescription>
              Choose how you&apos;d like to export your color palette.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => { handleExport('svg'); closeModal(modalId); }}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">SVG Image</div>
                    <div className="text-sm text-muted-foreground">
                      Vector image with color swatches and hex codes
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => { handleExport('css'); closeModal(modalId); }}
              >
                <div className="flex items-center gap-3">
                  <Code className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">CSS Variables</div>
                    <div className="text-sm text-muted-foreground">
                      CSS custom properties for web development
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => { handleExport('ff_hex'); closeModal(modalId); }}
              >
                <div className="flex items-center gap-3">
                  <Gamepad2 className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">FF Hex Format</div>
                    <div className="text-sm text-muted-foreground">
                      Hexadecimal values for game development
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const openComparisonSelectorModal = () => {
    const modalId = openModal('comparison-selector',
      <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
        <ComparisonPaletteSelector
          open={true}
          onOpenChange={() => closeModal(modalId)}
          savedPalettes={savedPalettes}
          onSelectPalette={(palette) => {
            handleSelectComparisonPalette(palette);
            closeModal(modalId);
          }}
          currentPalette={palette}
        />
      </Suspense>
    );
  };

  // Initialize
  useEffect(() => {
    console.log('🏠 [HomePage] Initializing...');
    const loadedPalettes = StorageService.getSavedPalettes();
    const currentPalette = StorageService.getCurrentPalette();
    
    console.log('🏠 [HomePage] Loaded palettes:', loadedPalettes.length);
    setSavedPalettes(loadedPalettes);
    
    if (currentPalette) {
      console.log('🏠 [HomePage] Loading current palette');
      setPalette(currentPalette);
    }

    // Initialize AI service if API key is available
    console.log('🏠 [HomePage] API key available:', !!settings.apiSettings.geminiApiKey);
    console.log('🏠 [HomePage] API key length:', settings.apiSettings.geminiApiKey?.length || 0);
    
    if (settings.apiSettings.geminiApiKey) {
      console.log('🏠 [HomePage] Creating AI service...');
      try {
        const aiService = new AIService(settings.apiSettings.geminiApiKey);
        setAiService(aiService);
        console.log('🏠 [HomePage] AI service created successfully');
      } catch (error) {
        console.error('🏠 [HomePage] Failed to create AI service:', error);
      }
    } else {
      console.log('🏠 [HomePage] No API key available');
    }

    // Simulate initial loading time for better UX
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [settings.apiSettings.geminiApiKey]);


  // Save current palette to localStorage
  useEffect(() => {
    if (palette.brand.length > 0 || palette.surface.length > 0) {
      StorageService.saveCurrentPalette(palette);
    }
  }, [palette]);

  const handleGenerate = async (context: GenerationContext) => {
    // Track user journey - move to creating stage if not already there
    if (currentStage === 'exploring') {
      advanceStage();
    }

    // Increment generation counter
    incrementCounter('generationsCount');

    // Handle algorithmic generation (non-AI mode)
    if (context.type === 'algorithmic' && context.algorithmic) {
      setIsGenerating(true);
      try {
        // Get locked colors
        const lockedColors: Color[] = [];
        Object.values(palette).forEach((category) => {
          if (Array.isArray(category)) {
            lockedColors.push(...category.filter((c: Color) => c.locked));
          }
        });

        // Generate palette using algorithmic method
        const newPalette = AlgorithmicPaletteGenerator.generateUIPalette(
          context.algorithmic,
          lockedColors,
          context.colorCount || colorCount
        );
        
        setPalette(newPalette);
        return;
      } catch (error) {
        console.error('Algorithmic generation error:', error);
        alert('Failed to generate palette algorithmically. Please try again.');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Check for demo mode
    if (context.prompt?.startsWith('DEMO_MODE_')) {
      setIsGenerating(true);
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000));

        const demoType = context.prompt.replace('DEMO_MODE_', '') as 'brand' | 'ui' | 'web';
        const demoPalettes = {
          brand: {
            brand: [
              { hex: '#3B82F6', role: 'Primary', locked: false, isCustom: false },
              { hex: '#1E40AF', role: 'Secondary', locked: false, isCustom: false },
              { hex: '#F59E0B', role: 'Accent', locked: false, isCustom: false }
            ],
            surface: [
              { hex: '#FFFFFF', role: 'Background', locked: false, isCustom: false },
              { hex: '#F8FAFC', role: 'Surface', locked: false, isCustom: false }
            ],
            text: [
              { hex: '#1E293B', role: 'Text Primary', locked: false, isCustom: false },
              { hex: '#64748B', role: 'Text Secondary', locked: false, isCustom: false }
            ],
            feedback: [
              { hex: '#10B981', role: 'Success', locked: false, isCustom: false },
              { hex: '#EF4444', role: 'Error', locked: false, isCustom: false }
            ],
            extended: [],
            custom: []
          },
          ui: {
            brand: [
              { hex: '#6366F1', role: 'Primary', locked: false, isCustom: false },
              { hex: '#4F46E5', role: 'Secondary', locked: false, isCustom: false }
            ],
            surface: [
              { hex: '#FFFFFF', role: 'Background', locked: false, isCustom: false },
              { hex: '#F8FAFC', role: 'Surface', locked: false, isCustom: false },
              { hex: '#F1F5F9', role: 'Surface Variant', locked: false, isCustom: false }
            ],
            text: [
              { hex: '#0F172A', role: 'Text Primary', locked: false, isCustom: false },
              { hex: '#475569', role: 'Text Secondary', locked: false, isCustom: false },
              { hex: '#64748B', role: 'Text Tertiary', locked: false, isCustom: false },
              { hex: '#CBD5E1', role: 'Border', locked: false, isCustom: false }
            ],
            feedback: [
              { hex: '#10B981', role: 'Success', locked: false, isCustom: false },
              { hex: '#F59E0B', role: 'Warning', locked: false, isCustom: false },
              { hex: '#EF4444', role: 'Error', locked: false, isCustom: false },
              { hex: '#3B82F6', role: 'Info', locked: false, isCustom: false }
            ],
            extended: [],
            custom: []
          },
          web: {
            brand: [
              { hex: '#7C3AED', role: 'Primary', locked: false, isCustom: false },
              { hex: '#A855F7', role: 'Secondary', locked: false, isCustom: false }
            ],
            surface: [
              { hex: '#FFFFFF', role: 'Background', locked: false, isCustom: false },
              { hex: '#F3F4F6', role: 'Surface', locked: false, isCustom: false }
            ],
            text: [
              { hex: '#111827', role: 'Text Primary', locked: false, isCustom: false },
              { hex: '#6B7280', role: 'Text Secondary', locked: false, isCustom: false }
            ],
            feedback: [
              { hex: '#059669', role: 'Success', locked: false, isCustom: false },
              { hex: '#DC2626', role: 'Error', locked: false, isCustom: false }
            ],
            extended: [
              { hex: '#374151', role: 'Dark Surface', locked: false, isCustom: false },
              { hex: '#9CA3AF', role: 'Muted Text', locked: false, isCustom: false }
            ],
            custom: []
          }
        };

        setPalette(demoPalettes[demoType]);
        return;
      } finally {
        setIsGenerating(false);
      }
    }

    if (!aiService) {
      alert('Please configure your API key in settings first.');
      return;
    }

    setIsGenerating(true);
    try {
      const newPalette = await aiService.generateUIPalette(context);
      setPalette(newPalette);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate palette. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleColorChange = (category: keyof UIPalette, index: number, hex: string) => {
    setPalette(prev => ({
      ...prev,
      [category]: prev[category].map((color, i) => 
        i === index ? { ...color, hex } : color
      )
    }));
  };

  const handleLockToggle = (category: keyof UIPalette, index: number) => {
    setPalette(prev => ({
      ...prev,
      [category]: prev[category].map((color, i) => 
        i === index ? { ...color, locked: !color.locked } : color
      )
    }));
  };

  const handleRemoveColor = (category: keyof UIPalette, index: number) => {
    setPalette(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const handleAddCustomColor = (hex: string) => {
    const newColor: Color = {
      hex,
      role: 'Custom',
      locked: false,
      isCustom: true
    };
    
    setPalette(prev => ({
      ...prev,
      custom: [...prev.custom, newColor]
    }));
  };

  const handleSavePalette = async () => {
    if (!saveName.trim()) return;

    const savedPalette = StorageService.savePalette(palette, saveName.trim());
    setSavedPalettes(prev => [...prev, savedPalette]);
    incrementCounter('savedPalettesCount');
    setSaveName('');
  };

  const handleLoadPalette = (savedPalette: SavedPalette) => {
    setPalette(savedPalette.palette);
  };

  const handleDeletePalette = (id: string) => {
    StorageService.deletePalette(id);
    setSavedPalettes(prev => prev.filter(p => p.id !== id));
  };

  const handleAnalyzePalette = async (useCase?: string) => {
    if (!aiService) {
      alert('Please configure your API key in settings first.');
      return;
    }

    setAnalysis('');
    setIsAnalyzing(true);

    try {
      await aiService.analyzePalette(palette, useCase, (chunk) => {
        setAnalysis(prev => prev + chunk);
      });
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze palette. Please check your API key and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = (format: 'svg' | 'css' | 'ff_hex', includeLockedOnly: boolean = false) => {
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'svg':
        content = generateSVG(palette, includeLockedOnly);
        filename = 'palette.svg';
        mimeType = 'image/svg+xml';
        break;
      case 'css':
        content = generateCSSVariables(palette, includeLockedOnly);
        filename = 'palette.css';
        mimeType = 'text/css';
        break;
      case 'ff_hex':
        content = generateFFHex(palette, includeLockedOnly);
        filename = 'palette.txt';
        mimeType = 'text/plain';
        break;
    }

    downloadFile(content, filename, mimeType);
  };

  const handleStartComparison = () => {
    if (savedPalettes.length === 0) {
      alert('No saved palettes available for comparison. Please save a palette first.');
      return;
    }
    recordAction('usedComparisonMode');
    openComparisonSelectorModal();
  };

  const handleSelectComparisonPalette = (savedPalette: SavedPalette) => {
    setComparisonPalette(savedPalette.palette);
    setComparisonMode(true);
  };

  const handleCloseComparison = () => {
    setComparisonMode(false);
    setComparisonPalette(null);
  };

  const handleExportComparison = (format: 'svg' | 'css' | 'ff_hex') => {
    if (!comparisonPalette) return;
    
    // Export both palettes
    const primaryContent = format === 'svg' ? generateSVG(palette) : 
                          format === 'css' ? generateCSSVariables(palette) : 
                          generateFFHex(palette);
    const secondaryContent = format === 'svg' ? generateSVG(comparisonPalette) : 
                            format === 'css' ? generateCSSVariables(comparisonPalette) : 
                            generateFFHex(comparisonPalette);
    
    const combinedContent = `=== PRIMARY PALETTE ===\n${primaryContent}\n\n=== COMPARISON PALETTE ===\n${secondaryContent}`;
    
    const filename = `palette-comparison.${format === 'svg' ? 'svg' : format === 'css' ? 'css' : 'txt'}`;
    const mimeType = format === 'svg' ? 'image/svg+xml' : format === 'css' ? 'text/css' : 'text/plain';
    
    downloadFile(combinedContent, filename, mimeType);
  };

  const handleApplyHarmonySuggestion = (suggestion: UIPalette) => {
    setPalette(suggestion);
    setShowHarmonySuggestions(false);
  };

  const handleGenerateWithHarmony = async (context: GenerationContext) => {
    await handleGenerate(context);
  };

  const lockedColorsCount = Object.values(palette).reduce(
    (count, colors) => count + colors.filter((c: Color) => c.locked).length,
    0
  );

  const canSave = palette.brand.length > 0 || palette.surface.length > 0;

  return (
    <DynamicBackground>
      <div className="min-h-screen bg-background/10">
        <Header
          savedPalettes={savedPalettes}
          onLoadPalette={handleLoadPalette}
          onDeletePalette={handleDeletePalette}
          onSavePalette={openSaveModal}
          onExportPalette={openExportModal}
          onOpenSettings={openSettingsModal}
          onStartComparison={handleStartComparison}
          isGenerating={isGenerating}
          canSave={canSave}
          hasColors={palette.brand.length > 0 || palette.surface.length > 0}
        />

        <main className="w-full px-4 py-8">
          <div className="max-w-8xl mx-auto">
            {comparisonMode ? (
              /* Comparison Mode */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Header - Full Width on Mobile, Spans all columns on Desktop */}
                <div className="lg:col-span-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold">Palette Comparison</h1>
                      <Badge variant="secondary" className="text-xs">
                        Comparison Mode
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowHarmonySuggestions(!showHarmonySuggestions)}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {showHarmonySuggestions ? 'Hide' : 'Show'} Harmony
                        </span>
                        <span className="sm:hidden">
                          Harmony
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCloseComparison}
                      >
                        Exit Comparison
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Main Comparison Content */}
                <div className="lg:col-span-12">
                  <div className="space-y-6">
                    {comparisonPalette && (
                      <Suspense fallback={<HarmonySuggestionsSkeleton />}>
                        <PaletteComparison
                          primaryPalette={palette}
                          secondaryPalette={comparisonPalette}
                          onClose={handleCloseComparison}
                          onExportComparison={handleExportComparison}
                        />
                      </Suspense>
                    )}

                    {showHarmonySuggestions && (
                      <Suspense fallback={<HarmonySuggestionsSkeleton />}>
                        <EnhancedColorHarmonySuggestions
                          palette={palette}
                          onApplySuggestion={handleApplyHarmonySuggestion}
                          onGenerateWithHarmony={handleGenerateWithHarmony}
                          isGenerating={isGenerating}
                        />
                      </Suspense>
                    )}
                  </div>
                </div>
              </div>
            ) : isInitialLoading ? (
              /* Loading State */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Left Sidebar - Generator Controls Skeleton */}
                <div className="lg:col-span-5 xl:col-span-4 2xl:col-span-3">
                  <div className="sticky top-24">
                    <GeneratorControlsSkeleton />
                  </div>
                </div>

                {/* Main Content - Palette Display Skeleton */}
                <div className="lg:col-span-7 xl:col-span-8 2xl:col-span-9">
                  <div className="space-y-6">
                    <PaletteDisplaySkeleton />
                    <HarmonySuggestionsSkeleton />
                  </div>
                </div>
              </div>
            ) : (
              /* Normal Mode */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Left Sidebar - Generator Controls */}
                <div className="lg:col-span-5 xl:col-span-4 2xl:col-span-3">
                  <div className="sticky top-24">
                    <GeneratorControls
                      onGenerate={handleGenerate}
                      isGenerating={isGenerating}
                      lockedColorsCount={lockedColorsCount}
                      colorCount={colorCount}
                      onColorCountChange={setColorCount}
                      aiService={aiService}
                      savedPalettes={savedPalettes}
                      onLoadPalette={handleLoadPalette}
                      onDeletePalette={handleDeletePalette}
                      palette={palette}
                    />
                  </div>
                </div>

                {/* Main Content - Palette Display */}
                <div className="lg:col-span-7 xl:col-span-8 2xl:col-span-9">
                  <div className="space-y-6">
                    <PaletteDisplay
                      palette={palette}
                      onColorChange={handleColorChange}
                      onLockToggle={handleLockToggle}
                      onRemoveColor={handleRemoveColor}
                      onAddCustomColor={handleAddCustomColor}
                      onAnalyzePalette={openAnalysisModal}
                      isGenerating={isGenerating}
                    />

                    {/* Enhanced Harmony Suggestions - Moved below palette */}
                    <Suspense fallback={<HarmonySuggestionsSkeleton />}>
                      <EnhancedColorHarmonySuggestions
                        palette={palette}
                        onApplySuggestion={handleApplyHarmonySuggestion}
                        onGenerateWithHarmony={handleGenerateWithHarmony}
                        isGenerating={isGenerating}
                      />
                    </Suspense>

                    {/* Comparison Button */}
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={handleStartComparison}
                        className="flex items-center gap-2"
                        disabled={savedPalettes.length === 0}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                        Compare with Saved Palette
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Container - handles all modals through queue system */}
      <ModalContainer />

      <Toaster />
    </DynamicBackground>
  );
}