'use client'

import { motion } from 'framer-motion'
import { Droplets } from 'lucide-react'

interface Props {
  glasses: number
  waterTarget: number
  onChange: (n: number) => void
}

export function WaterTracker({ glasses, waterTarget, onChange }: Props) {
  const total = 8
  const safeTarget = waterTarget > 0 ? waterTarget : 2
  const mlPerGlass = (safeTarget * 1000) / total
  const consumed = ((glasses * mlPerGlass) / 1000).toFixed(1)
  const pct = Math.round((glasses / total) * 100)

  return (
    <div className="flex-1 rounded-2xl p-4" style={{ background: 'var(--cx-card)', border: '1px solid var(--cx-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4" style={{ color: '#06B6D4' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--cx-text)' }}>Hydration</span>
        </div>
        <span className="text-xs font-bold" style={{ color: '#06B6D4' }}>{pct}%</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {Array.from({ length: total }).map((_, i) => (
          <motion.button key={i} whileTap={{ scale: 0.82 }}
            onClick={() => onChange(i < glasses ? i : i + 1)}
            className="flex items-center justify-center h-10 rounded-xl transition-all duration-200"
            style={{
              background: i < glasses ? 'rgba(6,182,212,0.12)' : 'var(--cx-inner)',
              border: `1.5px solid ${i < glasses ? 'rgba(6,182,212,0.5)' : 'var(--cx-border)'}`,
              boxShadow: i < glasses ? '0 0 8px rgba(6,182,212,0.15)' : 'none',
            }}>
            <Droplets className="h-3.5 w-3.5" style={{ color: i < glasses ? '#06B6D4' : 'var(--cx-border)' }} />
          </motion.button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--cx-text3)' }}>{consumed}L of {safeTarget}L</span>
        {glasses >= total && <span className="text-xs font-semibold" style={{ color: '#06B6D4' }}>Goal reached! 💧</span>}
      </div>
    </div>
  )
}
