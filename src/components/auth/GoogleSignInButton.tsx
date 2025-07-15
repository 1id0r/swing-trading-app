// /src/components/auth/GoogleSignInButton.tsx
'use client'

import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

interface GoogleSignInButtonProps {
  className?: string
  children?: React.ReactNode
}

export function GoogleSignInButton({ className = '', children }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      console.log('🔐 Starting Google Sign-In...')

      const provider = new GoogleAuthProvider()

      // Add additional scopes if needed
      provider.addScope('email')
      provider.addScope('profile')

      // Configure provider settings
      provider.setCustomParameters({
        prompt: 'select_account', // Always show account selection
      })

      const result = await signInWithPopup(auth, provider)
      const user = result.user

      console.log('✅ Google Sign-In successful:', {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
      })

      // Create user in your database
      await createUserInDatabase(user)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('❌ Google Sign-In failed:', error)

      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('🚫 User closed the sign-in popup')
      } else if (error.code === 'auth/popup-blocked') {
        console.log('🚫 Popup was blocked by browser')
        alert('Please allow popups for this site to sign in with Google')
      } else {
        alert('Failed to sign in with Google. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const createUserInDatabase = async (user: any) => {
    try {
      console.log('👤 Creating user in database...')

      // Get Firebase ID token (NEW - this is what was missing!)
      const idToken = await user.getIdToken()
      console.log('🔑 Got Firebase ID token')

      // Use the correct endpoint with Bearer token
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`, // NEW - Bearer token auth
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create user: ${response.status} - ${errorText}`)
      }

      const userData = await response.json()
      console.log('✅ User created in database:', userData)
      return userData
    } catch (error) {
      console.error('❌ Failed to create user in database:', error)
      // Don't throw here - user is still authenticated with Firebase
    }
  }
  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={`
        theme-button-primary w-full
        flex items-center justify-center gap-3 px-4 py-3 
        transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          {/* Google Icon - Updated colors for better contrast on blue background */}
          <svg className='w-5 h-5' viewBox='0 0 24 24'>
            <path
              fill='#ffffff'
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              opacity='0.9'
            />
            <path
              fill='#ffffff'
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              opacity='0.9'
            />
            <path
              fill='#ffffff'
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              opacity='0.8'
            />
            <path
              fill='#ffffff'
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              opacity='0.9'
            />
          </svg>
          <span className='font-semibold text-white'>{children || 'Continue with Google'}</span>
        </>
      )}
    </button>
  )
}
