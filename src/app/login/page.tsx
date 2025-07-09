// Replace your /src/app/login/page.tsx with this version
'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setError('')
    setIsLoading(true)

    try {
      console.log('🔐 Starting email sign-in...')
      await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ Email sign-in successful')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('❌ Email sign-in failed:', error)

      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address')
          break
        case 'auth/wrong-password':
          setError('Incorrect password')
          break
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        case 'auth/user-disabled':
          setError('This account has been disabled')
          break
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later')
          break
        default:
          setError('Failed to sign in. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen theme-bg-gradient flex items-center justify-center p-6'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='futuristic-avatar mx-auto mb-4 !w-16 !h-16'>
            <TrendingUp className='w-8 h-8' />
          </div>
          <h1 className='text-3xl font-bold theme-text-primary mb-2'>Welcome Back</h1>
          <p className='theme-text-secondary'>Sign in to your trading account</p>
        </div>

        {/* Sign-in Form */}
        <div className='theme-card p-8 space-y-6'>
          {/* Google Sign-In */}
          <GoogleSignInButton />

          {/* Divider */}
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-600'></div>
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-gray-900 theme-text-secondary'>Or continue with email</span>
            </div>
          </div>

          {/* Email Sign-In Form */}
          <form onSubmit={handleEmailSignIn} className='space-y-4'>
            {/* Error Message */}
            {error && (
              <div className='bg-red-500/20 border border-red-500 rounded-lg p-3'>
                <p className='text-red-400 text-sm'>{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor='email' className='block text-sm font-medium theme-text-primary mb-2'>
                Email Address
              </label>
              <input
                type='email'
                id='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='your@email.com'
                required
                className='
                  w-full px-4 py-3 rounded-lg border border-gray-600 
                  bg-gray-800 theme-text-primary placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-colors
                '
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor='password' className='block text-sm font-medium theme-text-primary mb-2'>
                Password
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter your password'
                  required
                  className='
                    w-full px-4 py-3 pr-12 rounded-lg border border-gray-600 
                    bg-gray-800 theme-text-primary placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors
                  '
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 theme-text-secondary hover:theme-text-primary'
                >
                  {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='
                w-full theme-button-primary py-3 font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              '
            >
              {isLoading ? (
                <>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  Signing In
                </>
              ) : (
                <>
                  Sign In
                  <span className='text-lg'>→</span>
                </>
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className='text-center'>
            <Link
              href='/forgot-password'
              className='text-sm theme-text-secondary hover:text-blue-400 transition-colors'
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className='text-center mt-6'>
          <p className='theme-text-secondary'>
            Don't have an account?{' '}
            <Link href='/signup' className='text-blue-400 hover:text-blue-300 font-medium transition-colors'>
              Sign up here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className='text-center mt-8'>
          <p className='text-sm theme-text-secondary'>Secure trading platform with advanced portfolio management</p>
        </div>
      </div>
    </div>
  )
}
