'use client'

interface CalorieRingProps {
  eaten: number
  goal: number
}

export function CalorieRing({ eaten, goal }: CalorieRingProps) {
  const percentage = goal > 0 ? Math.min((eaten / goal) * 100, 100) : 0
  const remaining = Math.max(goal - eaten, 0)
  const over = eaten > goal

  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center">
        <svg
          width="220"
          height="220"
          viewBox="0 0 220 220"
          className="-rotate-90"
        >
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="16"
          />
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke={over ? '#ef4444' : '#16a34a'}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-bold tabular-nums text-foreground">
            {eaten.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">kcal eaten</span>
        </div>
      </div>

      <div className="grid w-full max-w-xs grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xl font-bold text-foreground">{eaten.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Eaten</p>
        </div>
        <div className="rounded-2xl bg-[#16a34a]/10 p-3">
          <p className="text-xl font-bold text-[#16a34a]">{goal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Goal</p>
        </div>
        <div className={`rounded-2xl p-3 ${over ? 'bg-red-50' : 'bg-slate-50'}`}>
          <p className={`text-xl font-bold ${over ? 'text-red-500' : 'text-foreground'}`}>
            {over ? `-${(eaten - goal).toLocaleString()}` : remaining.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">{over ? 'Over' : 'Left'}</p>
        </div>
      </div>
    </div>
  )
}
