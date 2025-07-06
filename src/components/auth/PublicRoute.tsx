// components/auth/PublicRoute.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'

interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children, redirectTo = '/dashboard' }) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Show loading spinner while checking auth
  if (loading) {
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

  // Don't render children if user is authenticated (redirect them)
  if (user) {
    return null
  }

  return <>{children}</>
}
