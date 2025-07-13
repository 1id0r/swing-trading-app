// /src/app/watchlist/[ticker]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useWatchlistStore } from '@/stores/useWatchlistStore'
import { WatchlistChartView } from '@/components/watchlist/WatchlistChartView'

interface WatchlistItem {
  id: string
  ticker: string
  company: string
  logo?: string
}

export default function WatchlistChartPageRoute() {
  const router = useRouter()
  const params = useParams()
  const ticker = params.ticker as string

  const { findItemInFolders } = useWatchlistStore()
  const [watchlistItem, setWatchlistItem] = useState<WatchlistItem | null>(null)

  useEffect(() => {
    // Find the watchlist item for this ticker using the findItemInFolders method
    const result = findItemInFolders(ticker)
    const foundItem = result?.item

    if (foundItem) {
      setWatchlistItem(foundItem)
    } else {
      // If item not found, create a basic item with just the ticker
      // This handles cases where someone navigates directly to a ticker URL
      setWatchlistItem({
        id: ticker,
        ticker: ticker.toUpperCase(),
        company: `${ticker.toUpperCase()} Company`, // Fallback company name
      })
    }
  }, [ticker, findItemInFolders])

  const handleBack = () => {
    router.push('/portfolio') // Navigate back to portfolio page with watchlist tab
  }

  if (!watchlistItem) {
    return (
      <div className='min-h-screen bg-black text-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
          <p className='text-gray-400'>Loading chart...</p>
        </div>
      </div>
    )
  }

  return (
    <WatchlistChartView
      ticker={watchlistItem.ticker}
      company={watchlistItem.company}
      logo={watchlistItem.logo}
      onBack={handleBack}
    />
  )
}
