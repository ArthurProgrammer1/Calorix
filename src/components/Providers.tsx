'use client'

import { ThemeProvider, useTheme } from '@/lib/theme'
import { Toaster } from 'sonner'

function TheToaster() {
  const { theme } = useTheme()
  return (
    <Toaster
      theme={theme}
      richColors
      position="top-center"
      toastOptions={{
        style: {
          background: 'var(--cx-toaster-bg)',
          border: '1px solid var(--cx-toaster-border)',
          color: 'var(--cx-text)',
        },
      }}
    />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <TheToaster />
    </ThemeProvider>
  )
}
