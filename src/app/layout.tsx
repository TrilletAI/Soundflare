import { type Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast'
// import { PostHogProvider } from './providers' // PostHog disabled
import { FeatureAccessProvider } from './providers/FeatureAccessProvider'
import { QueryProvider } from './providers/QueryProvider'
import './globals.css'
import LayoutContent from './LayoutContent'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Open Source Voice AI Observability | SoundFlare',
  description: 'Open source observability for voice AI agents. Catch hallucinations, verify API calls, and monitor performance in real-time. Native LiveKit & Trillet integration.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sonicLinkerOrgId = process.env.NEXT_PUBLIC_SONIC_LINKER_ORG_ID

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Sonic Linker AI Traffic Monitoring - Only loads if org ID is provided */}
        {sonicLinkerOrgId && (
          <Script
            src={`https://anlt.soniclinker.com/collect.js?org_id=${sonicLinkerOrgId}`}              strategy="afterInteractive"
            async
          />
        )}

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <FeatureAccessProvider>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#fff',
                    color: '#363636',
                    border: '1px solid #e5e7eb',
                  },
                  className: 'dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700',
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              <LayoutContent>
                {children}
              </LayoutContent>
            </FeatureAccessProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
