'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Trash2, Droplets, Scale, Activity, Flame } from 'lucide-react'
import Link from 'next/link'
import { getUser, getFoodEntries, deleteFoodEntry, getLast7DaysData } from '@/lib/storage'
import { CalorieRing } from '@/components/dashboard/CalorieRing'
import { WeeklyChart } from '@/components/dashboard/WeeklyChart'
import { MacroBar } from '@/components/dashboard/MacroBar'
import { calculateBMI, calculateBMR, calculateTDEE } from '@/lib/calculations'
import type { UserProfile, FoodEntry, MealType } from '@/types'
import { toast } from 'sonner'

const meals: { type: MealType; emoji: string; label: string }[] = [
  { type: 'breakfast', emoji: '🌅', label: 'Breakfast' },
  { type: 'lunch', emoji: '🥗', label: 'Lunch' },
  { type: 'dinner', emoji: '🍽️', label: 'Dinner' },
  { type: 'snack', emoji: '🍎', label: 'Snacks' },
]

const s = {
  card: { background: 'var(--cx-card)', border: '1px solid var(--cx-border)', borderRadius: 16, boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' } as React.CSSProperties,
  inner: { background: 'var(--cx-inner)', border: '1px solid var(--cx-border)', borderRadius: 12 } as React.CSSProperties,
  text: { color: 'var(--cx-text)' } as React.CSSProperties,
  text2: { color: 'var(--cx-text2)' } as React.CSSProperties,
  text3: { color: 'var(--cx-text3)' } as React.CSSProperties,
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [chartData, setChartData] = useState<{ date: string; calories: number; goal: number }[]>([])

  const today = new Date().toISOString().split('T')[0]

  function load() {
    const u = getUser()
    if (!u) { router.push('/onboarding'); return }
    setUser(u)
    setEntries(getFoodEntries(today))
    setChartData(getLast7DaysData().map(d => ({ date: d.date, calories: d.calories, goal: u.calorieTarget })))
  }

  useEffect(() => { load() }, [])

  function handleDelete(id: string) {
    deleteFoodEntry(id, today)
    setEntries(getFoodEntries(today))
    toast.success('Entry removed')
  }

  if (!user) return null

  const eaten = entries.reduce((s, e) => s + e.calories, 0)
  const protein = entries.reduce((s, e) => s + e.protein, 0)
  const carbs = entries.reduce((s, e) => s + e.carbs, 0)
  const fat = entries.reduce((s, e) => s + e.fat, 0)
  const bmi = calculateBMI(user.weight, user.height)
  const bmr = calculateBMR(user.weight, user.height, user.age, user.gender)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const statsRow = [
    { icon: Flame, label: 'At Rest (BMR)', value: `${bmr.toLocaleString()} kcal`, color: '#F97316' },
    { icon: Scale, label: 'Weight', value: `${user.weight}kg`, color: '#F59E0B' },
    { icon: Activity, label: 'BMI', value: String(bmi), color: '#A855F7' },
    { icon: Droplets, label: 'Water goal', value: `${user.waterTarget}L`, color: '#06B6D4' },
  ]

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold" style={s.text}>{greeting}, {user.name.split(' ')[0]} 👋</h1>
        <p className="text-sm" style={s.text2}>{dateStr}</p>
      </motion.div>

      {/* Top grid */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Calorie ring */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-col items-center lg:col-span-1 p-5 rounded-2xl" style={s.card}>
          <h2 className="mb-4 w-full text-sm font-semibold uppercase tracking-wider" style={s.text2}>Calories</h2>
          <CalorieRing eaten={eaten} goal={user.calorieTarget} />
        </motion.div>

        {/* Macros + stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="space-y-5 lg:col-span-2">
          <div className="p-5 rounded-2xl" style={s.card}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={s.text2}>Macros Today</h2>
            <MacroBar protein={protein} proteinTarget={user.proteinTarget}
              carbs={carbs} carbsTarget={user.carbsTarget}
              fat={fat} fatTarget={user.fatTarget} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statsRow.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-2xl p-4 text-center" style={s.card}>
                <Icon className="mx-auto mb-1.5 h-5 w-5" style={{ color }} />
                <div className="font-bold text-sm" style={s.text}>{value}</div>
                <div className="text-[10px] mt-0.5" style={s.text3}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Weekly chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="mb-5 p-5 rounded-2xl" style={s.card}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={s.text2}>This Week</h2>
        <WeeklyChart data={chartData} />
      </motion.div>

      {/* Meals */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="mb-3 text-lg font-bold" style={s.text}>Today&apos;s Meals</h2>
        <div className="space-y-3">
          {meals.map(({ type, emoji, label }) => {
            const mealEntries = entries.filter(e => e.mealType === type)
            const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0)
            return (
              <div key={type} className="rounded-2xl p-5" style={s.card}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{emoji}</span>
                    <span className="font-semibold" style={s.text}>{label}</span>
                    {mealCals > 0 && <span className="text-sm font-medium text-[#22C55E]">{mealCals} kcal</span>}
                  </div>
                  <Link href={`/log?meal=${type}`}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#22C55E] transition"
                    style={{ background: 'rgba(34,197,94,0.1)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.18)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.1)'}>
                    <Plus className="h-3 w-3" /> Add
                  </Link>
                </div>
                {mealEntries.length > 0 ? (
                  <div className="space-y-1.5">
                    {mealEntries.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between rounded-xl px-3 py-2" style={s.inner}>
                        <span className="text-sm" style={s.text}>{entry.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-[#22C55E]">{entry.calories} kcal</span>
                          <button onClick={() => handleDelete(entry.id)} className="transition hover:text-red-400" style={s.text3}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={s.text3}>Nothing logged yet</p>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
