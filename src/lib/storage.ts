import type { UserProfile, FoodEntry, WeightLog } from '@/types'

const ACCOUNTS_KEY = 'calorix_accounts'
const SESSION_KEY = 'calorix_session'

function getAccounts(): UserProfile[] {
  if (typeof window === 'undefined') return []
  try {
    const d = localStorage.getItem(ACCOUNTS_KEY)
    return d ? JSON.parse(d) : []
  } catch { return [] }
}

function setAccounts(accounts: UserProfile[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

function getActiveEmail(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(SESSION_KEY) ?? ''
}

// Sanitise email for use in localStorage keys
function emailKey(email: string): string {
  return email.replace(/[^a-zA-Z0-9]/g, '_')
}

export function getUser(): UserProfile | null {
  if (typeof window === 'undefined') return null
  const email = getActiveEmail()
  if (!email) return null
  return getAccounts().find(a => a.email === email) ?? null
}

export function getAccountByEmail(email: string): UserProfile | null {
  return getAccounts().find(a => a.email === email) ?? null
}

export function saveUser(profile: UserProfile): void {
  const accounts = getAccounts()
  const idx = accounts.findIndex(a => a.email === profile.email)
  if (idx >= 0) accounts[idx] = profile
  else accounts.push(profile)
  setAccounts(accounts)
  localStorage.setItem(SESSION_KEY, profile.email)
}

export function clearUser(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function updateUserPassword(email: string, newPassword: string): void {
  const accounts = getAccounts()
  const idx = accounts.findIndex(a => a.email === email)
  if (idx >= 0) {
    accounts[idx] = { ...accounts[idx], password: newPassword }
    setAccounts(accounts)
  }
}

// ── Food entries — scoped per user ──

function foodEntryKey(email: string, date: string): string {
  return `calorix_food_${emailKey(email)}_${date}`
}

export function getFoodEntries(date: string): FoodEntry[] {
  if (typeof window === 'undefined') return []
  const email = getActiveEmail()
  if (!email) return []

  const newKey = foodEntryKey(email, date)

  // Migrate legacy unscoped entries (one-time per date)
  const legacyKey = `calorix_entries_${date}`
  const legacy = localStorage.getItem(legacyKey)
  if (legacy && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, legacy)
    localStorage.removeItem(legacyKey)
  }

  try {
    const d = localStorage.getItem(newKey)
    return d ? JSON.parse(d) : []
  } catch { return [] }
}

export function addFoodEntry(entry: Omit<FoodEntry, 'id' | 'createdAt'>): FoodEntry {
  const email = getActiveEmail()
  const full: FoodEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  const entries = getFoodEntries(entry.date)
  if (email) {
    localStorage.setItem(foodEntryKey(email, entry.date), JSON.stringify([...entries, full]))
    updateStreak()
    recordRecentFood({ name: entry.name, calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fat: entry.fat })
  }
  return full
}

export function deleteFoodEntry(id: string, date: string): void {
  const email = getActiveEmail()
  if (!email) return
  const entries = getFoodEntries(date).filter(e => e.id !== id)
  localStorage.setItem(foodEntryKey(email, date), JSON.stringify(entries))
}

export function getLast7DaysData() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().split('T')[0]
    const entries = getFoodEntries(date)
    return { date, calories: entries.reduce((s, e) => s + e.calories, 0), entries }
  })
}

// ── Weight logs — scoped per user ──

function weightLogKey(email: string): string {
  return `calorix_weight_${emailKey(email)}`
}

export function getWeightLogs(): WeightLog[] {
  if (typeof window === 'undefined') return []
  const email = getActiveEmail()
  if (!email) return []

  const newKey = weightLogKey(email)

  // Migrate legacy unscoped weight logs
  const legacyKey = 'calorix_weight_logs'
  const legacy = localStorage.getItem(legacyKey)
  if (legacy && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, legacy)
    localStorage.removeItem(legacyKey)
  }

  try {
    const d = localStorage.getItem(newKey)
    return d ? JSON.parse(d) : []
  } catch { return [] }
}

export function addWeightLog(weight: number): void {
  const email = getActiveEmail()
  if (!email) return
  const logs = getWeightLogs()
  const date = new Date().toISOString().split('T')[0]
  const existing = logs.findIndex(l => l.date === date)
  if (existing >= 0) logs[existing].weight = weight
  else logs.push({ date, weight })
  localStorage.setItem(weightLogKey(email), JSON.stringify(logs))
}

// ── Streak tracking ──

export function getStreak(): { current: number; best: number; lastLogDate: string } {
  if (typeof window === 'undefined') return { current: 0, best: 0, lastLogDate: '' }
  const email = getActiveEmail()
  if (!email) return { current: 0, best: 0, lastLogDate: '' }
  try {
    const d = localStorage.getItem(`calorix_streak_${emailKey(email)}`)
    return d ? JSON.parse(d) : { current: 0, best: 0, lastLogDate: '' }
  } catch { return { current: 0, best: 0, lastLogDate: '' } }
}

function updateStreak(): void {
  const email = getActiveEmail()
  if (!email) return
  const today = new Date().toISOString().split('T')[0]
  const streak = getStreak()
  if (streak.lastLogDate === today) return
  const yd = new Date(); yd.setDate(yd.getDate() - 1)
  const yesterday = yd.toISOString().split('T')[0]
  const newCurrent = streak.lastLogDate === yesterday ? streak.current + 1 : 1
  localStorage.setItem(`calorix_streak_${emailKey(email)}`, JSON.stringify({
    current: newCurrent, best: Math.max(streak.best, newCurrent), lastLogDate: today,
  }))
}

// ── Water tracking ──

export function getWaterToday(): number {
  if (typeof window === 'undefined') return 0
  const email = getActiveEmail()
  if (!email) return 0
  const today = new Date().toISOString().split('T')[0]
  return Number(localStorage.getItem(`calorix_water_${emailKey(email)}_${today}`) || 0)
}

export function setWaterToday(glasses: number): void {
  const email = getActiveEmail()
  if (!email) return
  const today = new Date().toISOString().split('T')[0]
  localStorage.setItem(`calorix_water_${emailKey(email)}_${today}`, String(Math.max(0, glasses)))
}

// ── Recent foods ──

export type RecentFood = { name: string; calories: number; protein: number; carbs: number; fat: number }

export function getRecentFoods(): RecentFood[] {
  if (typeof window === 'undefined') return []
  const email = getActiveEmail()
  if (!email) return []
  try {
    const d = localStorage.getItem(`calorix_recent_${emailKey(email)}`)
    return d ? JSON.parse(d) : []
  } catch { return [] }
}

// ── Progress photos ──

export interface ProgressPhoto {
  id: string
  date: string
  dataUrl: string
  weight?: number
  note?: string
}

export function getProgressPhotos(): ProgressPhoto[] {
  if (typeof window === 'undefined') return []
  const email = getActiveEmail()
  if (!email) return []
  try {
    const d = localStorage.getItem(`calorix_progress_photos_${emailKey(email)}`)
    return d ? JSON.parse(d) : []
  } catch { return [] }
}

export function addProgressPhoto(photo: Omit<ProgressPhoto, 'id'>): ProgressPhoto {
  const email = getActiveEmail()
  const full: ProgressPhoto = { ...photo, id: crypto.randomUUID() }
  if (email) {
    const updated = [full, ...getProgressPhotos()].slice(0, 30)
    localStorage.setItem(`calorix_progress_photos_${emailKey(email)}`, JSON.stringify(updated))
  }
  return full
}

export function deleteProgressPhoto(id: string): void {
  const email = getActiveEmail()
  if (!email) return
  const photos = getProgressPhotos().filter(p => p.id !== id)
  localStorage.setItem(`calorix_progress_photos_${emailKey(email)}`, JSON.stringify(photos))
}

function recordRecentFood(e: { name: string; calories: number; protein: number; carbs: number; fat: number }): void {
  const email = getActiveEmail()
  if (!email) return
  const recent = getRecentFoods().filter(f => f.name !== e.name)
  localStorage.setItem(`calorix_recent_${emailKey(email)}`, JSON.stringify(
    [{ name: e.name, calories: e.calories, protein: e.protein, carbs: e.carbs, fat: e.fat }, ...recent].slice(0, 8)
  ))
}
