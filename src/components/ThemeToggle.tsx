'use client'

import { useTheme } from '@/lib/theme'
import { Palette } from 'lucide-react'

export function ThemeToggle() {
  const { toggle, isDark } = useTheme()
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
      style={{
        background: 'var(--cx-card)',
        border: '1px solid var(--cx-border)',
        color: isDark ? '#22C55E' : '#8B5CF6',
        boxShadow: isDark
          ? '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(34,197,94,0.1)'
          : '0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(139,92,246,0.15)',
      }}
    >
      <Palette className="h-4 w-4" />
    </button>
  )
}
