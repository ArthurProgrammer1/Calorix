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
