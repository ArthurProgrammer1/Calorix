import { createClient } from '@/lib/supabase/client'
import { saveUser, clearUser } from '@/lib/storage'
import type { UserProfile } from '@/types'

export async function cloudSignUp(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
      throw new Error('An account with this email already exists — please log in instead.')
    }
    throw new Error(error.message)
  }
  // session is null when Supabase requires email confirmation
  return { needsConfirmation: !data.session }
}

export async function cloudResendConfirmation(email: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw new Error(error.message)
}

export async function cloudSignIn(email: string, password: string): Promise<'ok' | 'needs-onboarding'> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
      throw new Error('Incorrect email or password')
    }
    if (msg.includes('email not confirmed')) {
      throw new Error('Please confirm your email first — check your inbox for the verification link.')
    }
    throw new Error(error.message)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (supabase
    .from('profiles')
    .select('data')
    .eq('id', data.user.id)
    .single() as any)

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('profiles').upsert({
      id: user.id,
      data: profile,
      updated_at: new Date().toISOString(),
    })
  } catch {
    // saved locally even if cloud sync fails
  }
}
