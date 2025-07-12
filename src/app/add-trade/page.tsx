// app/add-trade/page.tsx - FIXED VERSION (with settings integration)
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AddTradeForm } from '@/components/trade/AddTradeForm'
import { useTradeStore } from '@/stores/useTradeStore'
import { useSettingsStore } from '@/stores/useSettingsStore' // ✅ Import settings store

function AddTradePageContent() {
  const router = useRouter()
  const { addTrade, isLoading } = useTradeStore()
  const { settings, fetchSettings } = useSettingsStore() // ✅ Get settings
  const [error, setError] = useState<string | null>(null)

  // ✅ Fetch settings on component mount
  useEffect(() => {
    if (!settings) {
      fetchSettings()
    }
  }, [settings, fetchSettings])

  const handleSubmit = async (data: any) => {
    try {
      setError(null)

      // Prepare trade data for API
      const tradeData = {
        ticker: data.ticker,
        company: data.company,
        logo: data.logo || '',
        action: data.action,
        shares: data.shares,
        pricePerShare: data.pricePerShare,
        fee: data.fee || 0,
        currency: data.currency,
        date: data.date,
      }

      console.log('🚀 Adding trade with data:', tradeData)
      await addTrade(tradeData)

      // Show success and navigate back
      router.push('/dashboard')
    } catch (error) {
      console.error('Error adding trade:', error)
      setError(error instanceof Error ? error.message : 'Failed to add trade')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // ✅ Use defaultFee from settings, with fallback to 9.99
  const defaultCommission = settings?.defaultFee ?? 9.99

  console.log('🔧 Add Trade Page - Default commission from settings:', defaultCommission)

  return (
    <MobileLayout title='Add Trade' showBackButton onBackClick={handleCancel}>
      <div className='space-y-4'>
        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 rounded-lg p-3'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className='bg-blue-500/20 border border-blue-500 rounded-lg p-3'>
            <p className='text-blue-400 text-sm'>Adding trade...</p>
          </div>
        )}

        {/* ✅ FIXED: Pass defaultCommission from settings */}
        <AddTradeForm onSubmit={handleSubmit} onCancel={handleCancel} defaultCommission={defaultCommission} />
      </div>
    </MobileLayout>
  )
}

// ✅ Wrap in ProtectedRoute
export default function AddTradePage() {
  return (
    <ProtectedRoute>
      <AddTradePageContent />
    </ProtectedRoute>
  )
}
