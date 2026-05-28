import type { ActivityLevel, Goal, GoalSpeed } from '@/types'

export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(gender === 'male' ? base + 5 : base - 161)
}

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
}

export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * activityMultipliers[activity])
}

const goalAdjustments: Record<Goal, Record<GoalSpeed, number>> = {
  lose: { mild: -300, moderate: -500, aggressive: -750 },
  maintain: { mild: 0, moderate: 0, aggressive: 0 },
  gain: { mild: 300, moderate: 500, aggressive: 750 },
}

export function calculateCalorieTarget(tdee: number, goal: Goal, speed: GoalSpeed): number {
  return Math.max(1200, tdee + goalAdjustments[goal][speed])
}

export function calculateMacros(calories: number, goal: Goal) {
  const proteinPct = goal === 'gain' ? 0.30 : 0.25
  const carbsPct = goal === 'lose' ? 0.40 : 0.45
  const fatPct = 1 - proteinPct - carbsPct
  return {
    protein: Math.round((calories * proteinPct) / 4),
    carbs: Math.round((calories * carbsPct) / 4),
    fat: Math.round((calories * fatPct) / 9),
  }
}

export function calculateWaterTarget(weight: number): number {
  return Math.round((weight * 35) / 100) / 10
}

export function calculateBMI(weight: number, height: number): number {
  const h = height / 100
  return Math.round((weight / (h * h)) * 10) / 10
}
