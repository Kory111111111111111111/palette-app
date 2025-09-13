'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface ColorPaletteHeaderProps {
  totalColors: number;
  lockedCount: number;
  onAnalyzePalette: () => void;
  isGenerating: boolean;
}

export function ColorPaletteHeader({
  totalColors,
  lockedCount,
  onAnalyzePalette,
  isGenerating
}: ColorPaletteHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Color Palette</CardTitle>
            <CardDescription>
              {totalColors} colors total
              {lockedCount > 0 && ` • ${lockedCount} locked`}
            </CardDescription>
          </div>
          <Button onClick={onAnalyzePalette} disabled={isGenerating}>
            <Sparkles className="h-4 w-4 mr-2" />
            Analyze Palette
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
