// Create: /src/components/ui/UserAvatar.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showFallback?: boolean
}

export function UserAvatar({ size = 'md', className = '', showFallback = true }: UserAvatarProps) {
  const { user } = useAuth()
  const [imageError, setImageError] = useState(false)

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
  }

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

  const initials = getInitials(user?.displayName, user?.email)
  const hasPhoto = user?.photoURL && !imageError

  return (
    <div
      className={`
      relative rounded-full overflow-hidden 
      bg-gradient-to-br from-blue-500 to-purple-600 
      flex items-center justify-center
      ${sizeClasses[size]} ${className}
    `}
    >
      {hasPhoto ? (
        <>
          <img
            src={user.photoURL}
            alt={user.displayName || user.email || 'User'}
            className='w-full h-full object-cover'
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
          {/* Online indicator (optional) */}
          <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full'></div>
        </>
      ) : (
        showFallback && <span className='font-bold text-white'>{initials}</span>
      )}
    </div>
  )
}

// Extended version with dropdown menu
interface UserAvatarMenuProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatarMenu({ size = 'md', className = '' }: UserAvatarMenuProps) {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className='relative'>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          focus:ring-offset-gray-900 rounded-full transition-all duration-200
          hover:scale-105 ${className}
        `}
      >
        <UserAvatar size={size} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div
            className='
            absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg 
            border border-gray-700 z-50 py-2
          '
          >
            {/* User Info */}
            <div className='px-4 py-3 border-b border-gray-700'>
              <div className='flex items-center gap-3'>
                <UserAvatar size='md' />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-white truncate'>{user?.displayName || 'User'}</p>
                  <p className='text-xs text-gray-400 truncate'>{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className='py-1'>
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to profile page
                }}
                className='
                  w-full text-left px-4 py-2 text-sm text-gray-300 
                  hover:bg-gray-700 hover:text-white transition-colors
                '
              >
                View Profile
              </button>

              <button
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to settings page
                }}
                className='
                  w-full text-left px-4 py-2 text-sm text-gray-300 
                  hover:bg-gray-700 hover:text-white transition-colors
                '
              >
                Settings
              </button>

              <div className='border-t border-gray-700 my-1'></div>

              <button
                onClick={handleLogout}
                className='
                  w-full text-left px-4 py-2 text-sm text-red-400 
                  hover:bg-gray-700 hover:text-red-300 transition-colors
                '
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
