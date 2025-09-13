export interface Color {
  hex: string;
  role: string;
  locked: boolean;
  isCustom: boolean;
}

export interface UIPalette {
  brand: Color[];
  surface: Color[];
  text: Color[];
  feedback: Color[];
  extended: Color[];
  custom: Color[];
}

export interface SavedPalette {
  id: string;
  name: string;
  palette: UIPalette;
  createdAt: Date;
  preview: string[];
}

export interface PresetPalette {
  name: string;
  group: string;
  colors: string[];
  description?: string;
}

export interface AnalysisQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface ScreenshotAnalysis {
  questions: AnalysisQuestion[];
  imageData: string;
}

export interface GenerationContext {
  type: 'prompt' | 'preset_inspired' | 'preset_strict' | 'screenshot_refined';
  prompt?: string;
  presetPalettes?: PresetPalette[];
  lockedColors?: Color[];
  colorCount?: number;
  screenshotAnalysis?: {
    imageData: string;
    answers: Record<string, string>;
  };
}

export interface ExportFormat {
  type: 'svg' | 'css' | 'ff_hex';
  includeLockedOnly: boolean;
}

export interface APISettings {
  geminiApiKey: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  apiSettings: APISettings;
}

export interface ColorRole {
  name: string;
  description: string;
  category: 'brand' | 'surface' | 'text' | 'feedback' | 'extended';
  required: boolean;
}

export const COLOR_ROLES: Record<string, ColorRole> = {
  primary: {
    name: 'Primary',
    description: 'Main brand color for primary actions and highlights',
    category: 'brand',
    required: true
  },
  secondary: {
    name: 'Secondary', 
    description: 'Secondary brand color for supporting elements',
    category: 'brand',
    required: true
  },
  accent: {
    name: 'Accent',
    description: 'Accent color for special highlights and callouts',
    category: 'brand',
    required: false
  },
  background: {
    name: 'Background',
    description: 'Main background color for the application',
    category: 'surface',
    required: true
  },
  surface: {
    name: 'Surface',
    description: 'Surface color for cards, panels, and elevated elements',
    category: 'surface',
    required: true
  },
  surfaceVariant: {
    name: 'Surface Variant',
    description: 'Alternative surface color for subtle variations',
    category: 'surface',
    required: false
  },
  textPrimary: {
    name: 'Text Primary',
    description: 'Primary text color with highest contrast',
    category: 'text',
    required: true
  },
  textSecondary: {
    name: 'Text Secondary',
    description: 'Secondary text color for less prominent content',
    category: 'text',
    required: true
  },
  textTertiary: {
    name: 'Text Tertiary',
    description: 'Tertiary text color for subtle information',
    category: 'text',
    required: false
  },
  border: {
    name: 'Border',
    description: 'Border color for dividers and outlines',
    category: 'text',
    required: false
  },
  success: {
    name: 'Success',
    description: 'Success state color for positive feedback',
    category: 'feedback',
    required: true
  },
  warning: {
    name: 'Warning',
    description: 'Warning state color for cautionary feedback',
    category: 'feedback',
    required: true
  },
  error: {
    name: 'Error',
    description: 'Error state color for negative feedback',
    category: 'feedback',
    required: true
  },
  info: {
    name: 'Info',
    description: 'Info state color for informational feedback',
    category: 'feedback',
    required: false
  }
};

export const PRESET_PALETTES: PresetPalette[] = [
  {
    name: 'Nord',
    group: 'Minimal',
    colors: ['#2E3440', '#3B4252', '#434C5E', '#4C566A', '#D8DEE9', '#E5E9F0', '#ECEFF4', '#8FBCBB', '#88C0D0', '#81A1C1', '#5E81AC', '#BF616A', '#D08770', '#EBCB8B', '#A3BE8C', '#B48EAD'],
    description: 'Clean and minimal dark theme'
  },
  {
    name: 'Gruvbox',
    group: 'Retro',
    colors: ['#282828', '#3C3836', '#504945', '#665C54', '#7C6F64', '#928374', '#A89984', '#BDAE93', '#D5C4A1', '#EBDBB2', '#FBF1C7', '#FB4934', '#FE8019', '#FABD2F', '#B8BB26', '#8EC07C', '#83A598', '#D3869B'],
    description: 'Retro groove color scheme'
  },
  {
    name: 'Catppuccin',
    group: 'Pastel',
    colors: ['#1E1E2E', '#2D2D44', '#363A4F', '#494D64', '#6C7086', '#8A8F98', '#A5ADCE', '#B4BEFE', '#C6AAE8', '#F2CDCD', '#F5E0DC', '#FAB387', '#FAE3B0', '#A6E3A1', '#94E2D5', '#89DCEB', '#74C7EC', '#89B4FA', '#CBA6F7', '#F38BA8', '#EBA0AC'],
    description: 'Soft pastel color palette'
  },
  {
    name: 'Solarized',
    group: 'Classic',
    colors: ['#002B36', '#073642', '#586E75', '#657B83', '#839496', '#93A1A1', '#EEE8D5', '#FDF6E3', '#B58900', '#CB4B16', '#DC322F', '#D33682', '#6C71C4', '#268BD2', '#2AA198', '#859900'],
    description: 'Ethan Schoonover\'s carefully designed palette'
  },
  {
    name: 'Rosé Pine',
    group: 'Minimal',
    colors: ['#191724', '#1F1D2E', '#26233A', '#6E6A86', '#908CAA', '#C4A7E7', '#EBBCBA', '#F6C177', '#9CCFD8', '#31748F', '#21202E', '#403D52', '#524F67', '#E0DEF4', '#F5F5F7', '#E2E1E8'],
    description: 'All natural pine, faux fur and a bit of soho vibes'
  }
];
