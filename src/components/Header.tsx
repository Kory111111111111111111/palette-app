'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings, Palette, Download, Save, Loader2, ArrowLeftRight } from 'lucide-react';
import { SavedPalette } from '@/types';
import { AuroraText } from '@/components/magicui/aurora-text';

interface HeaderProps {
  savedPalettes: SavedPalette[];
  onLoadPalette: (palette: SavedPalette) => void;
  onDeletePalette: (id: string) => void;
  onSavePalette: () => void;
  onExportPalette: () => void;
  onOpenSettings: () => void;
  onStartComparison: () => void;
  isGenerating: boolean;
  canSave: boolean;
}

export function Header({
  savedPalettes,
  onLoadPalette,
  onDeletePalette,
  onSavePalette,
  onExportPalette,
  onOpenSettings,
  onStartComparison,
  isGenerating,
  canSave
}: HeaderProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSavePalette();
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-8xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            <AuroraText 
              className="text-xl font-semibold"
              colors={["#FF0080", "#7928CA", "#0070F3", "#38bdf8", "#FF6B6B", "#4ECDC4"]}
              speed={0.8}
            >
              Palette Generator
            </AuroraText>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Saved Palettes Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={savedPalettes.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                Load Palette
                {savedPalettes.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {savedPalettes.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {savedPalettes.length === 0 ? (
                <DropdownMenuItem disabled>
                  No saved palettes
                </DropdownMenuItem>
              ) : (
                savedPalettes.map((palette) => (
                  <div key={palette.id} className="relative group">
                    <DropdownMenuItem
                      onClick={() => onLoadPalette(palette)}
                      className="flex items-center gap-3 p-3"
                    >
                      <div className="flex gap-1">
                        {palette.preview.slice(0, 4).map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{palette.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(palette.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </DropdownMenuItem>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePalette(palette.id);
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExportPalette()}>
                Export Palette
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Comparison Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onStartComparison}
            disabled={savedPalettes.length === 0}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Compare
          </Button>

          {/* Save Button */}
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!canSave || saving || isGenerating}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
