'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { GeneratorControls } from '@/components/GeneratorControls';
import { PaletteDisplay } from '@/components/PaletteDisplay';
import { SettingsPanel } from '@/components/SettingsPanel';
import { AnalysisModal } from '@/components/AnalysisModal';
import { PaletteComparison } from '@/components/PaletteComparison';
import { EnhancedColorHarmonySuggestions } from '@/components/EnhancedColorHarmonySuggestions';
import { ComparisonPaletteSelector } from '@/components/ComparisonPaletteSelector';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { FileText, Code, Gamepad2, ArrowLeftRight, Sparkles } from 'lucide-react';
import { UIPalette, Color, SavedPalette, GenerationContext } from '@/types';
import { AIService } from '@/services/ai';
import { StorageService } from '@/services/storage';
import { generateCSSVariables, generateSVG, generateFFHex, downloadFile } from '@/utils/color';
import { useTheme } from '@/components/ThemeProvider';
import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars';

export default function HomePage() {
  // Theme context
  const { settings } = useTheme();
  
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
  
  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // Comparison mode
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPalette, setComparisonPalette] = useState<UIPalette | null>(null);
  const [comparisonSelectorOpen, setComparisonSelectorOpen] = useState(false);
  
  // Harmony suggestions
  const [showHarmonySuggestions, setShowHarmonySuggestions] = useState(false);

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
  }, [settings.apiSettings.geminiApiKey]);


  // Save current palette to localStorage
  useEffect(() => {
    if (palette.brand.length > 0 || palette.surface.length > 0) {
      StorageService.saveCurrentPalette(palette);
    }
  }, [palette]);

  const handleGenerate = async (context: GenerationContext) => {
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
    setSaveModalOpen(false);
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
    setAnalysisOpen(true);
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
    setExportModalOpen(false);
  };

  const handleStartComparison = () => {
    if (savedPalettes.length === 0) {
      alert('No saved palettes available for comparison. Please save a palette first.');
      return;
    }
    setComparisonSelectorOpen(true);
  };

  const handleSelectComparisonPalette = (savedPalette: SavedPalette) => {
    setComparisonPalette(savedPalette.palette);
    setComparisonMode(true);
    setComparisonSelectorOpen(false);
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
    <StarsBackground 
      className="min-h-screen bg-black"
      starColor="#ffffff"
      speed={30}
      factor={0.02}
    >
      <div className="relative z-10 min-h-screen bg-background/10">
        <Header
          savedPalettes={savedPalettes}
          onLoadPalette={handleLoadPalette}
          onDeletePalette={handleDeletePalette}
          onSavePalette={() => setSaveModalOpen(true)}
          onExportPalette={() => setExportModalOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onStartComparison={handleStartComparison}
          isGenerating={isGenerating}
          canSave={canSave}
        />

        <main className="w-full px-4 py-8">
          <div className="max-w-8xl mx-auto">
            {comparisonMode ? (
              /* Comparison Mode */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">Palette Comparison</h1>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowHarmonySuggestions(!showHarmonySuggestions)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {showHarmonySuggestions ? 'Hide' : 'Show'} Harmony
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCloseComparison}
                    >
                      Exit Comparison
                    </Button>
                  </div>
                </div>
                
                {comparisonPalette && (
                  <PaletteComparison
                    primaryPalette={palette}
                    secondaryPalette={comparisonPalette}
                    onClose={handleCloseComparison}
                    onExportComparison={handleExportComparison}
                  />
                )}
                
                {showHarmonySuggestions && (
                  <EnhancedColorHarmonySuggestions
                    palette={palette}
                    onApplySuggestion={handleApplyHarmonySuggestion}
                    onGenerateWithHarmony={handleGenerateWithHarmony}
                    isGenerating={isGenerating}
                  />
                )}
              </div>
            ) : (
              /* Normal Mode */
              <div className="grid grid-cols-1 xl:grid-cols-5 responsive-stack gap-8">
                {/* Left Sidebar - Generator Controls */}
                <div className="xl:col-span-2">
                  <div className="sticky top-24 space-y-6">
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
                    
                    {/* Enhanced Harmony Suggestions */}
                    <EnhancedColorHarmonySuggestions
                      palette={palette}
                      onApplySuggestion={handleApplyHarmonySuggestion}
                      onGenerateWithHarmony={handleGenerateWithHarmony}
                      isGenerating={isGenerating}
                    />
                  </div>
                </div>

                {/* Main Content - Palette Display */}
                <div className="xl:col-span-3">
                  <div className="space-y-6">
                    <PaletteDisplay
                      palette={palette}
                      onColorChange={handleColorChange}
                      onLockToggle={handleLockToggle}
                      onRemoveColor={handleRemoveColor}
                      onAddCustomColor={handleAddCustomColor}
                      onAnalyzePalette={() => setAnalysisOpen(true)}
                      isGenerating={isGenerating}
                    />
                    
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

      {/* Settings Modal */}
      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      {/* Analysis Modal */}
      <AnalysisModal
        open={analysisOpen}
        onOpenChange={setAnalysisOpen}
        palette={palette}
        onAnalyze={handleAnalyzePalette}
        analysis={analysis}
        isAnalyzing={isAnalyzing}
      />

      {/* Save Modal */}
      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
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
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePalette} disabled={!saveName.trim()}>
                Save Palette
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
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
                onClick={() => handleExport('svg')}
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
                onClick={() => handleExport('css')}
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
                onClick={() => handleExport('ff_hex')}
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

      {/* Comparison Palette Selector */}
      <ComparisonPaletteSelector
        open={comparisonSelectorOpen}
        onOpenChange={setComparisonSelectorOpen}
        savedPalettes={savedPalettes}
        onSelectPalette={handleSelectComparisonPalette}
        currentPalette={palette}
      />

      <Toaster />
    </StarsBackground>
  );
}