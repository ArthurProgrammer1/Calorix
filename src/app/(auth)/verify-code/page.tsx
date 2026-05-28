'use client'

import { useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'
import { updateUserPassword } from '@/lib/storage'

function VerifyContent() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get('email') ?? ''

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function handleDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  async function handleVerify() {
    const code = digits.join('')
    if (code.length < 6) { toast.error('Enter all 6 digits'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/send-otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (data.expired) { toast.error('Code expired — request a new one'); setLoading(false); return }
      if (!data.valid) { toast.error('Incorrect code'); setLoading(false); return }
      setVerified(true)
      toast.success('Code verified!')
    } catch {
      toast.error('Verification failed')
    }
    setLoading(false)
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    updateUserPassword(email, newPassword)
    toast.success('Password updated! You can now log in.')
    router.push('/login')
  }

  async function handleResend() {
    setLoading(true)
    try {
      const res = await fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (data.dev) toast.info('Dev mode: check the server terminal for your code')
      else toast.success('New code sent!')
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch { toast.error('Failed to resend') }
    setLoading(false)
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

      <Link href="/forgot-password" className="mb-6 flex items-center gap-2 text-sm text-[#9CA3AF] transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#22C55E]/15">
        <ShieldCheck className="h-7 w-7 text-[#22C55E]" />
      </div>

      {!verified ? (
        <>
          <h1 className="mb-2 text-3xl font-bold text-white">Check your email</h1>
          <p className="mb-2 text-[#9CA3AF]">We sent a 6-digit code to</p>
          <p className="mb-8 font-medium text-white">{email}</p>

          <div className="mb-6 flex justify-between gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input key={i} ref={el => { inputRefs.current[i] = el }}
                type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="h-14 w-full rounded-2xl border-2 border-[#2A2A3A] bg-[#1A1A24] text-center text-2xl font-bold text-white outline-none transition focus:border-[#22C55E]"
              />
            ))}
          </div>

          <button onClick={handleVerify} disabled={loading || digits.join('').length < 6}
            className="w-full rounded-xl bg-[#22C55E] py-3.5 text-base font-semibold text-black transition hover:bg-[#16a34a] disabled:opacity-60 mb-4">
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>

          <p className="text-center text-sm text-[#9CA3AF]">
            Didn&apos;t receive it?{' '}
            <button onClick={handleResend} disabled={loading} className="font-medium text-[#22C55E] hover:underline disabled:opacity-60">
              Resend code
            </button>
          </p>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-3xl font-bold text-white">New password</h1>
          <p className="mb-8 text-[#9CA3AF]">Choose a strong password for your account.</p>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#D1D5DB]">New Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                  placeholder="Min. 8 characters"
                  className="w-full rounded-xl border border-[#2A2A3A] bg-[#1A1A24] px-4 py-3 pr-12 text-white placeholder-[#6B7280] outline-none transition focus:border-[#22C55E]" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#D1D5DB]">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                placeholder="Repeat your password"
                className="w-full rounded-xl border border-[#2A2A3A] bg-[#1A1A24] px-4 py-3 text-white placeholder-[#6B7280] outline-none transition focus:border-[#22C55E]" />
            </div>
            <button type="submit"
              className="w-full rounded-xl bg-[#22C55E] py-3.5 text-base font-semibold text-black transition hover:bg-[#16a34a]">
              Set New Password
            </button>
          </form>
        </>
      )}
    </motion.div>
  )
}

export default function VerifyCodePage() {
  return <Suspense><VerifyContent /></Suspense>
}
