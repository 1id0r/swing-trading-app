// app/page.tsx (With relative import - immediate fix)
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from './contexts/AuthContext' // ← Relative import
import { TrendingUp, BarChart3, ArrowRight, Shield, Smartphone } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

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

          <div className='flex items-center gap-4'>
            <Link href='/login' className='theme-button-secondary !py-3 !px-6'>
              Sign In
            </Link>
            <Link href='/signup' className='theme-button-primary !py-3 !px-6 flex items-center gap-2'>
              Get Started
              <ArrowRight className='w-4 h-4' />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className='container mx-auto px-6 py-16'>
        <div className='text-center max-w-4xl mx-auto'>
          <h1 className='text-5xl md:text-6xl font-bold theme-text-primary mb-6'>
            Professional
            <span className='bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'>
              {' '}
              Swing Trading{' '}
            </span>
            Portfolio
          </h1>

          <p className='text-xl theme-text-secondary mb-12 max-w-2xl mx-auto'>
            Track your trades, calculate real P&L with FIFO methodology, and manage your portfolio with advanced
            analytics. Built for serious swing traders.
          </p>

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
