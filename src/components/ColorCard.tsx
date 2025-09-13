'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Lock, Unlock, Trash2, Check } from 'lucide-react';
import { Color } from '@/types';
import { isValidHex, normalizeHex, copyToClipboard, getTextColor } from '@/utils/color';
import { cn } from '@/lib/utils';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { useCallback, useEffect } from 'react';

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

  // Magic border animation
  const gradientSize = 200;
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);
  
  const reset = useCallback(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [gradientSize, mouseX, mouseY]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY],
  );

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    const handleGlobalPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        reset();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        reset();
      }
    };

    window.addEventListener("pointerout", handleGlobalPointerOut);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pointerout", handleGlobalPointerOut);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reset]);

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
          'color-card group relative aspect-square min-h-[120px] rounded-lg transition-all duration-200',
          color.locked && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          className
        )}
        onPointerMove={handlePointerMove}
        onPointerLeave={reset}
        onPointerEnter={reset}
      >
        {/* Animated border */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
            #9E7AFF, 
            #FE8BBB, 
            var(--border) 100%
            )
            `,
          }}
        />
        <div className="absolute inset-px rounded-lg" style={{ backgroundColor: color.hex }} />
        
        {/* Content */}
        <div className="relative h-full">
          {/* Color Actions Overlay */}
          <div className="color-card-actions">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopy}
                className="h-8 w-8 p-0"
                aria-label="Copy color"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
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
                onClick={onLockToggle}
                className="h-8 w-8 p-0"
                aria-label={color.locked ? 'Unlock color' : 'Lock color'}
              >
                {color.locked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
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
                  onClick={onRemove}
                  className="h-8 w-8 p-0"
                  aria-label="Remove color"
                >
                  <Trash2 className="h-4 w-4" />
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
                className="h-6 text-xs font-mono"
                autoFocus
              />
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" onClick={handleSave} className="h-6 px-2 text-xs">
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 px-2 text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="cursor-pointer"
              onClick={handleEdit}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
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
            </div>
          )}
        </div>

        {/* Lock Indicator */}
        {color.locked && (
          <div className="absolute top-2 right-2">
            <div className="rounded-full bg-primary p-1">
              <Lock className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
        )}
        </div>
      </div>
    </TooltipProvider>
  );
}
