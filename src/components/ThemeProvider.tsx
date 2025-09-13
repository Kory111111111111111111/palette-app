'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings } from '@/types';
import { StorageService } from '@/services/storage';

interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    apiSettings: { geminiApiKey: '' }
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadedSettings = StorageService.getSettings();
    setSettings(loadedSettings);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);
  }, [settings.theme]);

  const setTheme = (theme: 'light' | 'dark') => {
    const newSettings = { ...settings, theme };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme: settings.theme, 
      setTheme, 
      settings, 
      setSettings: updateSettings 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
