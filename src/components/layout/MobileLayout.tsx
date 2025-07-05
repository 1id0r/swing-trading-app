// components/layout/MobileLayout.tsx
'use client'

import { ReactNode } from 'react'
import { BottomNavigation } from './BottomNavigation'

interface MobileLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBackClick?: () => void
}

export function MobileLayout({ children, title, subtitle, showBackButton = false, onBackClick }: MobileLayoutProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'>
      <div className='max-w-md mx-auto'>
        {/* Header */}
        <header className='p-4 pt-8 pb-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {showBackButton && (
                <button onClick={onBackClick} className='text-gray-400 hover:text-white transition-colors'>
                  ←
                </button>
              )}
              <div>
                <h1 className='text-2xl font-bold'>{title}</h1>
                {subtitle && <p className='text-gray-400 text-sm'>{subtitle}</p>}
              </div>
            </div>

            {/* User Avatar */}
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold'>
              ST
            </div>
          </div>
        </header>

        {/* Content */}
        <main className='px-4 pb-20'>{children}</main>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  )
}
