// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, TrendingUp, ArrowRight } from 'lucide-react'
import { signIn } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      await signIn(data.email, data.password)
      router.push('/dashboard')
    } catch (error: any) {
      setAuthError(error.message)
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

        {/* Login Form */}
        <div className='theme-card p-8'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Error Message */}
            {authError && (
              <div className='theme-card !border-red-500/30 !bg-red-500/10 p-4'>
                <p className='text-red-400 text-sm font-medium'>{authError}</p>
              </div>
            )}

            {/* Email */}
            <div className='space-y-3'>
              <label className='text-sm font-semibold theme-text-primary block'>Email Address</label>
              <div className='relative'>
                <Mail className='absolute left-4 top-4 w-4 h-4 theme-text-secondary opacity-60' />
                <input
                  {...register('email')}
                  type='email'
                  placeholder='your@email.com'
                  className='theme-input w-full pl-12'
                  autoComplete='email'
                />
              </div>
              {errors.email && <p className='form-error'>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className='space-y-3'>
              <label className='text-sm font-semibold theme-text-primary block'>Password</label>
              <div className='relative'>
                <Lock className='absolute left-4 top-4 w-4 h-4 theme-text-secondary opacity-60' />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter your password'
                  className='theme-input w-full pl-12 pr-12'
                  autoComplete='current-password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-4 top-4 theme-text-secondary opacity-60 hover:opacity-100 transition-opacity'
                >
                  {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                </button>
              </div>
              {errors.password && <p className='form-error'>{errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='theme-button-primary w-full !py-4 flex items-center justify-center gap-2 disabled:opacity-50'
            >
              {isLoading ? (
                <>
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className='w-4 h-4' />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className='mt-6 pt-6 border-t theme-border text-center'>
            <p className='theme-text-secondary text-sm'>
              Don't have an account?{' '}
              <Link href='/signup' className='text-blue-400 hover:text-blue-300 font-medium transition-colors'>
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className='mt-6 text-center'>
          <p className='theme-text-secondary text-xs opacity-80'>
            Secure trading platform with advanced portfolio management
          </p>
        </div>
      </div>
    </div>
  )
}
