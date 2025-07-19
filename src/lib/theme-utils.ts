// lib/theme-utils.ts - Hybrid approach that works with existing classes
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Legacy class mappers - these return your existing classes for now
export const themeClasses = {
  // Use existing theme classes for backwards compatibility
  bgPrimary: 'theme-bg-primary',
  bgSecondary: 'theme-bg-secondary', 
  gradientBg: 'theme-bg-gradient',
  textPrimary: 'theme-text-primary',
  textSecondary: 'theme-text-secondary',
  
  // Use existing theme classes
  card: 'theme-card',
  input: 'theme-input',
  buttonPrimary: 'theme-button-primary',
  buttonSecondary: 'theme-button-secondary',
  
  // Simple utility mappings
  border: 'border-gray-200 dark:border-slate-700',
  hover: 'hover:bg-gray-100 dark:hover:bg-slate-700',
  
  // New Tailwind classes for additional functionality
  cardHover: 'hover:shadow-md dark:hover:shadow-slate-900/20 transition-shadow duration-200',
  buttonGhost: 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-medium rounded-xl px-4 py-2 transition-colors duration-200',
  
  // Status colors
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
  textMuted: 'text-slate-500 dark:text-slate-500',
} as const

// Helper to combine theme classes (backwards compatible)
export function themeClass(
  base: keyof typeof themeClasses,
  oledSupport = true,
  additional?: string
): string {
  const baseClass = themeClasses[base]
  return cn(baseClass, additional)
}

// Price change color helper - uses existing watchlist classes
export function getPriceChangeClass(change: number): string {
  if (change > 0) return 'watchlist-price-positive'
  if (change < 0) return 'watchlist-price-negative'
  return 'watchlist-price-neutral'
}

// Market status indicator - uses existing classes
export function getMarketStatusClass(isOpen: boolean): string {
  return isOpen 
    ? 'watchlist-live-dot' 
    : 'bg-gray-400 dark:bg-gray-600'
}

// Watchlist specific class helpers - use existing classes
export const watchlistClasses = {
  container: 'watchlist-container',
  searchInput: 'watchlist-search-input',
  buttonPrimary: 'watchlist-button-primary',
  buttonSecondary: 'watchlist-button-secondary',
  textPrimary: 'watchlist-text-primary',
  textSecondary: 'watchlist-text-secondary',
  stockItem: 'watchlist-stock-item',
  folderCard: 'watchlist-folder-card',
  searchResults: 'watchlist-search-results',
  icon: 'watchlist-icon',
  liveDot: 'watchlist-live-dot',
}

// Gradual migration helper - lets you mix existing and new classes
export function migrateClass(
  legacyClass: string, 
  newTailwindClass?: string, 
  additional?: string
): string {
  // For now, return legacy class. Later you can switch to newTailwindClass
  return cn(legacyClass, additional)
}

// Quick helpers for common patterns
export const ui = {
  // Cards
  card: () => themeClass('card'),
  cardWithHover: () => cn(themeClass('card'), themeClass('cardHover')),
  
  // Buttons  
  primaryButton: () => themeClass('buttonPrimary'),
  secondaryButton: () => themeClass('buttonSecondary'),
  ghostButton: () => themeClass('buttonGhost'),
  
  // Text
  primaryText: () => themeClass('textPrimary'),
  secondaryText: () => themeClass('textSecondary'),
  mutedText: () => themeClass('textMuted'),
  
  // Inputs
  input: () => themeClass('input'),
  
  // Layouts
  gradient: () => themeClass('gradientBg'),
  
  // Watchlist specific
  watchlist: {
    container: () => watchlistClasses.container,
    searchInput: () => watchlistClasses.searchInput,
    buttonPrimary: () => watchlistClasses.buttonPrimary,
    buttonSecondary: () => watchlistClasses.buttonSecondary,
    textPrimary: () => watchlistClasses.textPrimary,
    textSecondary: () => watchlistClasses.textSecondary,
    stockItem: () => watchlistClasses.stockItem,
    folderCard: () => watchlistClasses.folderCard,
  }
}