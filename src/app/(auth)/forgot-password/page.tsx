'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Mail, ArrowLeft } from 'lucide-react'
import { getAccountByEmail } from '@/lib/storage'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const account = getAccountByEmail(email)
    if (!account) {
      toast.error('No account found with this email')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) { toast.error('Failed to send code. Please try again.'); setLoading(false); return }

      if (data.dev) {
        toast.info('Dev mode: check the server terminal for your code')
      } else {
        toast.success('Code sent! Check your email')
      }
      router.push(`/verify-code?email=${encodeURIComponent(email)}`)
    } catch {
      toast.error('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="w-full max-w-md">
      <div className="mb-8 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#22C55E]">
            <span className="text-sm font-bold text-black">C</span>
          </div>
          <span className="text-lg font-bold text-white">Calorix</span>
        </Link>
      </div>

      <Link href="/login" className="mb-6 flex items-center gap-2 text-sm text-[#9CA3AF] transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#22C55E]/15">
        <Mail className="h-7 w-7 text-[#22C55E]" />
      </div>

      <h1 className="mb-2 text-3xl font-bold text-white">Forgot password?</h1>
      <p className="mb-8 text-[#9CA3AF]">Enter your email and we&apos;ll send you a 6-digit reset code.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#D1D5DB]">Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
            className="w-full rounded-xl border border-[#2A2A3A] bg-[#1A1A24] px-4 py-3 text-white placeholder-[#6B7280] outline-none transition focus:border-[#22C55E]" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-[#22C55E] py-3.5 text-base font-semibold text-black transition hover:bg-[#16a34a] disabled:opacity-60">
          {loading ? 'Sending…' : 'Send Reset Code'}
        </button>
      </form>
    </motion.div>
  )
}
