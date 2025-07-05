// app/dashboard/page.tsx (Updated for Database)
'use client'

import { useEffect } from 'react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { StatsCards, MonthlyPnL, QuickActions } from '@/components/dashboard'
import { useTradeStore } from '@/stores/useTradeStore'

export default function DashboardPage() {
  const { fetchDashboardData, fetchPositions, fetchTrades, isLoadingDashboard, error } = useTradeStore()

  useEffect(() => {
    // Load all dashboard data when component mounts
    const loadData = async () => {
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchPositions(true), // Update prices
          fetchTrades({ limit: 10 }), // Get recent trades
        ])
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      }
    }

    loadData()
  }, [fetchDashboardData, fetchPositions, fetchTrades])

  return (
    <MobileLayout title='Trading Portfolio' subtitle='Track your swing trades'>
      <div className='space-y-6'>
        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 rounded-lg p-3'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingDashboard && (
          <div className='bg-gray-800/50 rounded-xl p-8 border border-gray-700'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
              <p className='text-gray-400'>Loading dashboard...</p>
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
