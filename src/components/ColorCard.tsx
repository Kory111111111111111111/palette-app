'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Lock, Unlock, Trash2, Check } from 'lucide-react';
import { Color } from '@/types';
import { isValidHex, normalizeHex, copyToClipboard, getTextColor } from '@/utils/color';
import { cn } from '@/lib/utils';

interface ColorCardProps {
  color: Color;
  onColorChange: (hex: string) => void;
  onLockToggle: () => void;
  onRemove: () => void;
  showRemove?: boolean;
  className?: string;
}

export function ColorCard({
  color,
  onColorChange,
  onLockToggle,
  onRemove,
  showRemove = false,
  className
}: ColorCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(color.hex);
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);


  const handleCopy = async () => {
    try {
      await copyToClipboard(color.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(color.hex);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleEdit();
  };

  const handleSave = () => {
    const normalized = normalizeHex(editValue);
    if (isValidHex(normalized)) {
      onColorChange(normalized);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(color.hex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const textColor = getTextColor(color.hex);

  return (
    <TooltipProvider>
      <div
        className={cn(
          'relative aspect-square min-h-[120px] rounded-lg overflow-hidden transition-all duration-200 cursor-pointer',
          color.locked && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          showActions && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background',
          className
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onDoubleClick={handleDoubleClick}
      >
        {/* Color Background */}
        <div
          className="w-full h-full"
          style={{ backgroundColor: color.hex }}
        />

        {/* Action Buttons - Top Right */}
        <div
          className={cn(
            'absolute top-2 right-2 flex gap-1 transition-opacity duration-200',
            showActions ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 border-white/20"
                aria-label="Copy color"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? 'Copied!' : 'Copy hex code'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onLockToggle();
                }}
                className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 border-white/20"
                aria-label={color.locked ? 'Unlock color' : 'Lock color'}
              >
                {color.locked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {color.locked ? 'Unlock color' : 'Lock color'}
            </TooltipContent>
          </Tooltip>

          {showRemove && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="h-7 w-7 p-0 bg-red-600/80 hover:bg-red-600 border-red-400/20"
                  aria-label="Remove color"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove color</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Color Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className="h-6 text-xs font-mono bg-white/20 border-white/30 text-white placeholder:text-white/70"
                autoFocus
              />
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" onClick={handleSave} className="h-6 px-2 text-xs">
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 px-2 text-xs text-white hover:bg-white/20">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  handleEdit();
                }
              }}
              aria-label="Edit color hex code"
            >
              <p className="text-sm font-semibold truncate" style={{ color: textColor }}>
                {color.role}
              </p>
              <p className="text-xs font-mono opacity-80" style={{ color: textColor }}>
                {color.hex}
              </p>
              <p className="text-xs opacity-60 mt-1" style={{ color: textColor }}>
                Click to edit
              </p>
            </div>
          )}
        </div>

        {/* Lock Indicator - Only show when not hovering */}
        {color.locked && !showActions && (
          <div className="absolute top-2 right-2">
            <div className="rounded-full bg-primary p-1.5 shadow-lg">
              <Lock className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
