'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useTheme } from '@/lib/theme'

interface Props {
  data: { date: string; calories: number; goal: number }[]
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' })
}

export function WeeklyChart({ data }: Props) {
  const goal = data[0]?.goal ?? 2000
  const { isDark } = useTheme()

  const tooltipStyle = {
    background: isDark ? '#13131F' : '#FFFFFF',
    border: `1px solid ${isDark ? '#1E1E2E' : '#E2E8F0'}`,
    borderRadius: 12,
    color: isDark ? '#F9FAFB' : '#0F172A',
  }
  const tickColor = isDark ? '#9CA3AF' : '#64748B'

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(d) => formatDate(String(d))}
          formatter={(v) => [`${Number(v).toLocaleString()} kcal`, 'Calories']}
        />
        <ReferenceLine y={goal} stroke="#22C55E" strokeDasharray="4 4" strokeOpacity={0.5} />
        <Area type="monotone" dataKey="calories" stroke="#22C55E" strokeWidth={2} fill="url(#calGrad)" dot={{ fill: '#22C55E', r: 3 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
