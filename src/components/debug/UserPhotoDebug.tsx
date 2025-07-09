// Create this temporary debug component: /src/components/debug/UserPhotoDebug.tsx
'use client'

import { useAuth } from '@/app/contexts/AuthContext'

export function UserPhotoDebug() {
  const { user } = useAuth()

  return (
    <div className='fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs z-50'>
      <h3 className='font-bold mb-2'>User Debug Info:</h3>
      <div className='space-y-1'>
        <p>
          <strong>UID:</strong> {user?.uid || 'null'}
        </p>
        <p>
          <strong>Email:</strong> {user?.email || 'null'}
        </p>
        <p>
          <strong>Display Name:</strong> {user?.displayName || 'null'}
        </p>
        <p>
          <strong>Photo URL:</strong> {user?.photoURL || 'null'}
        </p>
        <p>
          <strong>Provider:</strong> {user?.providerData?.[0]?.providerId || 'null'}
        </p>
        <p>
          <strong>Has Photo:</strong> {user?.photoURL ? 'YES' : 'NO'}
        </p>
      </div>

      {user?.photoURL && (
        <div className='mt-2'>
          <p className='font-bold'>Photo Test:</p>
          <img
            src={user.photoURL}
            alt='Profile'
            className='w-8 h-8 rounded-full mt-1'
            onError={() => console.log('❌ Photo failed to load')}
            onLoad={() => console.log('✅ Photo loaded successfully')}
          />
        </div>
      )}
    </div>
  )
}
