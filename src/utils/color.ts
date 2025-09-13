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

export function generateRandomPalette(): string[] {
  const colors: string[] = [];
  
  // Generate a base color
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.random() * 40; // 60-100%
  const lightness = 30 + Math.random() * 40; // 30-70%
  
  // Generate variations
  for (let i = 0; i < 8; i++) {
    const h = (hue + i * 45) % 360;
    const s = Math.max(20, saturation - Math.random() * 20);
    const l = Math.max(10, Math.min(90, lightness + (Math.random() - 0.5) * 40));
    
    const hex = hslToHex(h, s, l);
    colors.push(hex);
  }
  
  return colors;
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
