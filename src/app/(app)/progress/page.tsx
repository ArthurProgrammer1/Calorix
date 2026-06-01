'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts'
import { getUser, getLast7DaysData, getWeightLogs, addWeightLog, getStreak, getProgressPhotos, addProgressPhoto, deleteProgressPhoto, type ProgressPhoto } from '@/lib/storage'
import { useTheme } from '@/lib/theme'
import type { UserProfile, WeightLog } from '@/types'
import { toast } from 'sonner'
import { TrendingUp, Flame, Calendar, Camera, Trash2, Plus } from 'lucide-react'

const s = {
  card: { background: 'var(--cx-card)', border: '1px solid var(--cx-border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' } as React.CSSProperties,
  text: { color: 'var(--cx-text)' } as React.CSSProperties,
  text2: { color: 'var(--cx-text2)' } as React.CSSProperties,
  text3: { color: 'var(--cx-text3)' } as React.CSSProperties,
}

export default function ProgressPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [calData, setCalData] = useState<{ date: string; calories: number; goal: number }[]>([])
  const [weights, setWeights] = useState<WeightLog[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [streakData, setStreakData] = useState({ current: 0, best: 0, lastLogDate: '' })
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [photoNote, setPhotoNote] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const { isDark } = useTheme()

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push('/onboarding'); return }
    setUser(u)
    setCalData(getLast7DaysData().map(d => ({ date: d.date, calories: d.calories, goal: u.calorieTarget })))
    setWeights(getWeightLogs().slice(-14))
    setStreakData(getStreak())
    setPhotos(getProgressPhotos())
  }, [router])

  function handleLogWeight() {
    if (!newWeight || isNaN(Number(newWeight))) { toast.error('Enter a valid weight'); return }
    addWeightLog(Number(newWeight))
    setWeights(getWeightLogs().slice(-14))
    toast.success('Weight logged!')
    setNewWeight('')
  }

  async function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 600
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        const today = new Date().toISOString().split('T')[0]
        const latestWeight = getWeightLogs().slice(-1)[0]?.weight
        addProgressPhoto({ date: today, dataUrl, weight: latestWeight, note: photoNote.trim() || undefined })
        setPhotos(getProgressPhotos())
        setPhotoNote('')
        toast.success('Progress photo saved!')
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleDeletePhoto(id: string) {
    deleteProgressPhoto(id)
    setPhotos(getProgressPhotos())
    toast.success('Photo deleted')
  }

  if (!user) return null

  const avg = calData.filter(d => d.calories > 0).reduce((s, d) => s + d.calories, 0) / Math.max(calData.filter(d => d.calories > 0).length, 1)

  function fmtDate(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' }) }

  const tickColor = isDark ? '#9CA3AF' : '#64748B'
  const tooltipStyle = {
    background: isDark ? '#13131F' : '#FFFFFF',
    border: `1px solid ${isDark ? '#1E1E2E' : '#E2E8F0'}`,
    borderRadius: 12,
    color: isDark ? '#F9FAFB' : '#0F172A',
  }

  const inputCls = "flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition"

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-2xl font-bold" style={s.text}>Progress</motion.h1>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { icon: Flame, label: 'Current Streak', value: `${streakData.current} days`, color: '#F59E0B' },
          { icon: TrendingUp, label: '7-Day Avg', value: `${Math.round(avg).toLocaleString()} kcal`, color: '#22C55E' },
          { icon: Calendar, label: 'Goal', value: `${user.calorieTarget.toLocaleString()} kcal`, color: '#3B82F6' },
        ].map(({ icon: Icon, label, value, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center p-4 rounded-2xl" style={s.card}>
            <Icon className="mx-auto mb-1 h-5 w-5" style={{ color }} />
            <div className="font-bold" style={s.text}>{value}</div>
            <div className="text-xs" style={s.text3}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Calorie bar chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5" style={s.card}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={s.text2}>Calories — Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={calData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => fmtDate(String(d))} formatter={(v) => [`${Number(v).toLocaleString()} kcal`, 'Calories']} />
            <ReferenceLine y={user.calorieTarget} stroke="#22C55E" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Bar dataKey="calories" radius={[6, 6, 0, 0]} fill="#22C55E" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Weight log */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-5" style={s.card}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={s.text2}>Weight Tracking</h2>
        <div className="mb-4 flex gap-2">
          <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)}
            placeholder={`Current: ${user.weight}kg`} step="0.1"
            className={inputCls}
            style={{ background: 'var(--cx-inner)', border: '1px solid var(--cx-border)', color: 'var(--cx-text)' }} />
          <button onClick={handleLogWeight} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
            Log
          </button>
        </div>
        {weights.length >= 2 ? (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={weights} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tickFormatter={d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}kg`, 'Weight']} />
              <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-4 text-center text-sm" style={s.text3}>Log at least 2 weights to see your chart</p>
        )}
      </motion.div>

      {/* Progress Photos */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-5" style={s.card}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={s.text2}>Progress Photos</h2>
          <button onClick={() => photoInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
            <Plus className="h-3.5 w-3.5" /> Add Photo
          </button>
        </div>

        {/* Note for next photo */}
        <div className="mb-4">
          <input value={photoNote} onChange={e => setPhotoNote(e.target.value)}
            placeholder="Optional note for next photo (e.g. 'Week 3 — feeling stronger')"
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ background: 'var(--cx-inner)', border: '1px solid var(--cx-border)', color: 'var(--cx-text)' }} />
        </div>

        <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoFile} />

        {photos.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-3 rounded-2xl cursor-pointer"
            style={{ background: 'var(--cx-inner)', border: '2px dashed var(--cx-border)' }}
            onClick={() => photoInputRef.current?.click()}>
            <Camera className="h-8 w-8" style={{ color: 'var(--cx-text3)' }} />
            <p className="text-sm" style={s.text3}>Take your first progress photo</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo, i) => (
              <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                className="relative group rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <img src={photo.dataUrl} alt={`Progress ${photo.date}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-xs font-semibold text-white">
                    {new Date(photo.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </p>
                  {photo.weight && <p className="text-xs text-white/70">{photo.weight} kg</p>}
                  {photo.note && <p className="text-xs text-white/60 truncate">{photo.note}</p>}
                </div>
                <button onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  style={{ background: 'rgba(239,68,68,0.85)' }}>
                  <Trash2 className="h-3.5 w-3.5 text-white" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={s.card}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={s.text2}>Achievements</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: '🌱', label: 'First Log', unlocked: calData.some(d => d.calories > 0), desc: 'Logged your first meal' },
            { emoji: '🔥', label: '3-Day Streak', unlocked: streakData.best >= 3, desc: '3 days in a row' },
            { emoji: '⚡', label: '7-Day Streak', unlocked: streakData.best >= 7, desc: 'A full week!' },
            { emoji: '🎯', label: 'Hit Goal', unlocked: calData.some(d => d.calories > 0 && Math.abs(d.calories - d.goal) < 150), desc: 'Within 150 kcal of goal' },
            { emoji: '💪', label: '14-Day Streak', unlocked: streakData.best >= 14, desc: 'Two weeks strong' },
            { emoji: '🏆', label: '30-Day Streak', unlocked: streakData.best >= 30, desc: 'A whole month!' },
          ].map(({ emoji, label, unlocked, desc }) => (
            <div key={label} className={`rounded-2xl p-3 text-center transition-all ${unlocked ? '' : 'opacity-40'}`}
              style={unlocked ? { background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' } : { background: 'var(--cx-inner)', border: '1px solid var(--cx-border)' }}>
              <div className="text-2xl mb-1">{emoji}</div>
              <div className="text-xs font-semibold" style={{ color: unlocked ? '#22C55E' : 'var(--cx-text)' }}>{label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--cx-text3)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
