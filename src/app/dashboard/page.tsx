// app/dashboard/page.tsx - With Real-time Updates
'use client'

import { useEffect, useState } from 'react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { StatsCards, MonthlyPnL, QuickActions } from '@/components/dashboard'
import { useTradeStore } from '@/stores/useTradeStore'
import { useAuth } from '@/app/contexts/AuthContext'

export default function DashboardPage() {
  const { fetchDashboardData, fetchPositions, fetchTrades, isLoadingDashboard, error } = useTradeStore()
  const { dbUserId, loading: authLoading } = useAuth()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateCount, setUpdateCount] = useState(0)

  useEffect(() => {
    // Only load data when we have a user ID and auth is not loading
    if (!authLoading && dbUserId) {
      console.log('🚀 Dashboard: Loading data for user:', dbUserId)

      const loadData = async () => {
        try {
          console.log('📊 Loading dashboard data...')
          await fetchDashboardData()

          console.log('📈 Loading positions with price updates...')
          await fetchPositions(true) // Update prices

          console.log('📋 Loading recent trades...')
          await fetchTrades({ limit: 10 })

          console.log('✅ All dashboard data loaded successfully')
          setLastUpdate(new Date())
        } catch (error) {
          console.error('❌ Error loading dashboard data:', error)
        }
      }

      loadData()
    }
  }, [fetchDashboardData, fetchPositions, fetchTrades, dbUserId, authLoading])

  // Real-time price updates every 30 seconds
  useEffect(() => {
    if (!authLoading && dbUserId) {
      console.log('⏰ Setting up real-time price updates...')

      const interval = setInterval(async () => {
        try {
          console.log('🔄 Auto-updating prices...')
          await fetchPositions(true) // Update prices
          setLastUpdate(new Date())
          setUpdateCount((prev) => prev + 1)
          console.log('✅ Prices updated successfully')
        } catch (error) {
          console.error('❌ Error in auto-update:', error)
        }
      }, 30000) // 30 seconds

      return () => {
        console.log('🛑 Cleaning up price update interval')
        clearInterval(interval)
      }
    }
  }, [dbUserId, authLoading, fetchPositions])

  // Show loading while authentication is in progress
  if (authLoading) {
    return (
      <MobileLayout title='Trading Portfolio' subtitle='Loading your account...'>
        <div className='theme-card p-8'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
            <p className='theme-text-secondary'>Setting up your account...</p>
          </div>
        </div>
      </MobileLayout>
    )
  }

  // Show error if no user ID
  if (!dbUserId) {
    return (
      <MobileLayout title='Trading Portfolio' subtitle='Authentication Error'>
        <div className='theme-card p-8'>
          <div className='text-center'>
            <p className='theme-text-primary mb-2'>Unable to load your account</p>
            <p className='theme-text-secondary text-sm'>Please try refreshing the page</p>
            <button onClick={() => window.location.reload()} className='theme-button-primary mt-4'>
              Refresh Page
            </button>
          </div>
        </div>
      </MobileLayout>
    )
  }

  const handleManualRefresh = async () => {
    try {
      console.log('🔄 Manual refresh triggered')
      await fetchPositions(true)
      setLastUpdate(new Date())
      console.log('✅ Manual refresh completed')
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
    }
  }

  return (
    <MobileLayout title='Trading Portfolio' subtitle='Track your swing trades'>
      <div className='space-y-6'>
        {/* Real-time status indicator */}
        <div className='flex items-center justify-between text-xs theme-text-secondary'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
            <span>Live Updates</span>
          </div>
          <div className='flex items-center gap-2'>
            {lastUpdate && <span>Updated: {lastUpdate.toLocaleTimeString()}</span>}
            <button
              onClick={handleManualRefresh}
              className='px-2 py-1 rounded text-xs bg-blue-500/20 hover:bg-blue-500/40 transition-colors'
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 rounded-lg p-3'>
            <p className='text-red-400 text-sm font-medium'>{error}</p>
            <button onClick={() => window.location.reload()} className='text-red-300 text-xs underline mt-1'>
              Refresh to try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoadingDashboard && (
          <div className='theme-card p-8'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
              <p className='theme-text-secondary'>Loading dashboard...</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoadingDashboard && (
          <>
            <StatsCards />
            <MonthlyPnL />
            <QuickActions />
          </>
        )}
      </div>
    </MobileLayout>
  )
}
