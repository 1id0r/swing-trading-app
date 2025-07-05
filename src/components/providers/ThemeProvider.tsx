// components/providers/ThemeProvider.tsx - Create this new file
'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, fetchSettings } = useSettingsStore()

  useEffect(() => {
    // Load settings on app initialization
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    // Apply theme immediately when settings load
    if (settings?.theme) {
      const root = document.documentElement

      // Remove existing theme classes
      root.classList.remove('light', 'dark', 'oled')

      // Add new theme class
      root.classList.add(settings.theme)

      console.log('Theme applied:', settings.theme) // Debug log
    }
  }, [settings?.theme])

  return <>{children}</>
}
