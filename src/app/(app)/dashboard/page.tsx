'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Scale, Flame, Sparkles, RefreshCw, Activity, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { getUser, getFoodEntries, deleteFoodEntry, getLast7DaysData, getStreak, getWaterToday, setWaterToday } from '@/lib/storage'
import { CalorieRing } from '@/components/dashboard/CalorieRing'
import { WeeklyChart } from '@/components/dashboard/WeeklyChart'
import { MacroBar } from '@/components/dashboard/MacroBar'
import { WaterTracker } from '@/components/dashboard/WaterTracker'
import { calculateBMI, calculateBMR } from '@/lib/calculations'
import type { UserProfile, FoodEntry, MealType } from '@/types'
import { toast } from 'sonner'

const MEALS: { type: MealType; emoji: string; label: string; color: string; bg: string }[] = [
  { type: 'breakfast', emoji: '🌅', label: 'Breakfast', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  { type: 'lunch', emoji: '🥗', label: 'Lunch', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  { type: 'dinner', emoji: '🍽️', label: 'Dinner', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  { type: 'snack', emoji: '🍎', label: 'Snacks', color: '#A855F7', bg: 'rgba(168,85,247,0.08)' },
]

const s = {
  card: { background: 'var(--cx-card)', border: '1px solid var(--cx-border)', borderRadius: 20 } as React.CSSProperties,
  inner: { background: 'var(--cx-inner)', border: '1px solid var(--cx-border)', borderRadius: 12 } as React.CSSProperties,
  text: { color: 'var(--cx-text)' } as React.CSSProperties,
  text2: { color: 'var(--cx-text2)' } as React.CSSProperties,
  text3: { color: 'var(--cx-text3)' } as React.CSSProperties,
}

function MacroPill({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(Math.round((value / target) * 100), 100)
  const over = value > target
  return (
    <div className="flex-1 rounded-2xl px-3 py-2.5 text-center" style={{ background: over ? `${color}18` : 'var(--cx-inner)', border: `1px solid ${over ? color + '40' : 'var(--cx-border)'}` }}>
      <div className="text-sm font-bold" style={{ color: over ? color : 'var(--cx-text)' }}>{value}g</div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--cx-text3)' }}>{label} {pct}%</div>
    </div>
  )
}

function MealSection({ meal, entries, onDelete, calorieTarget }: {
  meal: typeof MEALS[0]; entries: FoodEntry[]; onDelete: (id: string) => void; totalEaten: number; calorieTarget: number
}) {
  const [expanded, setExpanded] = useState(true)
  const mealCals = entries.reduce((s, e) => s + e.calories, 0)
  const pct = calorieTarget > 0 ? Math.round((mealCals / calorieTarget) * 100) : 0

  return (
    <div className="rounded-2xl overflow-hidden" style={s.card}>
      <div className="flex items-center justify-between px-5 py-4">
        <button className="flex items-center gap-3 flex-1" onClick={() => setExpanded(e => !e)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ background: meal.bg }}>
            {meal.emoji}
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm" style={s.text}>{meal.label}</div>
            <div className="text-xs" style={{ color: mealCals > 0 ? meal.color : 'var(--cx-text3)' }}>
              {mealCals > 0 ? `${mealCals} kcal · ${pct}% of goal` : 'Nothing logged'}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Link href={`/log?meal=${meal.type}`}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition"
            style={{ background: meal.bg, color: meal.color, border: `1px solid ${meal.color}30` }}
            onClick={e => e.stopPropagation()}>
            <Plus className="h-3 w-3" /> Add
          </Link>
          <button onClick={() => setExpanded(e => !e)} style={s.text3}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && entries.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-5 pb-4">
            <div className="space-y-1.5">
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between rounded-xl px-3 py-2" style={s.inner}>
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="text-sm truncate" style={s.text}>{entry.name}</div>
                    <div className="text-[10px]" style={s.text3}>P:{entry.protein}g C:{entry.carbs}g F:{entry.fat}g</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold" style={{ color: meal.color }}>{entry.calories}</span>
                    <button onClick={() => onDelete(entry.id)}
                      className="transition-colors hover:text-red-400 rounded-lg p-1" style={s.text3}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [chartData, setChartData] = useState<{ date: string; calories: number; goal: number }[]>([])
  const [streak, setStreak] = useState({ current: 0, best: 0, lastLogDate: '' })
  const [water, setWater] = useState(0)
  const [tip, setTip] = useState('')
  const [tipLoading, setTipLoading] = useState(false)
  const [celebrated, setCelebrated] = useState(false)
  const celebratedRef = useRef(false)

  const today = new Date().toISOString().split('T')[0]

  function load() {
    const u = getUser()
    if (!u) { router.push('/onboarding'); return }
    setUser(u)
    setEntries(getFoodEntries(today))
    setChartData(getLast7DaysData().map(d => ({ date: d.date, calories: d.calories, goal: u.calorieTarget })))
    setStreak(getStreak())
    setWater(getWaterToday())
    loadTip(u)
  }

  async function loadTip(u: UserProfile) {
    const tipKey = `calorix_tip_${today}`
    const cached = localStorage.getItem(tipKey)
    if (cached) { setTip(cached); return }
    fetchTip(u)
  }

  async function fetchTip(u: UserProfile) {
    setTipLoading(true)
    try {
      const res = await fetch('/api/nutrition-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: u.goal, calorieTarget: u.calorieTarget, proteinTarget: u.proteinTarget }),
      })
      const { tip: t } = await res.json()
      if (t) {
        setTip(t)
        localStorage.setItem(`calorix_tip_${today}`, t)
      }
    } catch { /* fallback to empty */ }
    setTipLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleDelete(id: string) {
    deleteFoodEntry(id, today)
    setEntries(getFoodEntries(today))
    toast.success('Entry removed')
  }

  function handleWaterChange(glasses: number) {
    setWater(glasses)
    setWaterToday(glasses)
  }

  if (!user) return null

  const eaten = entries.reduce((s, e) => s + e.calories, 0)
  const protein = entries.reduce((s, e) => s + e.protein, 0)
  const carbs = entries.reduce((s, e) => s + e.carbs, 0)
  const fat = entries.reduce((s, e) => s + e.fat, 0)
  const bmi = calculateBMI(user.weight, user.height)
  const bmr = calculateBMR(user.weight, user.height, user.age, user.gender)
  const pct = user.calorieTarget > 0 ? Math.min(Math.round((eaten / user.calorieTarget) * 100), 100) : 0

  const goalHit = eaten >= user.calorieTarget
  if (goalHit && !celebratedRef.current) {
    celebratedRef.current = true
    setCelebrated(true)
    setTimeout(() => setCelebrated(false), 4000)
  }

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const motivationText = pct === 0 ? "Start logging to begin your day! 🌟"
    : pct < 30 ? "Great start — keep adding meals! 💪"
    : pct < 60 ? "Halfway there, you're on track! 🎯"
    : pct < 90 ? "Almost at your goal — stay consistent! 🔥"
    : pct < 100 ? "So close! Just a little more! ⚡"
    : "Daily goal reached — amazing work! 🎉"

  const statsRow = [
    { label: 'BMR', value: `${bmr.toLocaleString()} kcal`, color: '#F97316', icon: Flame },
    { label: 'Weight', value: `${user.weight} kg`, color: '#F59E0B', icon: Scale },
    { label: 'BMI', value: String(bmi), color: '#A855F7', icon: Activity },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={s.text}>{greeting}, <span className="gradient-text">{user.name.split(' ')[0]}</span> 👋</h1>
          <p className="text-sm mt-0.5" style={s.text2}>{dateStr}</p>
        </div>
        {streak.current > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-1.5 rounded-2xl px-3 py-2"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <span className="text-lg animate-flame">🔥</span>
            <div className="text-right">
              <div className="text-sm font-bold text-[#F97316] leading-none">{streak.current}</div>
              <div className="text-[9px] text-[#F97316]/70 mt-0.5">day streak</div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Celebration banner */}
      <AnimatePresence>
        {celebrated && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-center gap-3 rounded-2xl py-3 px-5"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)' }}>
            <span className="text-xl">🎉</span>
            <span className="font-semibold text-[#22C55E]">Daily calorie goal reached! Excellent work!</span>
            <span className="text-xl">🎉</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calorie ring */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-5 pb-4" style={s.card}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={s.text2}>Today's Calories</h2>
          <span className="text-xs font-medium rounded-full px-2.5 py-0.5"
            style={{ background: goalHit ? 'rgba(34,197,94,0.12)' : 'var(--cx-inner)', color: goalHit ? '#22C55E' : 'var(--cx-text3)', border: `1px solid ${goalHit ? 'rgba(34,197,94,0.3)' : 'var(--cx-border)'}` }}>
            {motivationText}
          </span>
        </div>
        <CalorieRing eaten={eaten} goal={user.calorieTarget} />
        {/* Macro pills */}
        <div className="mt-4 flex gap-2">
          <MacroPill label="Protein" value={protein} target={user.proteinTarget} color="#3B82F6" />
          <MacroPill label="Carbs" value={carbs} target={user.carbsTarget} color="#F59E0B" />
          <MacroPill label="Fat" value={fat} target={user.fatTarget} color="#A855F7" />
        </div>
      </motion.div>

      {/* Streak + Water row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-3">
        {/* Streak card */}
        <div className="flex-1 rounded-2xl p-4" style={s.card}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl animate-flame">🔥</span>
            <span className="text-sm font-semibold" style={s.text}>Streak</span>
          </div>
          <div className="text-3xl font-bold" style={{ color: streak.current > 0 ? '#F97316' : 'var(--cx-text3)' }}>
            {streak.current}
          </div>
          <div className="text-xs mt-1" style={s.text3}>days · best: {streak.best}</div>
          {streak.current === 0 && (
            <div className="text-xs mt-1" style={{ color: '#F97316' }}>Log food to start!</div>
          )}
        </div>

        {/* Water tracker */}
        <WaterTracker glasses={water} waterTarget={user.waterTarget} onChange={handleWaterChange} />
      </motion.div>

      {/* AI Tip */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.06) 100%)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20 }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Sparkles className="h-4 w-4 text-[#A855F7]" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#A855F7' }}>AI Daily Tip</div>
              {tipLoading ? (
                <div className="space-y-2">
                  <div className="h-3 w-48 rounded-full shimmer-card" />
                  <div className="h-3 w-36 rounded-full shimmer-card" />
                </div>
              ) : (
                <p className="text-sm leading-relaxed" style={s.text2}>{tip || 'Loading your personalised tip…'}</p>
              )}
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem(`calorix_tip_${today}`); fetchTip(user) }}
            className="shrink-0 rounded-xl p-2 transition hover:rotate-180 duration-500"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#A855F7' }}
            disabled={tipLoading}
            title="Get new tip">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Macro bars */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="p-5" style={s.card}>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest" style={s.text2}>Macro Breakdown</h2>
        <MacroBar protein={protein} proteinTarget={user.proteinTarget} carbs={carbs} carbsTarget={user.carbsTarget} fat={fat} fatTarget={user.fatTarget} />
      </motion.div>

      {/* Meals */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest" style={s.text2}>Today's Meals</h2>
        <div className="space-y-2.5">
          {MEALS.map(meal => (
            <MealSection key={meal.type} meal={meal}
              entries={entries.filter(e => e.mealType === meal.type)}
              onDelete={handleDelete}
              totalEaten={eaten}
              calorieTarget={user.calorieTarget} />
          ))}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="grid grid-cols-3 gap-3">
        {statsRow.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-4 text-center" style={s.card}>
            <Icon className="mx-auto mb-1.5 h-5 w-5" style={{ color }} />
            <div className="text-sm font-bold" style={s.text}>{value}</div>
            <div className="text-[10px] mt-0.5" style={s.text3}>{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Weekly chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="p-5" style={s.card}>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest" style={s.text2}>This Week</h2>
        <WeeklyChart data={chartData} />
      </motion.div>
    </div>
  )
}
