// components/ui/InteractiveDock.tsx
'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { TrendingUp, History, Plus, PieChart, Settings } from 'lucide-react'

type IconComponentType = React.ElementType<{ className?: string }>

export interface DockMenuItem {
  label: string
  icon: IconComponentType
  href: string
  id: string
}

export interface InteractiveDockProps {
  items?: DockMenuItem[]
  accentColor?: string
}

const defaultItems: DockMenuItem[] = [
  { label: 'Dashboard', icon: TrendingUp, href: '/dashboard', id: 'dashboard' },
  { label: 'History', icon: History, href: '/history', id: 'history' },
  { label: 'Add Trade', icon: Plus, href: '/add-trade', id: 'add' },
  { label: 'Portfolio', icon: PieChart, href: '/portfolio', id: 'portfolio' },
  { label: 'Settings', icon: Settings, href: '/settings', id: 'settings' },
]

const defaultAccentColor = '#3b82f6' // Blue color

export const InteractiveDock: React.FC<InteractiveDockProps> = ({ items, accentColor }) => {
  const router = useRouter()
  const pathname = usePathname()

  const finalItems = useMemo(() => {
    const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5
    if (!isValid) {
      return defaultItems
    }
    return items
  }, [items])

  // Find active index based on current pathname
  const getActiveIndex = () => {
    const index = finalItems.findIndex((item) => pathname === item.href)
    return index >= 0 ? index : 0
  }

  const [activeIndex, setActiveIndex] = useState(getActiveIndex)

  // Update active index when pathname changes
  useEffect(() => {
    setActiveIndex(getActiveIndex())
  }, [pathname, finalItems])

  const textRefs = useRef<(HTMLElement | null)[]>([])
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex]
      const activeTextElement = textRefs.current[activeIndex]
      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`)
      }
    }

    setLineWidth()
    window.addEventListener('resize', setLineWidth)
    return () => {
      window.removeEventListener('resize', setLineWidth)
    }
  }, [activeIndex, finalItems])

  const handleItemClick = (index: number, href: string) => {
    setActiveIndex(index)
    router.push(href)
  }

  const navStyle = useMemo(() => {
    const activeColor = accentColor || defaultAccentColor
    return {
      '--component-active-color': activeColor,
      '--component-active-color-default': activeColor,
    } as React.CSSProperties
  }, [accentColor])

  return (
    <div className='fixed bottom-0 left-0 right-0 z-50'>
      <div className='max-w-md mx-auto'>
        <nav className='dock-menu' role='navigation' style={navStyle}>
          {finalItems.map((item, index) => {
            const isActive = index === activeIndex
            const IconComponent = item.icon

            return (
              <button
                key={item.id}
                className={`dock-menu__item ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(index, item.href)}
                ref={(el) => (itemRefs.current[index] = el)}
                style={{ '--lineWidth': '0px' } as React.CSSProperties}
                data-add-trade={item.id === 'add' ? 'true' : undefined}
              >
                <div className='dock-menu__icon'>
                  <IconComponent className='icon' />
                </div>
                <strong
                  className={`dock-menu__text ${isActive ? 'active' : ''}`}
                  ref={(el) => (textRefs.current[index] = el)}
                >
                  {item.label}
                </strong>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
