// components/layout/MobileLayout.tsx (Theme-Aware)
'use client'

import { ReactNode } from 'react'
import { InteractiveDock } from '@/components/ui/InteractiveDock'

interface MobileLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBackClick?: () => void
}

export function MobileLayout({ children, title, subtitle, showBackButton = false, onBackClick }: MobileLayoutProps) {
  return (
    <div className=' min-h-screen theme-bg-gradient theme-text-primary transition-all duration-300'>
      <div className='max-w-md mx-auto'>
        {/* Header */}
        <header className='p-4 pt-8 pb-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {showBackButton && (
                <button
                  onClick={onBackClick}
                  className=' .theme-button-primary theme-text-secondary hover:theme-text-primary p-2 -ml-2 rounded-lg transition-colors duration-200'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                  </svg>
                </button>
              )}
              <div>
                <h1 className='text-2xl font-bold theme-text-primary'>{title}</h1>
                {subtitle && <p className='theme-text-secondary text-sm'>{subtitle}</p>}
              </div>
            </div>

            {/* User Avatar */}
            <div className=' .futuristic-avatar w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center theme-text-primary   font-bold'>
              ST
            </div>
          </div>
        </header>

        {/* Content */}
        <main className='px-4 pb-24'>{children}</main>

        {/* Interactive Dock Navigation */}
        <InteractiveDock />
      </div>
    </div>
  )
}
