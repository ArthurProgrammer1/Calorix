'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { saveUser, getUser, getAccountByEmail } from '@/lib/storage'
import { cloudSaveProfile } from '@/lib/cloud'
import { calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros, calculateWaterTarget, calculateBMI } from '@/lib/calculations'
import type { Gender, ActivityLevel, Goal, GoalSpeed, UserProfile } from '@/types'

type StepData = {
  name: string; email: string; password: string; age: string; gender: Gender | null
  height: string; weight: string; activity: ActivityLevel | null
  goal: Goal | null; speed: GoalSpeed | null
}

const activities: { value: ActivityLevel; emoji: string; label: string; desc: string }[] = [
  { value: 'sedentary', emoji: '🪑', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', emoji: '🚶', label: 'Lightly Active', desc: 'Light exercise 1–3 days/week' },
  { value: 'moderate', emoji: '🏃', label: 'Moderately Active', desc: 'Moderate exercise 3–5 days/week' },
  { value: 'active', emoji: '💪', label: 'Very Active', desc: 'Hard exercise 6–7 days/week' },
  { value: 'athlete', emoji: '🏋️', label: 'Athlete', desc: 'Very hard exercise, physical job' },
]

const goals: { value: Goal; emoji: string; label: string; desc: string }[] = [
  { value: 'lose', emoji: '🔥', label: 'Lose Weight', desc: 'Reduce body fat and slim down' },
  { value: 'maintain', emoji: '⚖️', label: 'Maintain Weight', desc: 'Keep your current weight steady' },
  { value: 'gain', emoji: '💪', label: 'Gain Weight', desc: 'Build muscle and add mass' },
]

const speeds: { value: GoalSpeed; emoji: string; label: string; desc: string; adj: string }[] = [
  { value: 'mild', emoji: '🌱', label: 'Mild', desc: 'Slow, sustainable progress', adj: '±300 kcal' },
  { value: 'moderate', emoji: '⚡', label: 'Moderate', desc: 'Steady, effective results', adj: '±500 kcal' },
  { value: 'aggressive', emoji: '🚀', label: 'Aggressive', desc: 'Fast results, needs discipline', adj: '±750 kcal' },
]

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
}

const s = {
  card: { background: 'var(--cx-card)', border: '1px solid var(--cx-border)', borderRadius: 24 } as React.CSSProperties,
  input: { background: 'var(--cx-inner)', border: '1px solid var(--cx-border)', color: 'var(--cx-text)', width: '100%', borderRadius: 12, padding: '12px 16px', outline: 'none' } as React.CSSProperties,
  text: { color: 'var(--cx-text)' } as React.CSSProperties,
  text2: { color: 'var(--cx-text2)' } as React.CSSProperties,
  label: { color: 'var(--cx-label)', display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 } as React.CSSProperties,
}

function OptionCard({ selected, onClick, emoji, label, desc, right }: { selected: boolean; onClick: () => void; emoji: string; label: string; desc?: string; right?: string }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all"
      style={{
        background: selected ? 'rgba(34,197,94,0.08)' : 'var(--cx-inner)',
        border: `2px solid ${selected ? '#22C55E' : 'var(--cx-border)'}`,
      }}>
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1">
        <p className="font-semibold" style={{ color: selected ? '#22C55E' : 'var(--cx-text)' }}>{label}</p>
        {desc && <p className="text-sm" style={s.text2}>{desc}</p>}
      </div>
      {right && <span className="text-sm font-medium" style={s.text2}>{right}</span>}
    </button>
  )
}

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const duration = 1500
    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      setDisplay(Math.round(progress * value))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  return <>{display.toLocaleString()}</>
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [loading, setLoading] = useState(false)
  const totalSteps = 5

  const [data, setData] = useState<StepData>({
    name: '', email: '', password: '', age: '', gender: null,
    height: '', weight: '', activity: null, goal: null, speed: null,
  })

  useEffect(() => {
    const partial = localStorage.getItem('calorix_user_partial')
    if (partial) {
      const p = JSON.parse(partial)
      setData(d => ({ ...d, name: p.name || '', email: p.email || '', password: p.password || '' }))
      return
    }
    const existing = getUser()
    if (existing) {
      setData(d => ({ ...d, name: existing.name, email: existing.email, password: existing.password || '' }))
    }
  }, [])

  function next() { setDir(1); setStep(s => s + 1) }
  function back() { setDir(-1); setStep(s => s - 1) }
  function set(k: keyof StepData, v: unknown) { setData(d => ({ ...d, [k]: v })) }

  function canProceed() {
    if (step === 1) return data.name && data.age && data.gender && data.height && data.weight
    if (step === 2) return !!data.activity
    if (step === 3) return !!data.goal
    if (step === 4) return data.goal === 'maintain' || !!data.speed
    return true
  }

  function getResults() {
    const bmr = calculateBMR(Number(data.weight), Number(data.height), Number(data.age), data.gender!)
    const tdee = calculateTDEE(bmr, data.activity!)
    const speed = data.goal === 'maintain' ? 'moderate' : (data.speed || 'moderate')
    const calories = calculateCalorieTarget(tdee, data.goal!, speed as GoalSpeed)
    const macros = calculateMacros(calories, data.goal!)
    const water = calculateWaterTarget(Number(data.weight))
    const bmi = calculateBMI(Number(data.weight), Number(data.height))
    return { bmr, tdee, calories, ...macros, water, bmi }
  }

  function handleFinish() {
    setLoading(true)
    const r = getResults()
    const speed = data.goal === 'maintain' ? 'moderate' : (data.speed || 'moderate')
    const existingPw = data.password || getAccountByEmail(data.email)?.password || ''
    const profile: UserProfile = {
      name: data.name, email: data.email, password: existingPw,
      age: Number(data.age), gender: data.gender!,
      height: Number(data.height), weight: Number(data.weight),
      activityLevel: data.activity!, goal: data.goal!, goalSpeed: speed as GoalSpeed,
      calorieTarget: r.calories, proteinTarget: r.protein,
      carbsTarget: r.carbs, fatTarget: r.fat, waterTarget: r.water,
      createdAt: new Date().toISOString(),
    }
    saveUser(profile)
    cloudSaveProfile(profile)
    localStorage.removeItem('calorix_user_partial')
    toast.success('Profile saved! Welcome to Calorix 🎉')
    router.push('/dashboard')
  }

  const results = step === 5 && data.activity && data.goal ? getResults() : null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--cx-bg)' }}>
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
          <span className="font-bold text-black">C</span>
        </div>
        <span className="text-xl font-bold" style={s.text}>Calorix</span>
      </div>

      {/* Step dots */}
      <div className="mb-8 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i + 1 === step ? 32 : 8,
              background: i + 1 <= step ? '#22C55E' : 'var(--cx-border)',
              opacity: i + 1 < step ? 0.6 : 1,
            }} />
        ))}
      </div>

      <div className="w-full max-w-md overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}>

            {/* Step 1 — Personal Info */}
            {step === 1 && (
              <div className="p-8" style={s.card}>
                <h2 className="mb-1 text-2xl font-bold" style={s.text}>Tell us about yourself</h2>
                <p className="mb-6" style={s.text2}>We&apos;ll calculate your perfect calorie target</p>
                <div className="space-y-4">
                  <div>
                    <label style={s.label}>Your name</label>
                    <input value={data.name} onChange={e => set('name', e.target.value)} placeholder="Alex Smith" style={s.input} />
                  </div>
                  <div>
                    <label style={s.label}>Age</label>
                    <input type="number" value={data.age} onChange={e => set('age', e.target.value)} placeholder="25" min="10" max="100" style={s.input} />
                  </div>
                  <div>
                    <label style={{ ...s.label, marginBottom: 12 }}>Gender</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['male', 'female'] as Gender[]).map(g => (
                        <button key={g} onClick={() => set('gender', g)}
                          className="rounded-xl py-3 font-medium capitalize transition-all"
                          style={{
                            border: `2px solid ${data.gender === g ? '#22C55E' : 'var(--cx-border)'}`,
                            background: data.gender === g ? 'rgba(34,197,94,0.08)' : 'var(--cx-inner)',
                            color: data.gender === g ? '#22C55E' : 'var(--cx-text2)',
                          }}>
                          {g === 'male' ? '♂ Male' : '♀ Female'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={s.label}>Height (cm)</label>
                      <input type="number" value={data.height} onChange={e => set('height', e.target.value)} placeholder="175" style={s.input} />
                    </div>
                    <div>
                      <label style={s.label}>Weight (kg)</label>
                      <input type="number" value={data.weight} onChange={e => set('weight', e.target.value)} placeholder="70" step="0.1" style={s.input} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Activity */}
            {step === 2 && (
              <div className="p-8" style={s.card}>
                <h2 className="mb-1 text-2xl font-bold" style={s.text}>How active are you?</h2>
                <p className="mb-6" style={s.text2}>This affects your calorie burn estimate</p>
                <div className="space-y-3">
                  {activities.map(a => (
                    <OptionCard key={a.value} selected={data.activity === a.value} onClick={() => set('activity', a.value)}
                      emoji={a.emoji} label={a.label} desc={a.desc} />
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Goal */}
            {step === 3 && (
              <div className="p-8" style={s.card}>
                <h2 className="mb-1 text-2xl font-bold" style={s.text}>What&apos;s your goal?</h2>
                <p className="mb-6" style={s.text2}>We&apos;ll adjust your calories accordingly</p>
                <div className="space-y-3">
                  {goals.map(g => (
                    <OptionCard key={g.value} selected={data.goal === g.value} onClick={() => set('goal', g.value)}
                      emoji={g.emoji} label={g.label} desc={g.desc} />
                  ))}
                </div>
              </div>
            )}

            {/* Step 4 — Speed */}
            {step === 4 && (
              <div className="p-8" style={s.card}>
                {data.goal === 'maintain' ? (
                  <div className="py-8 text-center">
                    <div className="mb-4 text-5xl">⚖️</div>
                    <h2 className="mb-2 text-2xl font-bold" style={s.text}>Perfect choice</h2>
                    <p style={s.text2}>We&apos;ll set your calories to your exact maintenance level — no deficit, no surplus.</p>
                  </div>
                ) : (
                  <>
                    <h2 className="mb-1 text-2xl font-bold" style={s.text}>How fast?</h2>
                    <p className="mb-6" style={s.text2}>
                      {data.goal === 'lose' ? 'How quickly do you want to lose weight?' : 'How fast do you want to gain?'}
                    </p>
                    <div className="space-y-3">
                      {speeds.map(sp => (
                        <OptionCard key={sp.value} selected={data.speed === sp.value} onClick={() => set('speed', sp.value)}
                          emoji={sp.emoji} label={sp.label} desc={sp.desc} right={sp.adj} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 5 — Results */}
            {step === 5 && results && (
              <div className="p-8 text-center" style={s.card}>
                <div className="mb-2 text-4xl">🎯</div>
                <h2 className="mb-1 text-2xl font-bold" style={s.text}>Your daily target</h2>
                <p className="mb-6" style={s.text2}>Based on your profile and goals</p>
                <div className="mb-6 rounded-2xl py-6" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <div className="text-5xl font-bold text-[#22C55E]">
                    <AnimatedCount value={results.calories} />
                  </div>
                  <div className="mt-1" style={s.text2}>calories per day</div>
                </div>
                <div className="mb-6 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Protein', value: results.protein, unit: 'g', color: '#3B82F6' },
                    { label: 'Carbs', value: results.carbs, unit: 'g', color: '#F59E0B' },
                    { label: 'Fat', value: results.fat, unit: 'g', color: '#A855F7' },
                  ].map(m => (
                    <div key={m.label} className="rounded-2xl p-3" style={{ background: 'var(--cx-inner)' }}>
                      <div className="text-xl font-bold" style={{ color: m.color }}>{m.value}{m.unit}</div>
                      <div className="text-xs" style={s.text2}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mb-6 flex justify-around text-center">
                  <div><div className="font-bold text-[#06B6D4]">{results.water}L</div><div className="text-xs" style={s.text2}>Water</div></div>
                  <div><div className="font-bold" style={s.text}>{results.bmi}</div><div className="text-xs" style={s.text2}>BMI</div></div>
                  <div><div className="font-bold text-[#22C55E]">{results.tdee}</div><div className="text-xs" style={s.text2}>TDEE</div></div>
                </div>
                <button onClick={handleFinish} disabled={loading}
                  className="w-full rounded-2xl py-4 text-lg font-bold text-black transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
                  {loading ? 'Saving…' : 'Start Tracking 🚀'}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      {step < 5 && (
        <div className="mt-6 flex w-full max-w-md justify-between gap-4">
          {step > 1 ? (
            <button onClick={back} className="flex items-center gap-2 rounded-xl px-5 py-3 transition"
              style={{ border: '1px solid var(--cx-border)', color: 'var(--cx-text2)' }}>
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : <div />}
          <button onClick={next} disabled={!canProceed()}
            className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
            {step === 4 ? 'See Results' : 'Continue'} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
