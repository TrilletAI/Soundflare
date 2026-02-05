import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Polyfill process.versions for Supabase realtime-js dependency in Edge Runtime
if (typeof process === 'undefined') {
  (globalThis as any).process = { versions: { node: '18.0.0' } };
} else if (!process.versions) {
  (process as any).versions = { node: '18.0.0' };
}

// Use consistent cookie name across client and server to avoid URL-based mismatch
const STORAGE_KEY = 'sb-soundflare-auth-token'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: STORAGE_KEY,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicPaths = [
    '/',
    '/sign-in',
    '/sign-up',
    '/terms-of-service',
    '/privacy-policy',
    '/docs',
    '/api',
    '/auth',
    '/_next',
    '/favicon.ico'
  ]

  const isPublic = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (
    !user &&
    !isPublic
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}