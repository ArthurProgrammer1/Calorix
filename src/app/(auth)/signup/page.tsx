'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { cloudSignUp } from '@/lib/cloud'

const inputStyle: React.CSSProperties = {
  background: 'var(--cx-inner)', border: '1px solid var(--cx-border)',
  color: 'var(--cx-text)', width: '100%', borderRadius: 12,
  padding: '12px 16px', outline: 'none',
}

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    const normEmail = form.email.trim().toLowerCase()
    try {
      await cloudSignUp(normEmail, form.password)
      localStorage.setItem('calorix_user_partial', JSON.stringify({
        name: form.name, email: normEmail, password: form.password,
        createdAt: new Date().toISOString(),
      }))
      router.push('/onboarding')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed')
      setLoading(false)
    }
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
      <h1 className="mb-2 text-3xl font-bold" style={{ color: 'var(--cx-text)' }}>Create your account</h1>
      <p className="mb-8" style={{ color: 'var(--cx-text2)' }}>Start your health journey today — completely free</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label style={labelStyle}>Full Name</label>
          <input value={form.name} onChange={e => update('name', e.target.value)} required placeholder="Alex Smith" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="you@example.com" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required placeholder="Min. 8 characters"
              style={{ ...inputStyle, paddingRight: 48 }} />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--cx-text3)' }}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Confirm Password</label>
          <input type="password" value={form.confirm} onChange={e => update('confirm', e.target.value)} required placeholder="Repeat your password" style={inputStyle} />
        </div>
        <button type="submit" disabled={loading}
          className="w-full rounded-xl py-3.5 text-base font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm" style={{ color: 'var(--cx-text2)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[#22C55E] hover:underline">Log in</Link>
      </p>
    </motion.div>
  )
}
