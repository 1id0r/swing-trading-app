// components/ui/MobileMenu.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden' onClick={onClose} />

      {/* Menu */}
      <div className='fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-gray-900/95 backdrop-blur-md border-l border-gray-700 z-50 sm:hidden'>
        <div className='flex flex-col h-full'>
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-gray-700'>
            <h2 className='text-xl font-bold theme-text-primary'>Menu</h2>
            <button
              onClick={onClose}
              className='p-2 theme-text-secondary hover:theme-text-primary rounded-lg transition-colors'
            >
              <X className='w-5 h-5' />
            </button>
          </div>

          {/* Menu Items */}
          <div className='flex-1 p-6'>
            <div className='space-y-4'>
              <Link
                href='/login'
                onClick={onClose}
                className='
                  w-full flex items-center justify-center gap-2 
                  theme-button-secondary !py-4 !px-6 text-lg
                '
              >
                Sign In
              </Link>

              <Link
                href='/signup'
                onClick={onClose}
                className='
                  w-full flex items-center justify-center gap-2 
                  theme-button-primary !py-4 !px-6 text-lg
                '
              >
                Get Started
                <ArrowRight className='w-5 h-5' />
              </Link>
            </div>

            {/* Additional Info */}
            <div className='mt-12 p-4 theme-card'>
              <h3 className='font-semibold theme-text-primary mb-2'>Professional Trading Platform</h3>
              <p className='theme-text-secondary text-sm'>
                Track trades, calculate real P&L with FIFO methodology, and manage your portfolio with advanced
                analytics.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className='p-6 border-t border-gray-700'>
            <p className='text-xs theme-text-secondary text-center'>Built for serious swing traders</p>
          </div>
        </div>
      </div>
    </>
  )
}
