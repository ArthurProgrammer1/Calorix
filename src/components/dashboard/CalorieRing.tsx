'use client'

import { motion } from 'framer-motion'

interface Props { eaten: number; goal: number }

export function CalorieRing({ eaten, goal }: Props) {
  const pct = goal > 0 ? Math.min(eaten / goal, 1) : 0
  const r = 78
  const circ = 2 * Math.PI * r
  const offset = circ - pct * circ
  const over = eaten > goal
  const color = over ? '#EF4444' : pct >= 0.8 ? '#F59E0B' : '#22C55E'
  const glowColor = over ? 'rgba(239,68,68,0.35)' : pct >= 0.8 ? 'rgba(245,158,11,0.35)' : 'rgba(34,197,94,0.35)'
  const remaining = Math.max(goal - eaten, 0)
  const displayPct = Math.round(pct * 100)

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative flex h-48 w-48 items-center justify-center">
        <svg className="-rotate-90 absolute inset-0" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={r + 10} fill="none" stroke="var(--cx-border)" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="100" cy="100" r={r} fill="none" stroke="var(--cx-border)" strokeWidth="16" />
          <motion.circle cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="16"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }} />
        </svg>
        <div className="relative text-center">
          <div className="text-3xl font-bold leading-none" style={{ color: 'var(--cx-text)' }}>{eaten.toLocaleString()}</div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--cx-text3)' }}>of {goal.toLocaleString()} kcal</div>
          <div className="text-xs font-semibold mt-1.5 tabular-nums" style={{ color }}>{displayPct}%</div>
        </div>
      </div>

      <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl p-3" style={{ background: 'var(--cx-inner)', border: '1px solid var(--cx-border)' }}>
          <div className="text-base font-bold" style={{ color: 'var(--cx-text)' }}>{eaten.toLocaleString()}</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--cx-text3)' }}>Eaten</div>
        </div>
        <div className="rounded-2xl p-3" style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
          <div className="text-base font-bold" style={{ color }}>{goal.toLocaleString()}</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--cx-text3)' }}>Goal</div>
        </div>
        <div className="rounded-2xl p-3" style={{ background: 'var(--cx-inner)', border: '1px solid var(--cx-border)' }}>
          <div className="text-base font-bold" style={{ color: over ? '#EF4444' : 'var(--cx-text)' }}>
            {over ? `+${(eaten - goal).toLocaleString()}` : remaining.toLocaleString()}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--cx-text3)' }}>{over ? 'Over' : 'Left'}</div>
        </div>
      </div>
    </div>
  )
}
