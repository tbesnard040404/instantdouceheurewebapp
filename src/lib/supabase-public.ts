import { createClient } from '@supabase/supabase-js'

let instance: ReturnType<typeof createClient> | null = null

export function getSupabasePublic() {
  if (!instance) {
    const url = process.env.SUPABASE_URL!
    const key = process.env.SUPABASE_ANON_KEY!
    instance = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  }
  return instance
}
