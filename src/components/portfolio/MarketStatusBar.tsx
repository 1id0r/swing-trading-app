// components/portfolio/MarketStatusBar.tsx
import { Clock } from 'lucide-react'
import { MarketHoursService } from '@/lib/marketHours'

interface MarketStatusBarProps {
  marketStatus: any
}

export function MarketStatusBar({ marketStatus }: MarketStatusBarProps) {
  if (!marketStatus) return null

  return (
    <div className='flex items-center justify-center'>
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
          marketStatus.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}
      >
        <Clock className='w-3 h-3' />
        <span>{MarketHoursService.getMarketStatusMessage(marketStatus)}</span>
      </div>
    </div>
  )
}
