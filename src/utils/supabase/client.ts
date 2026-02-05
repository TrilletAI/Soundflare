import { createBrowserClient } from '@supabase/ssr'

// Use consistent cookie name across client and server to avoid URL-based mismatch
const STORAGE_KEY = 'sb-soundflare-auth-token'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: STORAGE_KEY,
      },
    }
  )
}
