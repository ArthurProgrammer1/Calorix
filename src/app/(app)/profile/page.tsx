'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getUser, clearUser } from '@/lib/storage'
import { calculateBMI, calculateBMR, calculateTDEE } from '@/lib/calculations'
import { useTheme } from '@/lib/theme'
import type { UserProfile } from '@/types'
import { Settings, LogOut, Sun, Moon } from 'lucide-react'

const goalLabels: Record<string, string> = { lose: 'Lose Weight', maintain: 'Maintain Weight', gain: 'Gain Weight' }
const activityLabels: Record<string, string> = { sedentary: 'Sedentary', light: 'Lightly Active', moderate: 'Moderately Active', active: 'Very Active', athlete: 'Athlete' }

const s = {
  card: { background: 'var(--cx-card)', border: '1px solid var(--cx-border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' } as React.CSSProperties,
  inner: { background: 'var(--cx-inner)', borderRadius: 12, padding: '12px 16px' } as React.CSSProperties,
  text: { color: 'var(--cx-text)' } as React.CSSProperties,
  text2: { color: 'var(--cx-text2)' } as React.CSSProperties,
  text3: { color: 'var(--cx-text3)' } as React.CSSProperties,
  label: { color: 'var(--cx-label)' } as React.CSSProperties,
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const { isDark, toggle } = useTheme()

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push('/onboarding'); return }
    setUser(u)
  }, [router])

  function handleLogout() { clearUser(); router.push('/') }

  if (!user) return null

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const bmi = calculateBMI(user.weight, user.height)
  const bmr = calculateBMR(user.weight, user.height, user.age, user.gender)
  const tdee = calculateTDEE(bmr, user.activityLevel)

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-2xl font-bold" style={s.text}>Profile</motion.h1>

      {/* Avatar card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center gap-5" style={s.card}>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-black"
          style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16a34a 100%)' }}>
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold" style={s.text}>{user.name}</h2>
          <p style={s.text2}>{user.email}</p>
          <span className="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-medium text-[#22C55E]"
            style={{ background: 'rgba(34,197,94,0.12)' }}>
            {goalLabels[user.goal]}
          </span>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5" style={s.card}>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={s.text2}>Your Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Age', value: `${user.age} years` },
            { label: 'Height', value: `${user.height} cm` },
            { label: 'Weight', value: `${user.weight} kg` },
            { label: 'BMI', value: String(bmi) },
            { label: 'Activity', value: activityLabels[user.activityLevel] },
            { label: 'Goal Speed', value: user.goalSpeed },
          ].map(({ label, value }) => (
            <div key={label} style={s.inner}>
              <div className="text-xs" style={s.text3}>{label}</div>
              <div className="font-semibold capitalize" style={s.text}>{value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Calorie budget */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5" style={s.card}>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={s.text2}>Calorie Budget</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <div className="text-xl font-bold text-[#F97316]">{bmr.toLocaleString()}</div>
            <div className="text-xs font-medium text-[#F97316]/80 mt-0.5">BMR — body at rest</div>
            <div className="text-[10px] mt-1" style={s.text3}>Calories burned doing nothing</div>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div className="text-xl font-bold text-[#3B82F6]">{tdee.toLocaleString()}</div>
            <div className="text-xs font-medium text-[#3B82F6]/80 mt-0.5">TDEE — total burn</div>
            <div className="text-[10px] mt-1" style={s.text3}>Includes your activity level</div>
          </div>
          <div className="rounded-2xl p-4 text-center col-span-1 sm:col-span-1" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div className="text-xl font-bold text-[#22C55E]">{user.calorieTarget.toLocaleString()}</div>
            <div className="text-xs font-medium text-[#22C55E]/80 mt-0.5">Your target</div>
            <div className="text-[10px] mt-1" style={s.text3}>Adjusted for your goal</div>
          </div>
        </div>
      </motion.div>

      {/* Daily targets */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-5" style={s.card}>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={s.text2}>Daily Targets</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl col-span-2 px-4 py-3 text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div className="text-2xl font-bold text-[#22C55E]">{user.calorieTarget.toLocaleString()} kcal</div>
            <div className="text-xs" style={s.text3}>Calories</div>
          </div>
          {[
            { label: 'Protein', value: `${user.proteinTarget}g`, color: '#3B82F6' },
            { label: 'Carbs', value: `${user.carbsTarget}g`, color: '#F59E0B' },
            { label: 'Fat', value: `${user.fatTarget}g`, color: '#A855F7' },
            { label: 'Water', value: `${user.waterTarget}L`, color: '#06B6D4' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl px-4 py-3" style={s.inner}>
              <div className="font-bold" style={{ color }}>{value}</div>
              <div className="text-xs" style={s.text3}>{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
        <button onClick={toggle}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold transition"
          style={{ border: '1px solid var(--cx-border)', background: 'var(--cx-card)', color: 'var(--cx-text)' }}>
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          Switch to {isDark ? 'Light' : 'Dark'} Mode
        </button>
        <button onClick={() => router.push('/onboarding')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold transition"
          style={{ border: '1px solid var(--cx-border)', background: 'var(--cx-card)', color: 'var(--cx-text)' }}>
          <Settings className="h-5 w-5" /> Update Goals
        </button>
        <button onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold transition hover:bg-red-500/20"
          style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#F87171' }}>
          <LogOut className="h-5 w-5" /> Log Out
        </button>
      </motion.div>
    </div>
  )
}
