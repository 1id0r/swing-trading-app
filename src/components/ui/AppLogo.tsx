// /src/components/ui/AppLogo.tsx
'use client'

import Image from 'next/image'

interface AppLogoProps {
  size?: number
  className?: string
  variant?: 'default' | 'white' | 'blue'
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 24, className = '', variant = 'default' }) => {
  // Your logo path in the public folder
  const logoSrc = '/logo.svg'

  // Apply color filters based on variant
  const getFilterClass = () => {
    switch (variant) {
      case 'white':
        return 'brightness-0 invert' // Makes black SVG white
      case 'blue':
        return 'brightness-0 saturate-100 invert-[.3] sepia-[1] saturate-[5] hue-rotate-[220deg]' // Makes it blue
      default:
        return ''
    }
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={logoSrc}
        alt='Trading App Logo'
        width={size}
        height={size}
        className={`${getFilterClass()} transition-all duration-200`}
        priority
      />
    </div>
  )
}
