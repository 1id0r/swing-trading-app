// components/providers/ThemeProvider.tsx (Fixed - no auto-fetch)
'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, setTheme } = useSettingsStore()

  // Apply theme when settings change (but don't auto-fetch)
  useEffect(() => {
    if (settings?.theme) {
      console.log('🎨 ThemeProvider - Applying theme:', settings.theme)
      setTheme(settings.theme)
    } else {
      // Apply default theme if no settings
      console.log('🎨 ThemeProvider - Applying default theme: dark')
      setTheme('dark')
    }
  }, [settings?.theme, setTheme])

  // Apply initial theme from localStorage if available
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme && ['light', 'dark', 'oled'].includes(savedTheme)) {
        console.log('🎨 ThemeProvider - Applying saved theme from localStorage:', savedTheme)
        setTheme(savedTheme as 'light' | 'dark' | 'oled')
      }
    } catch (error) {
      console.warn('❌ Could not access localStorage for theme')
    }
  }, [setTheme])

  return <>{children}</>
}
