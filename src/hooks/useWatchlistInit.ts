// Create this file: /src/hooks/useWatchlistInit.ts
import { useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useWatchlistStore } from '@/stores/useWatchlistStore'

export function useWatchlistInit() {
  const { user, loading: authLoading } = useAuth()
  const { fetchWatchlist, loading: watchlistLoading, error } = useWatchlistStore()

  useEffect(() => {
    // Only fetch watchlist when user is authenticated and not loading
    if (!authLoading && user) {
      console.log('👥 User authenticated, fetching watchlist...')
      fetchWatchlist().catch(console.error)
    }
  }, [user, authLoading, fetchWatchlist])

  return {
    loading: authLoading || watchlistLoading,
    error,
    user
  }
}