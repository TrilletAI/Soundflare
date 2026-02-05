import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsSignedIn(!!user)
      setIsLoaded(true)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setIsSignedIn(!!session?.user)
        setIsLoaded(true)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { user, isLoaded, isSignedIn }
}

export function useClerk() {
    const supabase = createClient()
    return {
        signOut: () => supabase.auth.signOut(),
        openUserProfile: () => console.log("Profile modal not implemented yet")
    }
}