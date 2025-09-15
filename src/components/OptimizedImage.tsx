'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/LoadingSkeleton';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className,
  loading = 'lazy',
  decoding = 'async',
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <Skeleton className="absolute inset-0" />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// Specialized component for screenshot previews
interface ScreenshotPreviewProps {
  src: string;
  alt?: string;
  className?: string;
  onReplace?: () => void;
}

export function ScreenshotPreview({ 
  src, 
  alt = "Screenshot preview", 
  className,
  onReplace 
}: ScreenshotPreviewProps) {
  return (
    <div className={cn("relative group", className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-lg"
        loading="lazy"
        decoding="async"
      />
      {onReplace && (
        <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
            Click to replace
          </span>
        </div>
      )}
    </div>
  );
}
