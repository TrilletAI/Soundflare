'use client'
import { useUser } from '@/hooks/useUser'

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser()
  if (!isLoaded || !isSignedIn) return null
  return <>{children}</>
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser()
  if (!isLoaded || isSignedIn) return null
  return <>{children}</>
}
