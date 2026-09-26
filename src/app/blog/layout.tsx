import type { ReactNode } from 'react'
import Header from '@/components/landing/landing-header'
import Footer from '@/components/landing/footer'
import { LandingStyles } from '@/components/landing/styles'
import './blog.css'

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LandingStyles />
      {/* Same dark-only treatment as the landing page */}
      <div className="dark soundflare-landing-font relative min-h-screen overflow-x-clip bg-[#070707] text-white selection:bg-[#ff4d00]/40">
        <div aria-hidden className="sf-grain pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-overlay" />
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </>
  )
}
