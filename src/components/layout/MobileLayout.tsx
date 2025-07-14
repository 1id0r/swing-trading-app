// /src/components/layout/MobileLayout.tsx - Updated with CANDl branding
'use client'

import { ReactNode } from 'react'
import { InteractiveDock } from '@/components/ui/InteractiveDock'
import { UserMenu } from '@/components/ui/UserMenu'
import { AppLogo } from '@/components/ui/AppLogo'

interface MobileLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBackClick?: () => void
  showBrandHeader?: boolean // New prop to control brand header display
}

export function MobileLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  onBackClick,
  showBrandHeader = true, // Default to showing brand header
}: MobileLayoutProps) {
  return (
    <div className='min-h-screen theme-bg-gradient theme-text-primary transition-all duration-300'>
      <div className='max-w-md mx-auto'>
        {/* Header */}
        <header className='p-2 pt-4 pb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3 flex-1'>
              {showBackButton && (
                <button
                  onClick={onBackClick}
                  className='theme-text-secondary hover:theme-text-primary p-2 -ml-2 rounded-lg transition-colors duration-200'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 '>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                  </svg>
                </button>
              )}

              {/* Brand Header or Page Title */}
              {showBrandHeader && !showBackButton ? (
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-xl  border-blue-500/20'>
                    <AppLogo size={32} variant='white' />
                  </div>
                  <div>
                    <h1 className='text-xl font-bold theme-text-primary tracking-wide'>candL</h1>
                    <p className='text-xs theme-text-secondary'>Trading Portfolio</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className='text-2xl font-bold theme-text-primary'>{title}</h1>
                  {subtitle && <p className='theme-text-secondary text-sm'>{subtitle}</p>}
                </div>
              )}
            </div>

            {/* User Menu */}
            <UserMenu />
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
