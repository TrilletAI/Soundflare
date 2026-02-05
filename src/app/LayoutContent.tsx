'use client'

import { SignedIn, SignedOut } from '@/components/auth/AuthComponents'
import { usePathname, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import SidebarWrapper from '@/components/shared/SidebarWrapper'
import FeedbackWidget from '@/components/feedback/FeedbackWidget'
import SignOutHandler from '@/components/auth'
import { useSupabaseQuery } from '@/hooks/useSupabase'

// Routes that should never show sidebar (even when signed in)
const noSidebarRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/privacy-policy',
  '/terms-of-service',
  '/onboarding'
]

function shouldShowSidebar(pathname: string): boolean {
  return !noSidebarRoutes.includes(pathname)
}

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const params = useParams()
  const showSidebar = shouldShowSidebar(pathname)

  const projectId = Array.isArray(params?.projectid) ? params.projectid[0] : params.projectid
  const agentId = Array.isArray(params?.agentid) ? params.agentid[0] : params.agentid
  const [agentName, setAgentName] = useState<string | null>(null)

  const { data: agents } = useSupabaseQuery('soundflare_agents', agentId ? {
    select: 'name',
    filters: [{ column: 'id', operator: 'eq', value: agentId }]
  } : null)

  useEffect(() => {
    if (agents && agents.length > 0) {
      setAgentName(agents[0].name)
    } else {
      setAgentName(null)
    }
  }, [agents])

  return (
    <main>
      <SignedOut>
        <div className="min-h-screen">
          {children}
        </div>
      </SignedOut>
      <SignedIn>
        <SignOutHandler>
          {showSidebar ? (
            <SidebarWrapper agentName={agentName}>
              {children}
            </SidebarWrapper>
          ) : (
            <div className="min-h-screen">
              {children}
            </div>
          )}
          <FeedbackWidget />
        </SignOutHandler>
      </SignedIn>
    </main>
  )
}
