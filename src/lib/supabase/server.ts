import { createClient as _create } from '@supabase/supabase-js'

const URL = 'https://ainipjgtwrkbqvhzhaek.supabase.co'
const KEY = 'sb_publishable_7x87NvpMCwIgaartSkJ3kg_xBdigsCH'

export async function createClient() {
  return _create(URL, KEY)
}
