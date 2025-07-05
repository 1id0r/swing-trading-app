// hooks/useTheme.ts - Create this new file
'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useTheme() {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    // Load settings on app start
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  useEffect(() => {
    // Apply theme when settings change
    if (settings?.theme) {
      applyTheme(settings.theme);
    }
  }, [settings?.theme]);

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'oled');
    
    // Add the new theme class
    root.classList.add(theme);
    
    // Store in localStorage for persistence
    localStorage.setItem('theme', theme);
  };

  return {
    theme: settings?.theme || 'dark',
    setTheme: (theme: string) => {
      applyTheme(theme);
      // This will be handled by the settings store
    }
  };
}