'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { AppLogo } from '@/components/ui/AppLogo'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, redirectTo = '/login' }) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className='min-h-screen theme-bg-gradient flex items-center justify-center'>
        <div className='theme-card p-8 text-center'>
          <div className='mx-auto mb-6 p-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl border border-blue-500/20 w-fit'>
            <AppLogo size={48} variant='white' />
          </div>
          <p className='theme-text-primary font-medium'>Loading your account...</p>
        </div>
      </div>
    )
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null
  }

  return <>{children}</>
}
