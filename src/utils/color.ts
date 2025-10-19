export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function normalizeHex(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert 3-digit to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Add # prefix
  return '#' + hex.toUpperCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHex(hex)) return null;
  
  const normalized = normalizeHex(hex);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("").toUpperCase();
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const luminance1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const luminance2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function meetsWCAGAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 4.5; // WCAG AA normal text
}

export function meetsWCAGAAALarge(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 3; // WCAG AA large text / UI components
}

export function generateCSSVariables(palette: any, includeLockedOnly: boolean = false): string {
  const variables: string[] = [];
  
  Object.entries(palette).forEach(([category, colors]) => {
    if (Array.isArray(colors)) {
      colors.forEach((color) => {
        if (!includeLockedOnly || color.locked) {
          const varName = `--color-${category}-${color.role}`.replace(/([A-Z])/g, '-$1').toLowerCase();
          variables.push(`  ${varName}: ${color.hex};`);
        }
      });
    }
  });
  
  return `:root {\n${variables.join('\n')}\n}`;
}

export function generateFFHex(palette: any, includeLockedOnly: boolean = false): string {
  const colors: string[] = [];
  
  Object.entries(palette).forEach(([, colorList]) => {
    if (Array.isArray(colorList)) {
      colorList.forEach((color) => {
        if (!includeLockedOnly || color.locked) {
          const rgb = hexToRgb(color.hex);
          if (rgb) {
            colors.push(`0x${color.hex.slice(1)}`);
          }
        }
      });
    }
  });
  
  return colors.join(', ');
}

export function generateSVG(palette: any, includeLockedOnly: boolean = false): string {
  const colors: Array<{hex: string, role: string}> = [];
  
  Object.entries(palette).forEach(([, colorList]) => {
    if (Array.isArray(colorList)) {
      colorList.forEach((color) => {
        if (!includeLockedOnly || color.locked) {
          colors.push({ hex: color.hex, role: color.role });
        }
      });
    }
  });
  
  const width = Math.min(colors.length * 120, 1200);
  const height = 120;
  const cardWidth = width / colors.length;
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${width}" height="${height}" fill="#1a1a1a"/>`;
  
  colors.forEach((color, index) => {
    const x = index * cardWidth;
    svg += `<rect x="${x}" y="0" width="${cardWidth}" height="${height * 0.7}" fill="${color.hex}"/>`;
    svg += `<text x="${x + cardWidth/2}" y="${height * 0.8}" text-anchor="middle" fill="#ffffff" font-family="Inter, sans-serif" font-size="10">${color.hex}</text>`;
    svg += `<text x="${x + cardWidth/2}" y="${height * 0.9}" text-anchor="middle" fill="#cccccc" font-family="Inter, sans-serif" font-size="8">${color.role}</text>`;
  });
  
  svg += '</svg>';
  return svg;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((resolve, reject) => {
      if (document.execCommand('copy')) {
        resolve();
      } else {
        reject(new Error('Failed to copy to clipboard'));
      }
      document.body.removeChild(textArea);
    });
  }
}

export function getTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Color theory constants
export const COLOR_TEMPERATURE = {
  WARM: { min: 0, max: 60 }, // Red to Yellow
  COOL: { min: 180, max: 300 }, // Cyan to Magenta
  NEUTRAL: { min: 60, max: 180 } // Yellow-Green to Cyan
} as const;

export const PROFESSIONAL_SATURATION_RANGES = {
  VIBRANT: { min: 70, max: 100 },
  MODERATE: { min: 40, max: 70 },
  MUTED: { min: 20, max: 40 },
  NEUTRAL: { min: 0, max: 20 }
} as const;

export const PROFESSIONAL_LIGHTNESS_RANGES = {
  DARK: { min: 0, max: 30 },
  MEDIUM_DARK: { min: 30, max: 50 },
  MEDIUM: { min: 50, max: 70 },
  LIGHT: { min: 70, max: 90 },
  VERY_LIGHT: { min: 90, max: 100 }
} as const;

export type ColorTemperature = 'warm' | 'cool' | 'neutral';
export type SaturationLevel = 'vibrant' | 'moderate' | 'muted' | 'neutral';
export type LightnessLevel = 'dark' | 'medium_dark' | 'medium' | 'light' | 'very_light';

export function getColorTemperature(hue: number): ColorTemperature {
  if (hue >= COLOR_TEMPERATURE.WARM.min && hue <= COLOR_TEMPERATURE.WARM.max) {
    return 'warm';
  } else if (hue >= COLOR_TEMPERATURE.COOL.min && hue <= COLOR_TEMPERATURE.COOL.max) {
    return 'cool';
  }
  return 'neutral';
}

export function generateProfessionalPalette(
  baseHue?: number,
  temperature?: ColorTemperature,
  saturationLevel: SaturationLevel = 'moderate',
  lightnessLevel: LightnessLevel = 'medium'
): string[] {
  const colors: string[] = [];
  
  // Determine base hue based on temperature preference
  let hue: number;
  if (baseHue !== undefined) {
    hue = baseHue;
  } else if (temperature) {
    const tempRange = COLOR_TEMPERATURE[temperature.toUpperCase() as keyof typeof COLOR_TEMPERATURE];
    hue = tempRange.min + Math.random() * (tempRange.max - tempRange.min);
  } else {
    hue = Math.floor(Math.random() * 360);
  }
  
  const satRange = PROFESSIONAL_SATURATION_RANGES[saturationLevel.toUpperCase() as keyof typeof PROFESSIONAL_SATURATION_RANGES];
  const lightRange = PROFESSIONAL_LIGHTNESS_RANGES[lightnessLevel.toUpperCase() as keyof typeof PROFESSIONAL_LIGHTNESS_RANGES];
  
  // Generate base color with professional parameters
  const baseSaturation = satRange.min + Math.random() * (satRange.max - satRange.min);
  const baseLightness = lightRange.min + Math.random() * (lightRange.max - lightRange.min);
  
  const baseColor = hslToHex(hue, baseSaturation, baseLightness);
  colors.push(baseColor);
  
  // Generate harmonious variations using color theory principles
  const harmonyTypes: Array<'complementary' | 'analogous' | 'triadic'> = ['complementary', 'analogous', 'triadic'];
  const selectedHarmony = harmonyTypes[Math.floor(Math.random() * harmonyTypes.length)];
  
  switch (selectedHarmony) {
    case 'complementary':
      // Add complementary color (180° opposite)
      const compHue = (hue + 180) % 360;
      colors.push(hslToHex(compHue, baseSaturation * 0.8, baseLightness));
      // Add analogous colors for the base
      colors.push(hslToHex((hue + 30) % 360, baseSaturation * 0.6, baseLightness + 10));
      colors.push(hslToHex((hue - 30 + 360) % 360, baseSaturation * 0.6, baseLightness - 10));
      break;
      
    case 'analogous':
      // Add 2-3 analogous colors (30° apart)
      colors.push(hslToHex((hue + 30) % 360, baseSaturation, baseLightness));
      colors.push(hslToHex((hue - 30 + 360) % 360, baseSaturation, baseLightness));
      colors.push(hslToHex((hue + 60) % 360, baseSaturation * 0.7, baseLightness + 15));
      break;
      
    case 'triadic':
      // Add triadic colors (120° apart)
      colors.push(hslToHex((hue + 120) % 360, baseSaturation * 0.8, baseLightness));
      colors.push(hslToHex((hue + 240) % 360, baseSaturation * 0.8, baseLightness));
      // Add a lighter/darker variation
      colors.push(hslToHex(hue, baseSaturation * 0.5, baseLightness + 20));
      break;
  }
  
  // Add neutral colors for balance
  const neutralHue = getColorTemperature(hue) === 'warm' ? 200 : 30; // Cool neutral for warm base, warm neutral for cool base
  colors.push(hslToHex(neutralHue, 20, 50)); // Neutral gray
  colors.push(hslToHex(neutralHue, 10, 80)); // Light neutral
  
  return colors.slice(0, 8); // Limit to 8 colors for professional palettes
}

export function generateRandomPalette(): string[] {
  // Use the new professional palette generation
  return generateProfessionalPalette();
}

// Cosine-based palette generation (Inigo Quilez method)
export function generateCosinePalette(
  a: [number, number, number] = [0.5, 0.5, 0.5],
  b: [number, number, number] = [0.5, 0.5, 0.5],
  c: [number, number, number] = [1.0, 1.0, 1.0],
  d: [number, number, number] = [0.0, 0.33, 0.67],
  steps: number = 8
): string[] {
  const colors: string[] = [];
  
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(255 * Math.max(0, Math.min(1, a[0] + b[0] * Math.cos(2 * Math.PI * (c[0] * t + d[0])))));
    const g = Math.round(255 * Math.max(0, Math.min(1, a[1] + b[1] * Math.cos(2 * Math.PI * (c[1] * t + d[1])))));
    const b_val = Math.round(255 * Math.max(0, Math.min(1, a[2] + b[2] * Math.cos(2 * Math.PI * (c[2] * t + d[2])))));
    
    colors.push(rgbToHex(r, g, b_val));
  }
  
  return colors;
}

// Seeded random number generator for deterministic results
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

// Generate palette with seed for reproducibility
export function generateSeededPalette(
  seed: number,
  temperature?: 'warm' | 'cool' | 'neutral',
  saturationLevel: SaturationLevel = 'moderate'
): string[] {
  const rng = new SeededRandom(seed);
  
  let hue: number;
  if (temperature) {
    const tempRange = COLOR_TEMPERATURE[temperature.toUpperCase() as keyof typeof COLOR_TEMPERATURE];
    hue = rng.nextFloat(tempRange.min, tempRange.max);
  } else {
    hue = rng.nextFloat(0, 360);
  }
  
  return generateProfessionalPalette(hue, temperature, saturationLevel);
}

export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}
