# Palette Generator

A modern, AI-powered color palette generator built with Next.js, TypeScript, and shadcn/ui. Create beautiful, accessible color palettes for your UI designs using Google's Gemini AI.

## Features

### 🎨 AI-Powered Palette Generation
- **Prompt-Based Generation**: Describe your vision and let AI create the perfect palette
- **Preset Integration**: Choose from curated palettes like Nord, Gruvbox, Catppuccin, Solarized, and Rosé Pine
- **Screenshot Analysis**: Upload UI screenshots for AI-powered palette refinement

### 🛠️ Advanced Palette Management
- **Lock Colors**: Preserve specific colors while regenerating others
- **Custom Colors**: Add your own colors and lock them for future generations
- **Live Editing**: Click any color to edit hex codes inline
- **Smart Organization**: Colors automatically organized into logical categories

### 📊 Professional Analysis
- **AI-Powered Insights**: Get detailed analysis of mood, harmony, and accessibility
- **Use Case Optimization**: Analyze palettes for specific applications
- **Real-time Streaming**: Watch analysis results appear in real-time

### 💾 Export & Storage
- **Multiple Formats**: Export as SVG, CSS variables, or FF Hex for game development
- **Save & Load**: Save palettes with custom names using browser storage
- **Persistent Storage**: Your work is automatically saved locally

### ♿ Accessibility First
- **WCAG AA Compliance**: All generated palettes meet accessibility standards
- **Contrast Validation**: Automatic contrast ratio checking
- **Keyboard Navigation**: Full keyboard support throughout the app

## Getting Started

### Prerequisites
- Node.js 18+ 
- A Google Gemini API key (get one free at [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd palette-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

5. Click the settings button and add your Gemini API key to start generating palettes!

## Usage

### Generating Palettes

1. **From Prompts**: Enter a description like "A vibrant retro arcade" or "A serene minimalist yoga studio"
2. **From Presets**: Choose from popular color schemes as inspiration or strict templates
3. **From Screenshots**: Upload UI images for AI analysis and refinement

### Managing Colors

- **Copy**: Click any color card to copy the hex code
- **Edit**: Click the hex code to edit it inline
- **Lock**: Use the lock button to preserve colors during regeneration
- **Remove**: Delete custom colors with the trash button

### Analyzing Palettes

Click "Analyze Palette" to get AI-powered insights about:
- Overall mood and aesthetic
- Color harmony and relationships  
- Accessibility assessment
- Brand personality
- Suitability for specific use cases
- Recommendations for improvement

### Exporting

Choose from multiple export formats:
- **SVG**: Vector image with color swatches and labels
- **CSS Variables**: Ready-to-use CSS custom properties
- **FF Hex**: Hexadecimal values for game development

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI**: Google Gemini 2.0 Flash (via @google/generative-ai)
- **Storage**: Browser localStorage
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── globals.css     # Global styles and Tailwind config
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main application page
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── Header.tsx     # Application header
│   ├── ColorCard.tsx  # Individual color display
│   ├── GeneratorControls.tsx # AI generation controls
│   ├── PaletteDisplay.tsx    # Main palette view
│   ├── SettingsPanel.tsx     # Settings modal
│   └── AnalysisModal.tsx     # Palette analysis modal
├── services/          # Business logic
│   ├── ai.ts         # AI service for Gemini API
│   └── storage.ts    # Local storage management
├── types/            # TypeScript type definitions
│   └── index.ts      # All type definitions
└── utils/            # Utility functions
    └── color.ts      # Color manipulation utilities
```

## API Key Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and paste it in the app settings
4. Your API key is stored locally and never sent to our servers

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- AI powered by [Google Gemini](https://ai.google.dev/)
- Icons by [Lucide](https://lucide.dev/)
- Font by [Inter](https://rsms.me/inter/)