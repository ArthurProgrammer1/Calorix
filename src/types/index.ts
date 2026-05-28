export type Gender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'
export type Goal = 'lose' | 'maintain' | 'gain'
export type GoalSpeed = 'mild' | 'moderate' | 'aggressive'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface UserProfile {
  name: string
  email: string
  password: string
  age: number
  gender: Gender
  height: number
  weight: number
  activityLevel: ActivityLevel
  goal: Goal
  goalSpeed: GoalSpeed
  calorieTarget: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
  waterTarget: number
  createdAt: string
}

export interface FoodEntry {
  id: string
  date: string
  mealType: MealType
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  createdAt: string
}

export interface WeightLog {
  date: string
  weight: number
}
