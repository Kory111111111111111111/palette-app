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
  // MINIMAL & CLEAN
  {
    name: 'Nord',
    group: 'Minimal',
    colors: ['#2E3440', '#3B4252', '#434C5E', '#4C566A', '#D8DEE9', '#E5E9F0', '#ECEFF4', '#8FBCBB', '#88C0D0', '#81A1C1', '#5E81AC', '#BF616A', '#D08770', '#EBCB8B', '#A3BE8C', '#B48EAD'],
    description: 'Clean and minimal dark theme'
  },
  {
    name: 'Rosé Pine',
    group: 'Minimal',
    colors: ['#191724', '#1F1D2E', '#26233A', '#6E6A86', '#908CAA', '#C4A7E7', '#EBBCBA', '#F6C177', '#9CCFD8', '#31748F', '#21202E', '#403D52', '#524F67', '#E0DEF4', '#F5F5F7', '#E2E1E8'],
    description: 'All natural pine, faux fur and a bit of soho vibes'
  },
  {
    name: 'Tokyo Night',
    group: 'Minimal',
    colors: ['#1A1B26', '#24283B', '#2F3549', '#414868', '#565F89', '#7AA2F7', '#9ECE6A', '#E0AF68', '#F7768E', '#BB9AF7', '#7DCFFF', '#A9B1D6', '#C0CAF5', '#CFC9C2', '#D4D4D5', '#F8F8F2'],
    description: 'Clean dark theme inspired by Tokyo at night'
  },
  {
    name: 'One Dark',
    group: 'Minimal',
    colors: ['#282C34', '#21252B', '#2C323C', '#3E4451', '#5C6370', '#ABB2BF', '#E06C75', '#D19A66', '#E5C07B', '#98C379', '#56B6C2', '#61AFEF', '#C678DD', '#BE5046', '#E5C07B', '#F8F8F2'],
    description: 'Atom One Dark theme - professional and clean'
  },
  {
    name: 'Dracula',
    group: 'Minimal',
    colors: ['#282A36', '#44475A', '#6272A4', '#8BE9FD', '#50FA7B', '#FFB86C', '#FF79C6', '#BD93F9', '#F8F8F2', '#FF5555', '#F1FA8C', '#50FA7B', '#8BE9FD', '#FF79C6', '#BD93F9', '#FF6B6B'],
    description: 'Dark theme with vibrant accent colors'
  },

  // RETRO & VINTAGE
  {
    name: 'Gruvbox',
    group: 'Retro',
    colors: ['#282828', '#3C3836', '#504945', '#665C54', '#7C6F64', '#928374', '#A89984', '#BDAE93', '#D5C4A1', '#EBDBB2', '#FBF1C7', '#FB4934', '#FE8019', '#FABD2F', '#B8BB26', '#8EC07C', '#83A598', '#D3869B'],
    description: 'Retro groove color scheme'
  },
  {
    name: 'Monokai',
    group: 'Retro',
    colors: ['#272822', '#3E3D32', '#49483E', '#75715E', '#A6E22E', '#F92672', '#66D9EF', '#E6DB74', '#AE81FF', '#FD971F', '#F8F8F2', '#75715E', '#A6E22E', '#F92672', '#66D9EF', '#E6DB74'],
    description: 'Classic Monokai color scheme'
  },
  {
    name: 'Material Retro',
    group: 'Retro',
    colors: ['#212121', '#303030', '#424242', '#616161', '#9E9E9E', '#BDBDBD', '#E0E0E0', '#F5F5F5', '#FF5722', '#FF9800', '#FFC107', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#795548'],
    description: 'Material Design with retro vibes'
  },
  {
    name: 'Cyberpunk',
    group: 'Retro',
    colors: ['#0D1117', '#161B22', '#21262D', '#30363D', '#484F58', '#6E7681', '#8B949E', '#C9D1D9', '#FF7B72', '#F85149', '#FFA657', '#FFD700', '#7EE787', '#56D364', '#79C0FF', '#A5D6FF', '#D2A8FF', '#F0B6FF'],
    description: 'Neon cyberpunk aesthetic'
  },
  {
    name: 'Synthwave',
    group: 'Retro',
    colors: ['#0F0F23', '#1A1A2E', '#16213E', '#0F3460', '#533483', '#E94560', '#F27121', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'],
    description: '80s synthwave neon vibes'
  },

  // PASTEL & SOFT
  {
    name: 'Catppuccin',
    group: 'Pastel',
    colors: ['#1E1E2E', '#2D2D44', '#363A4F', '#494D64', '#6C7086', '#8A8F98', '#A5ADCE', '#B4BEFE', '#C6AAE8', '#F2CDCD', '#F5E0DC', '#FAB387', '#FAE3B0', '#A6E3A1', '#94E2D5', '#89DCEB', '#74C7EC', '#89B4FA', '#CBA6F7', '#F38BA8', '#EBA0AC'],
    description: 'Soft pastel color palette'
  },
  {
    name: 'Lavender',
    group: 'Pastel',
    colors: ['#F8F4FF', '#F0E6FF', '#E6D7FF', '#D9C7FF', '#CCB7FF', '#BFA7FF', '#B297FF', '#A587FF', '#9877FF', '#8B67FF', '#7E57FF', '#7147FF', '#6437FF', '#5727FF', '#4A17FF', '#3D07FF'],
    description: 'Soft lavender gradient palette'
  },
  {
    name: 'Mint Fresh',
    group: 'Pastel',
    colors: ['#F0FFF4', '#E6FFED', '#D4F4DD', '#C2E9CD', '#B0DEBD', '#9ED3AD', '#8CC89D', '#7ABD8D', '#68B27D', '#56A76D', '#449C5D', '#32914D', '#20863D', '#0E7B2D', '#00701D', '#00650D'],
    description: 'Fresh mint green palette'
  },
  {
    name: 'Peach Dreams',
    group: 'Pastel',
    colors: ['#FFF5F0', '#FFEBE0', '#FFE1D0', '#FFD7C0', '#FFCDB0', '#FFC3A0', '#FFB990', '#FFAF80', '#FFA570', '#FF9B60', '#FF9150', '#FF8740', '#FF7D30', '#FF7320', '#FF6910', '#FF5F00'],
    description: 'Warm peach and coral tones'
  },
  {
    name: 'Ocean Breeze',
    group: 'Pastel',
    colors: ['#F0F8FF', '#E6F3FF', '#D4EDFF', '#C2E7FF', '#B0E1FF', '#9EDBFF', '#8CD5FF', '#7ACFFF', '#68C9FF', '#56C3FF', '#44BDFF', '#32B7FF', '#20B1FF', '#0EABFF', '#00A5FF', '#009FFF'],
    description: 'Calm ocean blue palette'
  },

  // CLASSIC & PROFESSIONAL
  {
    name: 'Solarized',
    group: 'Classic',
    colors: ['#002B36', '#073642', '#586E75', '#657B83', '#839496', '#93A1A1', '#EEE8D5', '#FDF6E3', '#B58900', '#CB4B16', '#DC322F', '#D33682', '#6C71C4', '#268BD2', '#2AA198', '#859900'],
    description: 'Ethan Schoonover\'s carefully designed palette'
  },
  {
    name: 'Material Design',
    group: 'Classic',
    colors: ['#F44336', '#2196F3', '#4CAF50', '#FFC107', '#9C27B0', '#FF5722', '#607D8B', '#795548', '#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121'],
    description: 'Google Material Design color system'
  },
  {
    name: 'Ant Design',
    group: 'Classic',
    colors: ['#1890FF', '#F5222D', '#FADB14', '#52C41A', '#722ED1', '#FA8C16', '#13C2C2', '#EB2F96', '#FFFFFF', '#FAFAFA', '#F5F5F5', '#F0F0F0', '#D9D9D9', '#BFBFBF', '#8C8C8C', '#595959', '#434343', '#262626'],
    description: 'Ant Design color palette'
  },
  {
    name: 'Bootstrap',
    group: 'Classic',
    colors: ['#007BFF', '#6C757D', '#28A745', '#DC3545', '#FFC107', '#17A2B8', '#6F42C1', '#E83E8C', '#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD', '#495057', '#343A40', '#212529'],
    description: 'Bootstrap 5 color system'
  },
  {
    name: 'Tailwind',
    group: 'Classic',
    colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B', '#475569', '#334155', '#1E293B', '#0F172A'],
    description: 'Tailwind CSS color palette'
  },

  // NATURE & EARTH
  {
    name: 'Forest',
    group: 'Nature',
    colors: ['#0D1B0F', '#1A2E1F', '#27412F', '#34543F', '#41674F', '#4E7A5F', '#5B8D6F', '#68A07F', '#75B38F', '#82C69F', '#8FD9AF', '#9CECBF', '#A9FFCF', '#B6FFDF', '#C3FFEF', '#D0FFFF'],
    description: 'Deep forest green palette'
  },
  {
    name: 'Ocean',
    group: 'Nature',
    colors: ['#001F3F', '#003366', '#004080', '#004D99', '#0059B3', '#0066CC', '#0073E6', '#0080FF', '#1A8CFF', '#3399FF', '#4DA6FF', '#66B3FF', '#80C0FF', '#99CCFF', '#B3D9FF', '#CCE6FF'],
    description: 'Deep ocean blue palette'
  },
  {
    name: 'Sunset',
    group: 'Nature',
    colors: ['#2C1810', '#3D2417', '#4E301E', '#5F3C25', '#70482C', '#815433', '#92603A', '#A36C41', '#B47848', '#C5844F', '#D69056', '#E79C5D', '#F8A864', '#FFB46B', '#FFC072', '#FFCC79'],
    description: 'Warm sunset orange palette'
  },
  {
    name: 'Autumn',
    group: 'Nature',
    colors: ['#2D1B0F', '#3D2515', '#4D2F1B', '#5D3921', '#6D4327', '#7D4D2D', '#8D5733', '#9D6139', '#AD6B3F', '#BD7545', '#CD7F4B', '#DD8951', '#ED9357', '#FD9D5D', '#FFA763', '#FFB169'],
    description: 'Rich autumn colors'
  },
  {
    name: 'Mountain',
    group: 'Nature',
    colors: ['#1A1A2E', '#16213E', '#0F3460', '#533483', '#E94560', '#F27121', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#A8E6CF'],
    description: 'Mountain landscape inspired'
  },

  // VIBRANT & BOLD
  {
    name: 'Neon',
    group: 'Vibrant',
    colors: ['#000000', '#1A0033', '#330066', '#4D0099', '#6600CC', '#8000FF', '#9933FF', '#B366FF', '#CC99FF', '#E6CCFF', '#FF00FF', '#FF33CC', '#FF6699', '#FF9966', '#FFCC33', '#FFFF00'],
    description: 'Electric neon color palette'
  },
  {
    name: 'Rainbow',
    group: 'Vibrant',
    colors: ['#FF0000', '#FF4000', '#FF8000', '#FFBF00', '#FFFF00', '#BFFF00', '#80FF00', '#40FF00', '#00FF00', '#00FF40', '#00FF80', '#00FFBF', '#00FFFF', '#00BFFF', '#0080FF', '#0040FF', '#0000FF', '#4000FF', '#8000FF', '#BF00FF', '#FF00FF'],
    description: 'Full spectrum rainbow palette'
  },
  {
    name: 'Electric',
    group: 'Vibrant',
    colors: ['#000000', '#1A0033', '#330066', '#4D0099', '#6600CC', '#8000FF', '#00FF00', '#00FF80', '#00FFFF', '#0080FF', '#0000FF', '#8000FF', '#FF00FF', '#FF0080', '#FF0000', '#FF8000', '#FFFF00', '#80FF00'],
    description: 'High contrast electric colors'
  },
  {
    name: 'Pop Art',
    group: 'Vibrant',
    colors: ['#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#FFFF00', '#ADFF2F', '#00FF00', '#00FF7F', '#00FFFF', '#00BFFF', '#0000FF', '#8A2BE2', '#FF00FF', '#FF1493', '#DC143C', '#B22222'],
    description: 'Bold pop art inspired colors'
  },
  {
    name: 'Gaming',
    group: 'Vibrant',
    colors: ['#000000', '#1A0033', '#330066', '#4D0099', '#6600CC', '#8000FF', '#00FF00', '#00FF80', '#00FFFF', '#0080FF', '#0000FF', '#8000FF', '#FF00FF', '#FF0080', '#FF0000', '#FF8000', '#FFFF00', '#80FF00'],
    description: 'Gaming inspired vibrant palette'
  },

  // MONOCHROME & GRAYSCALE
  {
    name: 'Pure Black',
    group: 'Monochrome',
    colors: ['#000000', '#0A0A0A', '#141414', '#1E1E1E', '#282828', '#323232', '#3C3C3C', '#464646', '#505050', '#5A5A5A', '#646464', '#6E6E6E', '#787878', '#828282', '#8C8C8C', '#969696'],
    description: 'Pure black to light gray scale'
  },
  {
    name: 'Charcoal',
    group: 'Monochrome',
    colors: ['#1C1C1C', '#2A2A2A', '#383838', '#464646', '#545454', '#626262', '#707070', '#7E7E7E', '#8C8C8C', '#9A9A9A', '#A8A8A8', '#B6B6B6', '#C4C4C4', '#D2D2D2', '#E0E0E0', '#EEEEEE'],
    description: 'Rich charcoal grayscale'
  },
  {
    name: 'Warm Gray',
    group: 'Monochrome',
    colors: ['#2D2D2D', '#3A3A3A', '#474747', '#545454', '#616161', '#6E6E6E', '#7B7B7B', '#888888', '#959595', '#A2A2A2', '#AFAFAF', '#BCBCBC', '#C9C9C9', '#D6D6D6', '#E3E3E3', '#F0F0F0'],
    description: 'Warm toned grayscale'
  },
  {
    name: 'Cool Gray',
    group: 'Monochrome',
    colors: ['#2A2A2A', '#363636', '#424242', '#4E4E4E', '#5A5A5A', '#666666', '#727272', '#7E7E7E', '#8A8A8A', '#969696', '#A2A2A2', '#AEAEAE', '#BABABA', '#C6C6C6', '#D2D2D2', '#DEDEDE'],
    description: 'Cool toned grayscale'
  },

  // SEASONAL & THEMED
  {
    name: 'Spring',
    group: 'Seasonal',
    colors: ['#F0F8F0', '#E6F3E6', '#D4EDD4', '#C2E7C2', '#B0E1B0', '#9EDB9E', '#8CD58C', '#7ACF7A', '#68C968', '#56C356', '#44BD44', '#32B732', '#20B120', '#0EAB0E', '#00A500', '#009F00'],
    description: 'Fresh spring green palette'
  },
  {
    name: 'Summer',
    group: 'Seasonal',
    colors: ['#FFF8DC', '#FFE4B5', '#FFD700', '#FFA500', '#FF8C00', '#FF7F50', '#FF6347', '#FF4500', '#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB', '#FFE4E1', '#FFF0F5', '#F0F8FF', '#E6E6FA'],
    description: 'Bright summer colors'
  },
  {
    name: 'Winter',
    group: 'Seasonal',
    colors: ['#F0F8FF', '#E6F3FF', '#D4EDFF', '#C2E7FF', '#B0E1FF', '#9EDBFF', '#8CD5FF', '#7ACFFF', '#68C9FF', '#56C3FF', '#44BDFF', '#32B7FF', '#20B1FF', '#0EABFF', '#00A5FF', '#009FFF'],
    description: 'Cool winter blue palette'
  },
  {
    name: 'Holiday',
    group: 'Seasonal',
    colors: ['#DC143C', '#B22222', '#8B0000', '#228B22', '#006400', '#000080', '#0000CD', '#4169E1', '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FFFFFF', '#F0F0F0', '#D3D3D3', '#A9A9A9'],
    description: 'Traditional holiday colors'
  },

  // MODERN & TRENDY
  {
    name: 'Glassmorphism',
    group: 'Modern',
    colors: ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD', '#6C757D', '#495057', '#343A40', '#212529', '#007BFF', '#6F42C1', '#E83E8C', '#20C997', '#FFC107', '#DC3545'],
    description: 'Modern glassmorphism aesthetic'
  },
  {
    name: 'Neumorphism',
    group: 'Modern',
    colors: ['#F0F0F3', '#E6E6E9', '#DCDCE0', '#D2D2D6', '#C8C8CC', '#BEBEC2', '#B4B4B8', '#AAAAAE', '#A0A0A4', '#96969A', '#8C8C90', '#828286', '#78787C', '#6E6E72', '#646468', '#5A5A5E'],
    description: 'Soft neumorphism design'
  },
  {
    name: 'Dark Mode',
    group: 'Modern',
    colors: ['#0D1117', '#161B22', '#21262D', '#30363D', '#484F58', '#6E7681', '#8B949E', '#C9D1D9', '#F0F6FC', '#58A6FF', '#79C0FF', '#A5D6FF', '#D2A8FF', '#F0B6FF', '#FF7B72', '#F85149'],
    description: 'Modern dark mode palette'
  },
  {
    name: 'High Contrast',
    group: 'Modern',
    colors: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF8000', '#8000FF', '#80FF00', '#FF0080', '#0080FF', '#80FF80', '#FF8080', '#8080FF'],
    description: 'High contrast accessibility palette'
  }
];
