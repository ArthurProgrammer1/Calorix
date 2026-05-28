'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { getAccountByEmail, saveUser } from '@/lib/storage'

const inputStyle: React.CSSProperties = {
  background: 'var(--cx-inner)', border: '1px solid var(--cx-border)',
  color: 'var(--cx-text)', width: '100%', borderRadius: 12, padding: '12px 16px', outline: 'none',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const account = getAccountByEmail(email)
    if (!account) { toast.error('No account found with this email'); setLoading(false); return }
    if (account.password && account.password !== password) { toast.error('Incorrect password'); setLoading(false); return }
    saveUser(account)
    toast.success(`Welcome back, ${account.name.split(' ')[0]}!`)
    router.push('/dashboard')
  }

  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: 'var(--cx-label)' }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
      <div className="mb-8 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
            <span className="text-sm font-bold text-black">C</span>
          </div>
          <span className="text-lg font-bold" style={{ color: 'var(--cx-text)' }}>Calorix</span>
        </Link>
      </div>
      <h1 className="mb-2 text-3xl font-bold" style={{ color: 'var(--cx-text)' }}>Welcome back</h1>
      <p className="mb-8" style={{ color: 'var(--cx-text2)' }}>Log in to continue your health journey</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label style={labelStyle}>Password</label>
            <Link href="/forgot-password" className="text-xs text-[#22C55E] hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Your password"
              style={{ ...inputStyle, paddingRight: 48 }} />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--cx-text3)' }}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full rounded-xl py-3.5 text-base font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm" style={{ color: 'var(--cx-text2)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-[#22C55E] hover:underline">Sign up free</Link>
      </p>
    </motion.div>
  )
}
