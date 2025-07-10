// app/page.tsx - Complete version with mobile optimizations
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from './contexts/AuthContext'
import { TrendingUp, BarChart3, ArrowRight, Shield, Smartphone, X } from 'lucide-react'

// Mobile Menu Component (inline for simplicity)
function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    console.log('🏠 HomePage - Auth state:', {
      user: user ? `${user.email} (${user.uid})` : null,
      loading,
    })

    // Only redirect if we're sure the user is authenticated AND not loading
    if (!loading && user) {
      console.log('🔄 Redirecting authenticated user to dashboard')
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading while checking auth
  if (loading) {
    console.log('⏳ HomePage - Still loading auth state')
    return (
      <div className='min-h-screen theme-bg-gradient flex items-center justify-center'>
        <div className='theme-card p-8 text-center'>
          <div className='futuristic-avatar mx-auto mb-4 !w-16 !h-16'>
            <div className='w-8 h-8 border-3 border-blue-400/30 border-t-blue-400 rounded-full animate-spin'></div>
          </div>
          <p className='theme-text-primary font-medium'>Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, don't show landing page (they'll be redirected)
  if (user) {
    console.log('👤 HomePage - User is authenticated, should redirect soon')
    return (
      <div className='min-h-screen theme-bg-gradient flex items-center justify-center'>
        <div className='theme-card p-8 text-center'>
          <div className='futuristic-avatar mx-auto mb-4 !w-16 !h-16'>
            <div className='w-8 h-8 border-3 border-blue-400/30 border-t-blue-400 rounded-full animate-spin'></div>
          </div>
          <p className='theme-text-primary font-medium'>Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  // User is not authenticated - show landing page
  console.log('🏠 HomePage - Showing landing page (user not authenticated)')

  return (
    <div className='min-h-screen theme-bg-gradient'>
      {/* Header */}
      <header className='container mx-auto px-6 py-8'>
        <nav className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='futuristic-avatar !w-12 !h-12'>
              <TrendingUp className='w-6 h-6' />
            </div>
            <span className='text-xl font-bold theme-text-primary'>SwingTrader</span>
          </div>

          {/* Desktop buttons - hidden on mobile */}
          <div className='hidden sm:flex items-center gap-4'>
            <Link href='/login' className='theme-button-secondary !py-3 !px-6'>
              Sign In
            </Link>
            <Link href='/signup' className='theme-button-primary !py-3 !px-6 flex items-center gap-2'>
              Get Started
              <ArrowRight className='w-4 h-4' />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className='sm:hidden'>
            <button onClick={() => setIsMobileMenuOpen(true)} className='theme-button-secondary !py-2 !px-3'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Hero Section */}
      <main className='container mx-auto px-6 py-16'>
        <div className='text-center max-w-4xl mx-auto'>
          <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold theme-text-primary mb-6'>
            Professional
            <span className='bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'>
              {' '}
              Swing Trading{' '}
            </span>
            Portfolio
          </h1>

          <p className='text-lg md:text-xl theme-text-secondary mb-12 max-w-2xl mx-auto'>
            Track your trades, calculate real P&L with FIFO methodology, and manage your portfolio with advanced
            analytics. Built for serious swing traders.
          </p>

          {/* Hero CTA Buttons - Now the primary CTAs on mobile */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center mb-16'>
            <Link
              href='/signup'
              className='theme-button-primary !py-4 !px-8 text-lg flex items-center justify-center gap-2'
            >
              Start Trading
              <ArrowRight className='w-5 h-5' />
            </Link>
            <Link href='/login' className='theme-button-secondary !py-4 !px-8 text-lg'>
              Sign In
            </Link>
          </div>

          {/* Features Grid */}
          <div className='grid md:grid-cols-3 gap-8 mt-20'>
            <div className='theme-card p-8 text-center'>
              <div className='futuristic-avatar mx-auto mb-4'>
                <BarChart3 className='w-8 h-8' />
              </div>
              <h3 className='text-xl font-bold theme-text-primary mb-3'>Real-time P&L</h3>
              <p className='theme-text-secondary'>
                FIFO cost basis calculations with live market data and tax implications
              </p>
            </div>

            <div className='theme-card p-8 text-center'>
              <div className='futuristic-avatar mx-auto mb-4'>
                <Smartphone className='w-8 h-8' />
              </div>
              <h3 className='text-xl font-bold theme-text-primary mb-3'>Mobile First</h3>
              <p className='theme-text-secondary'>
                Optimized for mobile trading with intuitive touch controls and responsive design
              </p>
            </div>

            <div className='theme-card p-8 text-center'>
              <div className='futuristic-avatar mx-auto mb-4'>
                <Shield className='w-8 h-8' />
              </div>
              <h3 className='text-xl font-bold theme-text-primary mb-3'>Secure & Private</h3>
              <p className='theme-text-secondary'>
                Your trading data is encrypted and stored securely with enterprise-grade security
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='container mx-auto px-6 py-8 mt-20'>
        <div className='border-t theme-border pt-8 text-center'>
          <p className='theme-text-secondary text-sm'>&copy; 2024 SwingTrader. Built for professional swing traders.</p>
        </div>
      </footer>
    </div>
  )
}
