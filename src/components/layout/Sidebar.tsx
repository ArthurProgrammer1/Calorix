'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, PlusCircle, TrendingUp, User, LogOut, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clearUser } from '@/lib/storage'
import { useTheme } from '@/lib/theme'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/log', icon: PlusCircle, label: 'Log Food' },
  { href: '/progress', icon: TrendingUp, label: 'Progress' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isDark, toggle } = useTheme()

  function handleLogout() { clearUser(); router.push('/') }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-60 flex-col"
      style={{
        background: `linear-gradient(180deg, var(--cx-sidebar-from) 0%, var(--cx-sidebar-to) 100%)`,
        borderRight: '1px solid var(--cx-border)',
      }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: '1px solid var(--cx-border)' }}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glow-green-sm"
          style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16a34a 100%)' }}>
          <span className="text-sm font-bold text-black">C</span>
        </div>
        <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--cx-text)' }}>Calorix</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={cn('relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200')}
              style={active ? {
                color: '#22C55E',
                background: 'linear-gradient(90deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 100%)',
                boxShadow: 'inset 2px 0 0 #22C55E',
              } : {
                color: 'var(--cx-text3)',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--cx-text2)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--cx-text3)' }}
            >
              <Icon style={{ width: 18, height: 18 }} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#22C55E]" style={{ boxShadow: '0 0 6px #22C55E' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Theme toggle + logout */}
      <div className="px-3 pb-6 space-y-1" style={{ borderTop: '1px solid var(--cx-border)', paddingTop: 16 }}>
        <button onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
          style={{ color: 'var(--cx-text3)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--cx-text)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--cx-text3)'}
        >
          {isDark
            ? <Sun style={{ width: 18, height: 18 }} />
            : <Moon style={{ width: 18, height: 18 }} />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
          style={{ color: 'var(--cx-text3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--cx-text3)'; (e.currentTarget as HTMLElement).style.background = '' }}
        >
          <LogOut style={{ width: 18, height: 18 }} /> Log Out
        </button>
      </div>
    </aside>
  )
}
