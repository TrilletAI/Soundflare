'use client';

import Image from 'next/image';
import { Mic, Sparkles, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlareBackground } from '@/components/ui/flare-background'

export default function AuthPage() {
  const supabase = createClient()
  const [origin, setOrigin] = useState('')
  const router = useRouter()

  useEffect(() => {
    setOrigin(window.location.origin)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/projects')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <>
      <style jsx global>{`
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,600,700,800&display=swap');
        
        .soundflare-auth-font {
          font-family: 'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>

      <div className="min-h-screen bg-background flex overflow-hidden soundflare-auth-font">
        {/* Left Side - Branding & Value Proposition */}
        <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden flex-col justify-center px-12 py-16">
          {/* Flare Background */}
          <FlareBackground />
          
          <div className="relative z-10 max-w-lg mx-auto w-full">
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-12">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center relative group bg-black/50 border border-white/10">
                 <div className="absolute inset-0 rounded-xl bg-[#ff4d00]/20 blur-lg opacity-50" />
                <div className="relative z-10">
                  <Image src="/logo.png" alt="SoundFlare Logo" width={32} height={32} />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#ff4d00] to-[#ff6b35] bg-clip-text text-transparent">SoundFlare</span>
            </div>

            {/* Value Proposition */}
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
              Observability for <span className="text-[#ff4d00]">Voice AI</span> Agents.
            </h1>
            
            <p className="text-gray-400 text-lg mb-12 leading-relaxed">
              Automatically detect hallucinations, verify actions, and track latency for your LiveKit and Trillet agents.
            </p>

            {/* Features */}
            <div className="space-y-6">
              {[
                { icon: Shield, title: "AI Validation Engine", desc: "Verify agent actions & outputs" },
                { icon: Zap, title: "Real-time Metrics", desc: "Track TTFT, latency & costs" },
                { icon: Sparkles, title: "Automated Evals", desc: "Stress test with AI callers" }
              ].map((feature, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#ff4d00]/30 transition-colors">
                  <div className="w-10 h-10 bg-[#ff4d00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[#ff4d00]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{feature.title}</h3>
                    <p className="text-gray-500 text-sm mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Authentication */}
        <div className="flex-1 flex flex-col justify-center px-6 py-16 lg:px-12 bg-white dark:bg-neutral-950">
          <div className="w-full max-w-md mx-auto space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
                  <Image src="/logo.png" alt="SoundFlare Logo" width={28} height={28} />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">SoundFlare</span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                Welcome back
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Sign in to your account to continue
              </p>
            </div>

            {/* Supabase Auth Component */}
            <div className="mt-8">
              <Auth
                  supabaseClient={supabase}
                  appearance={{ 
                      theme: ThemeSupa,
                      variables: {
                          default: {
                              colors: {
                                  brand: '#ff4d00',
                                  brandAccent: '#e64500',
                                  inputBorder: 'rgb(229 231 235)',
                                  inputLabelText: 'rgb(107 114 128)',
                                  inputText: 'rgb(17 24 39)',
                                  inputBackground: 'rgb(255 255 255)',
                              },
                              radii: {
                                borderRadiusButton: '0.5rem',
                                inputBorderRadius: '0.5rem',
                              }
                          }
                      },
                      className: {
                        button: 'font-medium',
                        input: 'font-sans',
                      }
                  }}
                  providers={['google', 'github']}
                  redirectTo={origin ? `${origin}/auth/callback` : undefined}
                  theme="default" 
              />
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 border-t border-gray-100 dark:border-neutral-800">
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Enterprise Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Open Source</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
