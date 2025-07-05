// components/layout/BottomNavigation.tsx
'use client'

import { TrendingUp, History, Plus, PieChart, Settings } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

const navItems = [
  { id: 'dashboard', icon: TrendingUp, label: 'Dashboard', href: '/dashboard' },
  { id: 'history', icon: History, label: 'History', href: '/history' },
  { id: 'add', icon: Plus, label: 'Add', href: '/add-trade' },
  { id: 'portfolio', icon: PieChart, label: 'Portfolio', href: '/portfolio' },
  { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
]

export function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (href: string, id: string) => {
    if (id === 'add') {
      // Special handling for Add Trade - could be a modal or full page
      router.push(href)
    } else {
      router.push(href)
    }
  }

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700'>
      <div className='max-w-md mx-auto'>
        <div className='flex justify-around py-2'>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const isAddButton = item.id === 'add'

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href, item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px] ${
                  isAddButton
                    ? 'text-blue-400 hover:text-blue-300'
                    : isActive
                    ? 'text-blue-400'
                    : 'theme-text-secondary   hover:theme-text-primary  '
                }`}
              >
                <item.icon className={`w-5 h-5 ${isAddButton ? 'w-6 h-6' : ''}`} />
                <span className='text-xs font-medium'>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
