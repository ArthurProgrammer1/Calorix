import { createClient as _create } from '@supabase/supabase-js'

// These are public-facing credentials (safe to hardcode — protected by RLS)
const URL  = 'https://ainipjgtwrkbqvhzhaek.supabase.co'
const KEY  = 'sb_publishable_7x87NvpMCwIgaartSkJ3kg_xBdigsCH'

let _singleton: ReturnType<typeof _create> | null = null

export function createClient() {
  if (!_singleton) _singleton = _create(URL, KEY)
  return _singleton
}
