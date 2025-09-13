'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, X } from 'lucide-react';
import { UIPalette } from '@/types';

interface AnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  palette: UIPalette;
  onAnalyze: (useCase?: string) => Promise<void>;
  analysis: string;
  isAnalyzing: boolean;
}

export function AnalysisModal({
  open,
  onOpenChange,
  palette,
  onAnalyze,
  analysis,
  isAnalyzing
}: AnalysisModalProps) {
  const [useCase, setUseCase] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysis && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [analysis]);

  const handleAnalyze = async () => {
    setIsStreaming(true);
    try {
      await onAnalyze(useCase.trim() || undefined);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClose = () => {
    if (!isAnalyzing) {
      onOpenChange(false);
    }
  };

  const paletteColors = [
    ...palette.brand,
    ...palette.surface,
    ...palette.text,
    ...palette.feedback,
    ...palette.extended,
    ...palette.custom
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Palette Analysis</span>
            {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <DialogDescription>
            Get AI-powered insights about your color palette
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Palette Preview */}
          <div className="space-y-2">
            <Label>Current Palette</Label>
            <div className="flex gap-1 flex-wrap">
              {paletteColors.slice(0, 12).map((color, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded border border-border"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.role}: ${color.hex}`}
                />
              ))}
              {paletteColors.length > 12 && (
                <div className="w-8 h-8 rounded border border-border flex items-center justify-center text-xs bg-muted">
                  +{paletteColors.length - 12}
                </div>
              )}
            </div>
          </div>

          {/* Use Case Input */}
          <div className="space-y-2">
            <Label htmlFor="use-case">Use Case (Optional)</Label>
            <Textarea
              id="use-case"
              placeholder="e.g., Mobile app for a fitness company, E-commerce website for luxury products, Dashboard for data visualization..."
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              rows={2}
            />
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="self-start"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Palette'}
          </Button>

          {/* Analysis Results */}
          {analysis && (
            <div className="flex-1 min-h-0">
              <div className="flex items-center justify-between mb-2">
                <Label>Analysis Results</Label>
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Streaming analysis...
                  </div>
                )}
              </div>
              <ScrollArea
                ref={scrollAreaRef}
                className="h-64 border rounded-lg p-4 bg-muted/30"
              >
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {analysis}
                    {isStreaming && (
                      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleClose}
              disabled={isAnalyzing}
              variant="outline"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
