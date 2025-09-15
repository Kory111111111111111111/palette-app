'use client';

import { useTheme } from '@/components/ThemeProvider';
import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars';

interface DynamicBackgroundProps {
  children: React.ReactNode;
}

export function DynamicBackground({ children }: DynamicBackgroundProps) {
  const { settings } = useTheme();

  // Check for prefers-reduced-motion and disable animations if set
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const animationsEnabled = settings.accessibility?.animationsEnabled ?? true;
  const shouldAnimate = animationsEnabled && !prefersReducedMotion && !settings.accessibility?.prefersReducedMotion;

  return (
    <>
      <StarsBackground
        className="fixed inset-0 -z-10"
        starColor="#ffffff"
        speed={shouldAnimate ? 30 : 0}
        factor={shouldAnimate ? 0.02 : 0}
      />
      <div className="relative z-10">
        {children}
      </div>
    </>
  );
}
