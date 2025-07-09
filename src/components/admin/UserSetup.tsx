// components/admin/UserSetup.tsx (Temporary component for migration)
'use client'

import { useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'

export function UserSetup() {
  const { user, dbUser, loading } = useAuth()
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<string | null>(null)

  const handleMigrateExistingTrades = async () => {
    if (!dbUser?.id) {
      setMigrationResult('❌ No database user found')
      return
    }

    setMigrating(true)
    setMigrationResult(null)

    try {
      // This is a one-time migration to assign existing trades to the current user
      const response = await fetch('/api/admin/migrate-trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': dbUser.id,
        },
        body: JSON.stringify({
          userId: dbUser.id,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMigrationResult(`✅ ${result.message}`)
      } else {
        setMigrationResult(`❌ ${result.error}`)
      }
    } catch (error) {
      setMigrationResult(`❌ Migration failed: ${error.message}`)
    } finally {
      setMigrating(false)
    }
  }

  if (loading) {
    return (
      <div className='p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
        <p className='text-blue-400'>Loading user data...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
        <p className='text-red-400'>Please sign in to continue</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* User Info */}
      <div className='p-4 bg-slate-800 border border-slate-600 rounded-lg'>
        <h3 className='text-lg font-semibold text-white mb-3'>User Information</h3>
        <div className='space-y-2 text-sm'>
          <p>
            <span className='text-gray-400'>Firebase UID:</span> <span className='text-white'>{user.uid}</span>
          </p>
          <p>
            <span className='text-gray-400'>Email:</span> <span className='text-white'>{user.email}</span>
          </p>
          <p>
            <span className='text-gray-400'>Database ID:</span>{' '}
            <span className='text-white'>{dbUser?.id || 'Not created'}</span>
          </p>
          <p>
            <span className='text-gray-400'>Status:</span>
            <span className={`ml-1 ${dbUser ? 'text-green-400' : 'text-yellow-400'}`}>
              {dbUser ? '✅ Database user exists' : '⚠️ Database user missing'}
            </span>
          </p>
        </div>
      </div>

      {/* Migration Tool */}
      {dbUser && (
        <div className='p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg'>
          <h3 className='text-lg font-semibold text-yellow-400 mb-3'>One-Time Migration</h3>
          <p className='text-gray-300 text-sm mb-4'>
            If you have existing trades that aren't associated with your user account, click below to migrate them. This
            should only be done once.
          </p>

          <button
            onClick={handleMigrateExistingTrades}
            disabled={migrating}
            className='px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors disabled:opacity-50'
          >
            {migrating ? 'Migrating...' : 'Migrate Existing Trades'}
          </button>

          {migrationResult && (
            <div className='mt-3 p-3 bg-slate-700 rounded-md'>
              <p className='text-sm'>{migrationResult}</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className='p-4 bg-slate-800 border border-slate-600 rounded-lg'>
        <h3 className='text-lg font-semibold text-white mb-3'>Next Steps</h3>
        <div className='space-y-2 text-sm text-gray-300'>
          <p>✅ Your authentication is working</p>
          {dbUser ? <p>✅ Database user account is set up</p> : <p>⚠️ Database user account needs to be created</p>}
          <p>🔄 All future trades will be automatically associated with your account</p>
          <p>📊 Dashboard and portfolio data will be user-specific</p>
        </div>
      </div>
    </div>
  )
}
