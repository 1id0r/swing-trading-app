// Replace your /src/app/signup/page.tsx with this version
'use client'

import { useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      console.log('🔐 Starting email sign-up...')

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      // Update user profile with display name
      await updateProfile(user, {
        displayName: formData.name,
      })

      console.log('✅ Email sign-up successful:', {
        uid: user.uid,
        email: user.email,
        name: formData.name,
      })

      // Create user in your database
      await createUserInDatabase(user, formData.name)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('❌ Email sign-up failed:', error)

      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists')
          break
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        case 'auth/weak-password':
          setError('Password is too weak')
          break
        case 'auth/operation-not-allowed':
          setError('Email/password accounts are not enabled')
          break
        default:
          setError('Failed to create account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const createUserInDatabase = async (user: any, displayName: string) => {
    try {
      console.log('👤 Creating user in database...')

      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          displayName: displayName,
          photoURL: user.photoURL,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create user: ${response.status}`)
      }

      const userData = await response.json()
      console.log('✅ User created in database:', userData)
    } catch (error) {
      console.error('❌ Failed to create user in database:', error)
      // Don't throw here - user is still authenticated with Firebase
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
          <h1 className='text-3xl font-bold theme-text-primary mb-2'>Create Account</h1>
          <p className='theme-text-secondary'>Start your trading journey today</p>
        </div>

        {/* Sign-up Form */}
        <div className='theme-card p-8 space-y-6'>
          {/* Google Sign-In */}
          <GoogleSignInButton>Sign up with Google</GoogleSignInButton>

          {/* Divider */}
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-600'></div>
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-gray-900 theme-text-secondary'>Or create account with email</span>
            </div>
          </div>

          {/* Email Sign-Up Form */}
          <form onSubmit={handleEmailSignUp} className='space-y-4'>
            {/* Error Message */}
            {error && (
              <div className='bg-red-500/20 border border-red-500 rounded-lg p-3'>
                <p className='text-red-400 text-sm'>{error}</p>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor='name' className='block text-sm font-medium theme-text-primary mb-2'>
                Full Name
              </label>
              <input
                type='text'
                id='name'
                name='name'
                value={formData.name}
                onChange={handleInputChange}
                placeholder='Enter your full name'
                required
                className='
                  w-full px-4 py-3 rounded-lg border border-gray-600 
                  bg-gray-800 theme-text-primary placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-colors
                '
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor='email' className='block text-sm font-medium theme-text-primary mb-2'>
                Email Address
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
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
                  name='password'
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder='Create a password (6+ characters)'
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

            {/* Confirm Password Field */}
            <div>
              <label htmlFor='confirmPassword' className='block text-sm font-medium theme-text-primary mb-2'>
                Confirm Password
              </label>
              <div className='relative'>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id='confirmPassword'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder='Confirm your password'
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 theme-text-secondary hover:theme-text-primary'
                >
                  {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
            </div>

            {/* Create Account Button */}
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
                  Creating Account
                </>
              ) : (
                <>
                  Create Account
                  <span className='text-lg'>→</span>
                </>
              )}
            </button>
          </form>

          {/* Terms */}
          <div className='text-center'>
            <p className='text-xs theme-text-secondary'>
              By creating an account, you agree to our{' '}
              <Link href='/terms' className='text-blue-400 hover:text-blue-300'>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href='/privacy' className='text-blue-400 hover:text-blue-300'>
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Sign In Link */}
        <div className='text-center mt-6'>
          <p className='theme-text-secondary'>
            Already have an account?{' '}
            <Link href='/login' className='text-blue-400 hover:text-blue-300 font-medium transition-colors'>
              Sign in here
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
