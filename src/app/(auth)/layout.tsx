import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--cx-bg)' }}>
      {/* Left panel */}
      <div className="hidden w-2/5 flex-col justify-between p-12 lg:flex"
        style={{ background: 'var(--cx-card)', borderRight: '1px solid var(--cx-border)' }}>
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
              <span className="text-sm font-bold text-black">C</span>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--cx-text)' }}>Calorix</span>
          </Link>
        </div>
        <div>
          <h2 className="mb-4 text-3xl font-bold" style={{ color: 'var(--cx-text)' }}>
            Track Smarter,<br />
            <span className="gradient-text">Live Healthier</span>
          </h2>
          <p className="mb-8" style={{ color: 'var(--cx-text2)' }}>Join thousands of people who have already hit their health goals with Calorix.</p>
          <div className="space-y-3">
            {['Personalised calorie targets', 'Macro tracking (protein, carbs, fat)', 'Beautiful progress charts', '100% free, no credit card'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-[#22C55E]" />
                <span style={{ color: 'var(--cx-text2)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--cx-text3)' }}>© 2026 Calorix</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  )
}
