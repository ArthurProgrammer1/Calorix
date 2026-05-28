'use client'

interface Props {
  protein: number; proteinTarget: number
  carbs: number; carbsTarget: number
  fat: number; fatTarget: number
}

const macros = [
  { key: 'protein' as const, label: 'Protein', gradient: 'linear-gradient(90deg, #2563EB, #60A5FA)', glow: 'rgba(59,130,246,0.4)', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  { key: 'carbs' as const, label: 'Carbs', gradient: 'linear-gradient(90deg, #D97706, #FBBF24)', glow: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  { key: 'fat' as const, label: 'Fat', gradient: 'linear-gradient(90deg, #7C3AED, #A78BFA)', glow: 'rgba(168,85,247,0.4)', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' },
]

function Bar({ value, target, gradient, glow, bg, border, label }:
  { value: number; target: number; gradient: string; glow: string; bg: string; border: string; label: string }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0
  const over = value > target

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-[#9CA3AF] font-medium">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-white font-semibold">{Math.round(value)}g</span>
          <span className="text-[#4B5563]">/ {target}g</span>
          <span className="text-[10px] font-bold tabular-nums" style={{
            color: over ? '#EF4444' : `${gradient.match(/#[A-Fa-f0-9]{6}/g)?.[1] ?? '#fff'}`
          }}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full" style={{ background: '#1E1E2E' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: over ? '#EF4444' : gradient,
            boxShadow: pct > 10 ? `0 0 8px ${glow}` : 'none',
          }}
        />
      </div>
    </div>
  )
}

export function MacroBar({ protein, proteinTarget, carbs, carbsTarget, fat, fatTarget }: Props) {
  const data = { protein, carbs, fat }
  const targets = { protein: proteinTarget, carbs: carbsTarget, fat: fatTarget }
  return (
    <div className="space-y-3.5">
      {macros.map(m => (
        <Bar key={m.key} value={data[m.key]} target={targets[m.key]}
          gradient={m.gradient} glow={m.glow} bg={m.bg} border={m.border} label={m.label} />
      ))}
    </div>
  )
}
