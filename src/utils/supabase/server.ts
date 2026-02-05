import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Use consistent cookie name across client and server to avoid URL-based mismatch
const STORAGE_KEY = 'sb-soundflare-auth-token'

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  console.log("Supabase Server: Creating client with URL:", url)

  const client = createServerClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: STORAGE_KEY,
      },
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()
          console.log("Supabase Server: Cookies available:", allCookies.map(c => c.name).join(', '))
          return allCookies
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )

  return client
}
