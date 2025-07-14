// /src/components/dashboard/MonthlyPnL.tsx - FIXED
import { useTradeStore } from '@/stores/useTradeStore'
import { useSettingsStore, settingsUtils } from '@/stores/useSettingsStore'

interface MonthlyData {
  month: string
  profit: number
  trades: number
}

export function MonthlyPnL() {
  const { trades, isLoading } = useTradeStore()
  const { settings } = useSettingsStore()

  // Calculate monthly data from real trades
  const calculateMonthlyData = (): MonthlyData[] => {
    if (!trades || trades.length === 0) return []

    const monthlyMap = new Map<string, { profit: number; trades: number }>()

    trades.forEach((trade) => {
      const date = new Date(trade.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      const monthLabel = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { profit: 0, trades: 0 })
      }

      const monthData = monthlyMap.get(monthKey)!
      monthData.trades += 1

      // Only add profit for sell trades (realized P&L) - FIX: Handle null/undefined values
      if (trade.action === 'SELL') {
        const netProfit = trade.netProfit || 0 // Default to 0 if null/undefined
        monthData.profit += netProfit
      }
    })

    // Convert to array and sort by date
    return Array.from(monthlyMap.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-').map(Number)
        const date = new Date(year, month)
        return {
          month: date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          profit: data.profit || 0, // FIX: Ensure profit is never undefined
          trades: data.trades || 0, // FIX: Ensure trades is never undefined
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateB.getTime() - dateA.getTime() // Most recent first
      })
      .slice(0, 6) // Show last 6 months
  }

  const monthlyData = calculateMonthlyData()

  // FIX: Safe currency formatting function
  const formatCurrency = (amount: number): string => {
    // Ensure amount is a valid number
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0

    if (settings && settings.displayCurrency) {
      try {
        return settingsUtils.formatCurrency(safeAmount, settings.displayCurrency)
      } catch (error) {
        console.warn('Currency formatting error:', error)
        return `$${safeAmount.toFixed(2)}`
      }
    }
    return `$${safeAmount.toFixed(2)}`
  }

  if (isLoading) {
    return (
      <div className='theme-card'>
        <div className='p-4 border-b border-gray-700'>
          <div className='h-6 bg-gray-700 rounded mb-2 w-1/3'></div>
          <div className='h-4 bg-gray-700 rounded w-1/2'></div>
        </div>
        <div className='p-4 space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='flex items-center justify-between p-3 bg-gray-900/50 rounded-lg animate-pulse'>
              <div className='space-y-1'>
                <div className='h-4 bg-gray-700 rounded w-20'></div>
                <div className='h-3 bg-gray-700 rounded w-16'></div>
              </div>
              <div className='text-right space-y-1'>
                <div className='h-4 bg-gray-700 rounded w-16'></div>
                <div className='h-3 bg-gray-700 rounded w-12'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='theme-card'>
      <div className='p-4 border-b border-gray-700'>
        <h3 className='text-lg font-semibold theme-text-primary'>Monthly Summary</h3>
        <p className='text-sm theme-text-secondary'>Track your trading performance</p>
      </div>

      <div className='p-4'>
        {monthlyData.length === 0 ? (
          <div className='text-center py-8'>
            <div className='theme-text-secondary mb-2'>No trading data yet</div>
            <div className='text-sm theme-text-secondary'>Start adding trades to see monthly performance</div>
          </div>
        ) : (
          <div className='space-y-3'>
            {monthlyData.map((month: MonthlyData, index: number) => {
              // FIX: Safe value extraction with defaults
              const profit = month.profit || 0
              const trades = month.trades || 0
              const monthName = month.month || 'Unknown'

              return (
                <div
                  key={`${monthName}-${index}`} // FIX: Better key generation
                  className='flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors'
                >
                  <div>
                    <div className='theme-text-primary font-medium'>{monthName}</div>
                    <div className='text-sm theme-text-secondary'>{trades} trades</div>
                  </div>
                  <div className='text-right'>
                    <div
                      className={`font-bold ${
                        profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'theme-text-secondary'
                      }`}
                    >
                      {profit > 0 ? '+' : ''}
                      {formatCurrency(profit)}
                    </div>
                    <div className='text-sm theme-text-secondary'>Net P&L</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
