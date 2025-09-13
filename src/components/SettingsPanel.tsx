'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Trash2, Check } from 'lucide-react';
import { AppSettings } from '@/types';
import { StorageService } from '@/services/storage';
import { useTheme } from './ThemeProvider';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({
  open,
  onOpenChange
}: SettingsPanelProps) {
  const { settings, setSettings } = useTheme();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState(settings.apiSettings.geminiApiKey);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const handleSaveApiKey = () => {
    const newSettings = {
      ...settings,
      apiSettings: {
        ...settings.apiSettings,
        geminiApiKey: apiKey
      }
    };
    
    setSettings(newSettings);
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };

  const handleClearApiKey = () => {
    setApiKey('');
    const newSettings = {
      ...settings,
      apiSettings: {
        ...settings.apiSettings,
        geminiApiKey: ''
      }
    };
    setSettings(newSettings);
  };

  const handleThemeToggle = (checked: boolean) => {
    const newSettings: AppSettings = {
      ...settings,
      theme: checked ? 'dark' : 'light'
    };
    setSettings(newSettings);
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This will delete all saved palettes and settings.')) {
      StorageService.clearAllData();
      window.location.reload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your API keys, theme preferences, and application data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* API Settings */}
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure your Google Gemini API key for AI-powered palette generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Google Gemini API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="Enter your Gemini API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={handleSaveApiKey}
                    disabled={!apiKey.trim()}
                    variant={apiKeySaved ? 'default' : 'outline'}
                  >
                    {apiKeySaved ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : null}
                    {apiKeySaved ? 'Saved' : 'Save'}
                  </Button>
                  {settings.apiSettings.geminiApiKey && (
                    <Button
                      onClick={handleClearApiKey}
                      variant="outline"
                      size="sm"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from the{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the appearance of the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme for the application
                  </p>
                </div>
                <Switch
                  checked={settings.theme === 'dark'}
                  onCheckedChange={handleThemeToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage your saved data and application storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Clear All Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Delete all saved palettes and reset settings
                  </p>
                </div>
                <Button
                  onClick={handleClearAllData}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle>API Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    settings.apiSettings.geminiApiKey ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm">
                  {settings.apiSettings.geminiApiKey ? 'API key configured' : 'No API key configured'}
                </span>
              </div>
              {!settings.apiSettings.geminiApiKey && (
                <p className="text-xs text-muted-foreground mt-1">
                  Add an API key above to enable AI-powered palette generation.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
