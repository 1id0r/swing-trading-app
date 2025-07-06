// app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, User, TrendingUp, ArrowRight } from 'lucide-react'
import { signUp } from '@/lib/auth'

const signupSchema = z
  .object({
    displayName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      await signUp(data.email, data.password, data.displayName)
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
          <h1 className='text-3xl font-bold theme-text-primary mb-2'>Create Account</h1>
          <p className='theme-text-secondary'>Start your trading journey today</p>
        </div>

        {/* Signup Form */}
        <div className='theme-card p-8'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Error Message */}
            {authError && (
              <div className='theme-card !border-red-500/30 !bg-red-500/10 p-4'>
                <p className='text-red-400 text-sm font-medium'>{authError}</p>
              </div>
            )}

            {/* Display Name */}
            <div className='space-y-3'>
              <label className='text-sm font-semibold theme-text-primary block'>Full Name</label>
              <div className='relative'>
                <User className='absolute left-4 top-4 w-4 h-4 theme-text-secondary opacity-60' />
                <input
                  {...register('displayName')}
                  type='text'
                  placeholder='John Doe'
                  className='theme-input w-full pl-12'
                  autoComplete='name'
                />
              </div>
              {errors.displayName && <p className='form-error'>{errors.displayName.message}</p>}
            </div>

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
                  placeholder='Create a password'
                  className='theme-input w-full pl-12 pr-12'
                  autoComplete='new-password'
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

            {/* Confirm Password */}
            <div className='space-y-3'>
              <label className='text-sm font-semibold theme-text-primary block'>Confirm Password</label>
              <div className='relative'>
                <Lock className='absolute left-4 top-4 w-4 h-4 theme-text-secondary opacity-60' />
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='Confirm your password'
                  className='theme-input w-full pl-12 pr-12'
                  autoComplete='new-password'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-4 top-4 theme-text-secondary opacity-60 hover:opacity-100 transition-opacity'
                >
                  {showConfirmPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                </button>
              </div>
              {errors.confirmPassword && <p className='form-error'>{errors.confirmPassword.message}</p>}
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className='w-4 h-4' />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className='mt-6 pt-6 border-t theme-border text-center'>
            <p className='theme-text-secondary text-sm'>
              Already have an account?{' '}
              <Link href='/login' className='text-blue-400 hover:text-blue-300 font-medium transition-colors'>
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Terms */}
        <div className='mt-6 text-center'>
          <p className='theme-text-secondary text-xs opacity-80'>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
