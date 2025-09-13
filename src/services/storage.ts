import { SavedPalette, UIPalette, AppSettings } from '@/types';

const STORAGE_KEYS = {
  SAVED_PALETTES: 'palette-app-saved-palettes',
  SETTINGS: 'palette-app-settings',
  CURRENT_PALETTE: 'palette-app-current-palette'
} as const;

export class StorageService {
  private static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  static savePalette(palette: UIPalette, name: string): SavedPalette {
    if (!this.isClient()) {
      throw new Error('StorageService can only be used on the client side');
    }

    const savedPalette: SavedPalette = {
      id: crypto.randomUUID(),
      name,
      palette,
      createdAt: new Date(),
      preview: [
        ...palette.brand,
        ...palette.surface,
        ...palette.text,
        ...palette.feedback
      ].slice(0, 8).map(c => c.hex)
    };

    const existingPalettes = this.getSavedPalettes();
    existingPalettes.push(savedPalette);
    
    localStorage.setItem(STORAGE_KEYS.SAVED_PALETTES, JSON.stringify(existingPalettes));
    
    return savedPalette;
  }

  static getSavedPalettes(): SavedPalette[] {
    if (!this.isClient()) return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_PALETTES);
      if (!stored) return [];
      
      const palettes = JSON.parse(stored) as SavedPalette[];
      return palettes.map(p => ({
        ...p,
        createdAt: new Date(p.createdAt)
      }));
    } catch (error) {
      console.error('Error loading saved palettes:', error);
      return [];
    }
  }

  static deletePalette(id: string): void {
    if (!this.isClient()) return;
    
    const palettes = this.getSavedPalettes();
    const filtered = palettes.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.SAVED_PALETTES, JSON.stringify(filtered));
  }

  static loadPalette(id: string): UIPalette | null {
    if (!this.isClient()) return null;
    
    const palettes = this.getSavedPalettes();
    const palette = palettes.find(p => p.id === id);
    return palette?.palette || null;
  }

  static saveCurrentPalette(palette: UIPalette): void {
    if (!this.isClient()) return;
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_PALETTE, JSON.stringify(palette));
  }

  static getCurrentPalette(): UIPalette | null {
    if (!this.isClient()) return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_PALETTE);
      if (!stored) return null;
      return JSON.parse(stored) as UIPalette;
    } catch (error) {
      console.error('Error loading current palette:', error);
      return null;
    }
  }

  static clearCurrentPalette(): void {
    if (!this.isClient()) return;
    
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PALETTE);
  }

  static saveSettings(settings: AppSettings): void {
    if (!this.isClient()) return;
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static getSettings(): AppSettings {
    if (!this.isClient()) {
      return {
        theme: 'dark',
        apiSettings: {
          geminiApiKey: ''
        }
      };
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!stored) {
        return {
          theme: 'dark',
          apiSettings: {
            geminiApiKey: ''
          }
        };
      }
      return JSON.parse(stored) as AppSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return {
        theme: 'dark',
        apiSettings: {
          geminiApiKey: ''
        }
      };
    }
  }

  static updateApiKey(apiKey: string): void {
    if (!this.isClient()) return;
    
    const settings = this.getSettings();
    settings.apiSettings.geminiApiKey = apiKey;
    this.saveSettings(settings);
  }

  static getApiKey(): string {
    return this.getSettings().apiSettings.geminiApiKey;
  }

  static clearAllData(): void {
    if (!this.isClient()) return;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
