import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

export async function auth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error("Auth debug: getUser error:", error)
  } else {
    console.log("Auth debug: getUser success, userId:", user?.id)
  }

  return {
    userId: user?.id || null,
    sessionId: user?.aud || null,
    getToken: async () => 'mock-token',
    protect: () => {
        if (!user) {
            redirect('/sign-in')
        }
    }
  }
}

export async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return user
}

// Helper function to verify API tokens
export const verifyToken = async (token: string, environment = 'dev') => {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const supabase = await createClient()

    const { data: authToken, error } = await supabase
      .from('soundflare_projects')
      .select('*')
      .eq('token_hash', tokenHash)
      .single()

    if (error || !authToken) {
      return { valid: false, error: 'Invalid or expired token' }
    }

    return {
      valid: true,
      token: authToken,
      project_id: authToken.id
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return { valid: false, error: 'Token verification failed' }
  }
}
