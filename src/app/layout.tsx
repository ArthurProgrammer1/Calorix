import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Calorix — Track Smarter, Live Healthier',
  description: 'AI-powered calorie tracking to help you reach your health goals faster.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      {/* Prevent theme flash before hydration */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('calorix_theme')||'dark';if(t==='light')document.documentElement.classList.add('light')})()` }} />
      </head>
      <body className="min-h-screen antialiased" style={{ background: 'var(--cx-bg)', color: 'var(--cx-text)' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
