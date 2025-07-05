// components/dashboard/QuickActions.tsx
import { Plus, History, TrendingUp, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function QuickActions() {
  const router = useRouter()

  const actions = [
    {
      label: 'Add Trade',
      icon: Plus,
      href: '/add-trade',
      variant: 'primary' as const,
    },
    {
      label: 'View History',
      icon: History,
      href: '/history',
      variant: 'secondary' as const,
    },
    {
      label: 'Portfolio',
      icon: TrendingUp,
      href: '/portfolio',
      variant: 'secondary' as const,
    },
    {
      label: 'Reports',
      icon: FileText,
      href: '/reports',
      variant: 'secondary' as const,
    },
  ]

  return (
    <div className='grid grid-cols-2 gap-4'>
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => router.push(action.href)}
          className={` theme-button-primary flex items-center gap-3 p-4   transition-colors ${
            action.variant === 'primary'
              ? 'bg-blue-600 hover:bg-blue-700 theme-text-primary  '
              : 'theme-card hover:bg-gray-700/50 theme-text-primary     '
          }`}
        >
          <action.icon className='w-5 h-5' />
          <span className='font-medium'>{action.label}</span>
        </button>
      ))}
    </div>
  )
}
