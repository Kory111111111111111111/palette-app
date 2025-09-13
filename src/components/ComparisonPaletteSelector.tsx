'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Palette } from 'lucide-react';
import { SavedPalette } from '@/types';
import { cn } from '@/lib/utils';

interface ComparisonPaletteSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedPalettes: SavedPalette[];
  onSelectPalette: (palette: SavedPalette) => void;
  currentPalette: any; // UIPalette
}

export function ComparisonPaletteSelector({
  open,
  onOpenChange,
  savedPalettes,
  onSelectPalette,
  currentPalette
}: ComparisonPaletteSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPalette, setSelectedPalette] = useState<SavedPalette | null>(null);

  const filteredPalettes = savedPalettes.filter(palette =>
    palette.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (palette: SavedPalette) => {
    setSelectedPalette(palette);
  };

  const handleConfirm = () => {
    if (selectedPalette) {
      onSelectPalette(selectedPalette);
      onOpenChange(false);
      setSelectedPalette(null);
      setSearchTerm('');
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedPalette(null);
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Select Palette for Comparison
          </DialogTitle>
          <DialogDescription>
            Choose a saved palette to compare with your current palette
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Palettes</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Current Palette Preview */}
          <div className="space-y-2">
            <Label>Current Palette</Label>
            <Card className="border-primary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {Object.values(currentPalette)
                      .flat()
                      .slice(0, 6)
                      .map((color: any, index: number) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                  </div>
                  <div>
                    <p className="font-medium">Current Palette</p>
                    <p className="text-sm text-muted-foreground">
                      {Object.values(currentPalette).flat().length} colors
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Saved Palettes */}
          <div className="space-y-2">
            <Label>Saved Palettes</Label>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {filteredPalettes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No palettes found matching your search' : 'No saved palettes available'}
                  </div>
                ) : (
                  filteredPalettes.map((palette) => (
                    <Card
                      key={palette.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/50",
                        selectedPalette?.id === palette.id && "ring-2 ring-primary"
                      )}
                      onClick={() => handleSelect(palette)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {palette.preview.slice(0, 6).map((color, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded border border-border"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{palette.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(palette.createdAt).toLocaleDateString()} • {palette.preview.length} colors
                            </p>
                          </div>
                          {selectedPalette?.id === palette.id && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedPalette}
            >
              Compare Palettes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
