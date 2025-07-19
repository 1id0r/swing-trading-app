// components/layout/MobileLayout.tsx - Refactored with pure Tailwind
'use client'

import { ReactNode } from 'react'
import { InteractiveDock } from '@/components/ui/InteractiveDock'
import { UserMenu } from '@/components/ui/UserMenu'
import { AppLogo } from '@/components/ui/AppLogo'
import { ChevronLeft } from 'lucide-react'
import { cn, themeClass } from '@/lib/theme-utils'

interface MobileLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBackClick?: () => void
  showBrandHeader?: boolean
}

export function MobileLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  onBackClick,
  showBrandHeader = true,
}: MobileLayoutProps) {
  return (
    <div
      className={cn(themeClass('gradientBg'), themeClass('textPrimary'), 'min-h-screen transition-all duration-300')}
    >
      <div className='max-w-md mx-auto'>
        {/* Header */}
        <header className='p-4 pt-safe-area-inset-top'>
          <div className='flex items-center justify-between'>
            {/* Left side - Back button or Brand */}
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              {showBackButton && (
                <button
                  onClick={onBackClick}
                  className={cn(
                    themeClass('textSecondary'),
                    themeClass('hover'),
                    'p-2 -ml-2 rounded-xl transition-all duration-200 hover:scale-105'
                  )}
                  aria-label='Go back'
                >
                  <ChevronLeft className='w-5 h-5' />
                </button>
              )}

              {/* Brand Header or Page Title */}
              {showBrandHeader && !showBackButton ? (
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm'>
                    <AppLogo size={32} variant='white' />
                  </div>
                  <div className='min-w-0'>
                    <h1 className={cn(themeClass('textPrimary'), 'text-xl font-bold tracking-wide')}>candL</h1>
                    <p className={cn(themeClass('textSecondary'), 'text-xs')}>Trading Portfolio</p>
                  </div>
                </div>
              ) : (
                <div className='min-w-0 flex-1'>
                  <h1 className={cn(themeClass('textPrimary'), 'text-2xl font-bold truncate')}>{title}</h1>
                  {subtitle && <p className={cn(themeClass('textSecondary'), 'text-sm mt-1 truncate')}>{subtitle}</p>}
                </div>
              )}
            </div>

            {/* Right side - User Menu */}
            <div className='flex-shrink-0'>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className='px-4 pb-24 space-y-6'>{children}</main>

        {/* Interactive Dock Navigation */}
        <InteractiveDock />
      </div>
    </div>
  )
}
