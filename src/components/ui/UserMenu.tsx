// Replace your /src/components/ui/UserMenu.tsx with this fixed version
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ChevronDown, User, Settings, LogOut } from 'lucide-react'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const router = useRouter()

  // Get user initials for fallback
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const names = name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }

    if (email) {
      return email.substring(0, 2).toUpperCase()
    }

    return 'U'
  }

  // Fix Google photo URL to avoid rate limiting
  const getOptimizedPhotoURL = (photoURL?: string | null) => {
    if (!photoURL) return null

    // Convert Google photo URL to a more reliable format
    if (photoURL.includes('googleusercontent.com')) {
      // Remove size restrictions and add referrer policy bypass
      return photoURL
        .replace(/=s\d+-c$/, '=s400-c') // Use larger size
        .replace(/=w\d+-h\d+/, '=s400-c') // Replace any width/height with square
    }

    return photoURL
  }

  const initials = getInitials(user?.displayName, user?.email)
  const optimizedPhotoURL = getOptimizedPhotoURL(user?.photoURL)

  // Only show photo if we have URL, no error, and it's loaded OR we haven't tried yet
  const shouldShowPhoto = optimizedPhotoURL && !imageError && (imageLoaded || !imageError)

  console.log('🖼️ Photo Status:', {
    originalURL: user?.photoURL,
    optimizedURL: optimizedPhotoURL,
    imageError,
    imageLoaded,
    shouldShowPhoto,
  })

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleProfileClick = () => {
    setIsOpen(false)
    router.push('/profile')
  }

  const handleSettingsClick = () => {
    setIsOpen(false)
    router.push('/settings')
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('❌ Profile image failed to load:', optimizedPhotoURL)
    setImageError(true)
    setImageLoaded(false)
  }

  const handleImageLoad = () => {
    console.log('✅ Profile image loaded successfully:', optimizedPhotoURL)
    setImageError(false)
    setImageLoaded(true)
  }

  // Reset image state when photo URL changes
  useEffect(() => {
    if (optimizedPhotoURL) {
      setImageError(false)
      setImageLoaded(false)
    }
  }, [optimizedPhotoURL])

  const AvatarImage = ({ size = 'w-10 h-10', className = '' }) => (
    <div
      className={`
      relative ${size} rounded-full overflow-hidden 
      bg-gradient-to-br from-blue-500 to-purple-600 
      flex items-center justify-center
      ${className}
    `}
    >
      {shouldShowPhoto ? (
        <>
          <img
            src={optimizedPhotoURL!}
            alt={user?.displayName || user?.email || 'User'}
            className='w-full h-full object-cover'
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading='lazy'
            referrerPolicy='no-referrer'
            style={{
              imageRendering: 'auto',
              backfaceVisibility: 'hidden',
            }}
          />
          {/* Online indicator */}
          <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full'></div>
        </>
      ) : (
        <span className='font-bold text-white text-sm'>{initials}</span>
      )}
    </div>
  )

  return (
    <div className='relative'>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='
          flex items-center gap-2 p-2 rounded-full 
          hover:bg-white/10 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
          group
        '
      >
        <AvatarImage className='ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-200' />

        {/* Dropdown Arrow */}
        <ChevronDown
          className={`
            w-4 h-4 theme-text-secondary transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div
            className='
            absolute right-0 mt-2 w-72 bg-gray-900/95 backdrop-blur-lg rounded-xl 
            shadow-2xl border border-white/10 z-50 overflow-hidden
          '
          >
            {/* User Info Header */}
            <div className='px-4 py-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20'>
              <div className='flex items-center gap-3'>
                <AvatarImage size='w-12 h-12' className='ring-2 ring-white/20' />

                {/* User Details */}
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-white truncate'>{user?.displayName || 'User'}</p>
                  <p className='text-xs text-gray-300 truncate'>{user?.email}</p>
                  {/* Account Type Badge */}
                  <div className='mt-1'>
                    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300'>
                      {shouldShowPhoto ? 'Google Account' : 'Email Account'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className='py-2'>
              <button
                onClick={handleProfileClick}
                className='
                  w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 
                  hover:bg-white/10 transition-colors duration-200
                  group
                '
              >
                <User className='w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors' />
                <span className='group-hover:text-white transition-colors'>View Profile</span>
              </button>

              <button
                onClick={handleSettingsClick}
                className='
                  w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 
                  hover:bg-white/10 transition-colors duration-200
                  group
                '
              >
                <Settings className='w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors' />
                <span className='group-hover:text-white transition-colors'>Settings</span>
              </button>

              <div className='border-t border-white/10 my-2'></div>

              <button
                onClick={handleLogout}
                className='
                  w-full flex items-center gap-3 px-4 py-3 text-sm text-red-300 
                  hover:bg-red-500/10 hover:text-red-200 transition-colors duration-200
                  group
                '
              >
                <LogOut className='w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors' />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Footer */}
            <div className='px-4 py-3 bg-gray-800/50 border-t border-white/10'>
              <p className='text-xs text-gray-400 text-center'>Trading Platform v2.0</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
