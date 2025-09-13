import { hexToRgb, rgbToHex } from './color';

export type ColorHarmonyType = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary';

export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export function hexToHsl(hex: string): HSLColor | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  const { r, g, b } = rgb;
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / diff + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / diff + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function hslToHex(hsl: HSLColor): string {
  const { h, s, l } = hsl;
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (sNorm === 0) {
    r = g = b = lNorm; // achromatic
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }
  
  return rgbToHex(
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  );
}

export function generateHarmonyColors(baseHex: string, type: ColorHarmonyType): string[] {
  const baseHsl = hexToHsl(baseHex);
  if (!baseHsl) return [];
  
  const { h, s, l } = baseHsl;
  const colors: string[] = [baseHex];
  
  switch (type) {
    case 'complementary':
      // 180 degrees opposite
      colors.push(hslToHex({ h: (h + 180) % 360, s, l }));
      break;
      
    case 'analogous':
      // 30 degrees on each side
      colors.push(hslToHex({ h: (h + 30) % 360, s, l }));
      colors.push(hslToHex({ h: (h - 30 + 360) % 360, s, l }));
      break;
      
    case 'triadic':
      // 120 degrees apart
      colors.push(hslToHex({ h: (h + 120) % 360, s, l }));
      colors.push(hslToHex({ h: (h + 240) % 360, s, l }));
      break;
      
    case 'tetradic':
      // 90 degrees apart (rectangle)
      colors.push(hslToHex({ h: (h + 90) % 360, s, l }));
      colors.push(hslToHex({ h: (h + 180) % 360, s, l }));
      colors.push(hslToHex({ h: (h + 270) % 360, s, l }));
      break;
      
    case 'splitComplementary':
      // 150 and 210 degrees (adjacent to complement)
      colors.push(hslToHex({ h: (h + 150) % 360, s, l }));
      colors.push(hslToHex({ h: (h + 210) % 360, s, l }));
      break;
  }
  
  return colors.filter(color => color !== baseHex);
}

export function getColorHarmonyType(colors: string[]): ColorHarmonyType | null {
  if (colors.length < 2) return null;
  
  const baseHsl = hexToHsl(colors[0]);
  if (!baseHsl) return null;
  
  const { h: baseH } = baseHsl;
  const angles = colors.slice(1).map(color => {
    const hsl = hexToHsl(color);
    return hsl ? hsl.h : null;
  }).filter((h): h is number => h !== null);
  
  if (angles.length === 0) return null;
  
  // Check for complementary (180°)
  if (angles.some(h => Math.abs((h - baseH + 180) % 360) < 15)) {
    return 'complementary';
  }
  
  // Check for triadic (120°)
  if (angles.some(h => Math.abs((h - baseH + 120) % 360) < 15) &&
      angles.some(h => Math.abs((h - baseH + 240) % 360) < 15)) {
    return 'triadic';
  }
  
  // Check for analogous (30°)
  if (angles.every(h => {
    const diff = Math.abs((h - baseH + 360) % 360);
    return diff < 45 && diff > 15;
  })) {
    return 'analogous';
  }
  
  // Check for tetradic (90°)
  if (angles.length >= 3 && angles.every(h => {
    const diff = Math.abs((h - baseH + 360) % 360);
    return diff % 90 < 15;
  })) {
    return 'tetradic';
  }
  
  // Check for split complementary (150°, 210°)
  if (angles.some(h => Math.abs((h - baseH + 150) % 360) < 15) &&
      angles.some(h => Math.abs((h - baseH + 210) % 360) < 15)) {
    return 'splitComplementary';
  }
  
  return null;
}

export function adjustColorLightness(hex: string, adjustment: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  
  const newLightness = Math.max(0, Math.min(100, hsl.l + adjustment));
  return hslToHex({ ...hsl, l: newLightness });
}

export function adjustColorSaturation(hex: string, adjustment: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  
  const newSaturation = Math.max(0, Math.min(100, hsl.s + adjustment));
  return hslToHex({ ...hsl, s: newSaturation });
}

export function generateShades(hex: string, count: number = 5): string[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [];
  
  const shades: string[] = [];
  const step = 100 / (count - 1);
  
  for (let i = 0; i < count; i++) {
    const lightness = i * step;
    shades.push(hslToHex({ ...hsl, l: lightness }));
  }
  
  return shades;
}

export function generateTints(hex: string, count: number = 5): string[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [];
  
  const tints: string[] = [];
  const baseLightness = hsl.l;
  const step = (100 - baseLightness) / (count - 1);
  
  for (let i = 0; i < count; i++) {
    const lightness = baseLightness + (i * step);
    tints.push(hslToHex({ ...hsl, l: Math.min(100, lightness) }));
  }
  
  return tints;
}
