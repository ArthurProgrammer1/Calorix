import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--cx-bg)' }}>
      <ThemeToggle />
      <div className="hidden md:block"><Sidebar /></div>
      <main className="pb-24 md:ml-60 md:pb-8">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
          {children}
        </div>
      </main>
      <div className="md:hidden"><BottomNav /></div>
    </div>
  )
}
