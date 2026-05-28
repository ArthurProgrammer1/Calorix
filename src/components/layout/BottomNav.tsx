'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusCircle, TrendingUp, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/log', icon: PlusCircle, label: 'Log', big: true },
  { href: '/progress', icon: TrendingUp, label: 'Progress' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass"
      style={{ borderTop: '1px solid var(--cx-border)' }}>
      <div className="flex items-center justify-around px-2 py-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        {navItems.map(({ href, icon: Icon, label, big }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 px-4 py-1 transition-all duration-200"
              style={{ color: active ? '#22C55E' : 'var(--cx-text3)' }}>
              {big ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl glow-green-sm transition-transform active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16a34a 100%)' }}>
                  <Icon className="h-5 w-5 text-black" strokeWidth={2.5} />
                </div>
              ) : (
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200')}
                  style={active ? { background: 'rgba(34,197,94,0.1)' } : {}}>
                  <Icon style={{ width: 18, height: 18 }} strokeWidth={active ? 2.5 : 1.8} />
                </div>
              )}
              <span className={cn('text-[10px] font-medium tracking-wide', big && 'opacity-70')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
