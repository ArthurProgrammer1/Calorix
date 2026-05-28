import { createClient } from '@/lib/supabase/client'
import { saveUser, clearUser } from '@/lib/storage'
import type { UserProfile } from '@/types'

export async function cloudSignUp(email: string, password: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      throw new Error('An account with this email already exists')
    }
    throw new Error(error.message)
  }
}

export async function cloudSignIn(email: string, password: string): Promise<'ok' | 'needs-onboarding'> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
      throw new Error('Incorrect email or password')
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Please confirm your email before logging in')
    }
    throw new Error(error.message)
  }

  const { data: row } = await supabase
    .from('profiles')
    .select('data')
    .eq('id', data.user.id)
    .single()

  if (row?.data) {
    saveUser(row.data as UserProfile)
    return 'ok'
  }
  return 'needs-onboarding'
}

export async function cloudSignOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  clearUser()
}

export async function cloudSaveProfile(profile: UserProfile): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({
      id: user.id,
      data: profile,
      updated_at: new Date().toISOString(),
    })
  } catch {
    // Profile saved locally even if cloud sync fails
  }
}
