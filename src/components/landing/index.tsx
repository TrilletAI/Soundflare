"use client"

import Link from "next/link"
import { ArrowRight, BarChart3, Zap, Shield, Clock, Code, Mic, Activity, Github, Star, ExternalLink, Users, FlaskConical, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { CompanyMarquee } from "@/components/landing/company-marquee"
import { PricingSection } from "@/components/landing/pricing-section"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { FlipWords } from "@/components/ui/flip-words"
import { FlareBackground } from "@/components/ui/flare-background"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { motion } from "motion/react"
import React from "react"
import { useState, useEffect } from "react"
import Header from "./landing-header"

export default function LandingPage() {
  // FlipWords for the hero heading
  const words = [
    { text: "precision", className: "text-[#ff4d00]" },
    { text: "confidence", className: "text-[#ff4d00]" },
    { text: "clarity", className: "text-[#ff4d00]" },
    { text: "intelligence", className: "text-[#ff4d00]" },
    { text: "SoundFlare", className: "text-[#ff4d00]" }
  ];

  return (
    <>
      {/* Page-specific font loading - Cabinet Grotesk */}
      <style jsx global>{`
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,600,700,800&display=swap');
        
        .soundflare-landing-font {
          font-family: 'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>

      <div className="min-h-screen bg-background soundflare-landing-font">

        {/* Enhanced Header */}
        <Header />

        {/* Hero Section with Flare Light Background */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* Animated Flare Light Background */}
          <div className="absolute inset-0 bg-background">
            <FlareBackground />
          </div>

          <div className="relative z-10 container mx-auto px-6 py-20">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left side - Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
                className="lg:pr-12"
              >
                {/* Badge with Light Effect */}
                <div className="relative mb-8">
                  {/* Light effects */}
                  <div className="absolute inset-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 0.4, scale: 1 }}
                      transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut",
                      }}
                      className="absolute h-32 w-64 bg-[#ff4d00]/10 rounded-full blur-3xl -left-10"
                    />
                  </div>

                  {/* The actual badge */}
                  <motion.div
                    initial={{ opacity: 0.5, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.3,
                      duration: 0.8,
                      ease: "easeInOut",
                    }}
                    className="relative z-10 inline-flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-white/20"
                    style={{ textShadow: "0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3)" }}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Voice AI Observability Platform</span>
                  </motion.div>
                </div>

                {/* Hero Heading with FlipWords Effect */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
                  Monitor your <span className="text-white">voice AI</span> agents with
                  <span className="inline-block min-w-[240px]">
                    <FlipWords words={words} className="text-[#ff4d00]" />
                  </span>
                </h1>

                <p className="text-lg lg:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
                  Open-source observability for voice AI agents. Automatically catch hallucinations, wrong actions, and API failures before they impact users.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="https://forms.gle/Vw4KYc9YWk1EN2K57" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="text-lg px-8 py-6 group font-medium bg-[#ff4d00] hover:bg-[#e64500] text-white">
                      Join Waitlist
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                </div>
              </motion.div>

              {/* Right side - Image */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative">
                  {/* Glow effect behind image */}
                  <div className="absolute -inset-4 bg-[#ff4d00]/10 rounded-3xl blur-2xl" />
                  <Image
                    src="/hero-banner-soundflare.png"
                    alt="SoundFlare - Voice AI Observability for Trillet AI"
                    height={720}
                    width={1000}
                    className="relative rounded-2xl object-cover shadow-2xl border border-white/10"
                    draggable={false}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Company Marquee */}
        {/* <CompanyMarquee /> */}

        {/* AI Validation Engine - Spotlight Section */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-balance mb-4 tracking-tight">Ship voice AI with confidence</h2>
              <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
                End-to-end observability that validates every action, API call, and response in real time.
              </p>
            </div>

            {/* Featured: AI Validation Engine */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff4d00]/5 via-[#ff4d00]/10 to-[#ff6b35]/5 border border-[#ff4d00]/20 p-8 md:p-12">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff4d00]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ff6b35]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-[#ff4d00]/10 rounded-2xl flex items-center justify-center border border-[#ff4d00]/20">
                      <Shield className="w-10 h-10 text-[#ff4d00]" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-[#ff4d00]/10 text-[#ff4d00] px-3 py-1 rounded-full text-sm font-medium mb-4">
                      <Zap className="w-3 h-3" />
                      Core Feature
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">AI Validation Engine</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                      Verify that your AI actually does what it says. Our validation agent automatically checks whether APIs were called correctly, responses returned the right status codes, and nothing was hallucinated.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        API call verification
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Hallucination detection
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Response validation
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Other Features - 2x2 Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: BarChart3,
                  title: "Real-Time Metrics",
                  description: "Track critical performance indicators like latency and token costs. Get instant visibility into how your voice AI performs under real conditions.",
                },
                {
                  icon: Mic,
                  title: "Voice-Activated Bug Reporting",
                  description: "Report bugs naturally while testing your agents. Use custom voice commands to flag issues without interrupting your workflow or switching contexts.",
                },
                {
                  icon: Code,
                  title: "Native Integration",
                  description: "Built specifically for LiveKit and Trillet. No complex setup or configuration needed. Works seamlessly with your existing voice AI stack from day one.",
                },
                {
                  icon: Zap,
                  title: "Lightning Fast Performance",
                  description: "Minimal overhead monitoring that won't impact your application's performance. Get comprehensive insights without sacrificing the speed your users expect.",
                },
                {
                  icon: FlaskConical,
                  title: "Automated Evaluations",
                  description: "Stress test your agent with AI-generated callers that mimic real human behavior. Cover both happy and unhappy paths to find edge cases before users do.",
                },
                {
                  icon: Bell,
                  title: "Intelligent Alert System",
                  description: "Get notified when STT, LLM, or TTS components underperform. Instant alerts for hallucinations, failed API calls, or response mismatches.",
                },
              ].map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <HoverBorderGradient
                      containerClassName="rounded-2xl w-full h-full"
                      as="div"
                      className="bg-background border-border/50 hover:border-primary/50 transition-colors group p-0 h-full"
                    >
                      <Card className="border-0 shadow-none bg-transparent h-full">
                        <CardHeader>
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                        </CardContent>
                      </Card>
                    </HoverBorderGradient>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-balance mb-4 tracking-tight">Connect your voice agent</h2>
              <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
                Link your voice AI agent and start watching calls come in with automatic observability
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="p-8">
                <CardContent className="space-y-8">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Activity className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold">What you get</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
                      Once connected, every call is automatically captured, validated, and analyzed—giving you complete visibility into what your AI is actually doing.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Catch hallucinations before users do</h4>
                        <p className="text-sm text-muted-foreground">Automatically detect when your AI makes things up or provides inaccurate information</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Verify every API call was executed</h4>
                        <p className="text-sm text-muted-foreground">Know with certainty that your AI followed through on actions it claimed to perform</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Identify performance bottlenecks</h4>
                        <p className="text-sm text-muted-foreground">Track latency and token costs to optimize response times and reduce expenses</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Ship with confidence</h4>
                        <p className="text-sm text-muted-foreground">Deploy knowing that every response is validated and every action is tracked</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <a href="https://forms.gle/Vw4KYc9YWk1EN2K57" target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="text-lg px-8 py-6 font-medium bg-[#ff4d00] hover:bg-[#e64500] text-white">
                        Join Waitlist
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing">
          <PricingSection />
        </section>

        {/* CTA Section */}
        {/* <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-balance mb-6 tracking-tight">Ready to optimize your Voice AI?</h2>
            <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
              Join hundreds of developers who trust Soundflare to monitor and optimize their LiveKit voice agents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-in">
                <Button size="lg" className="text-lg px-8 py-6 group font-medium">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent font-medium">
                Schedule Demo
              </Button>
            </div>
          </div>
        </section> */}

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff4d00]/5 via-[#ff4d00]/10 to-[#ff6b35]/5 border border-[#ff4d00]/20 p-8 md:p-12">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff4d00]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ff6b35]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-[#ff4d00]/10 rounded-2xl flex items-center justify-center border border-[#ff4d00]/20">
                      <Shield className="w-10 h-10 text-[#ff4d00]" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center lg:text-left">
                    <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Get a comprehensive monitoring suite</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                      We'll set up full observability for your voice agents, whether you're on Pipecat, LiveKit, or a custom stack. Get complete visibility into hallucinations, tool calling accuracy, API execution, latency, and costs, tailored to your infrastructure.
                    </p>
                    <Button
                      size="lg"
                      className="bg-[#ff4d00] hover:bg-[#e64500] text-white font-medium"
                      onClick={() => window.open('https://cal.com/team/trillet-ai/soundflare', '_blank', 'noopener,noreferrer')}
                    >
                      Talk to an Expert
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="col-span-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <Image src="/logo.png" alt="Logo" width={40} height={40} />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-[#ff4d00] to-[#ff6b35] bg-clip-text text-transparent tracking-tight">SoundFlare</span>
                </div>
                <p className="text-sm text-muted-foreground">The open source observability platform and managed service for voice AI.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="#features" className="hover:text-foreground transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-in" className="hover:text-foreground transition-colors">
                      Dashboard
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="https://trillet.ai" target="_blank" className="hover:text-foreground transition-colors">
                      Trillet AI
                    </Link>
                  </li>
                  <li>
                    <Link href="https://trillet.ai/enterprise" target="_blank" className="hover:text-foreground transition-colors">
                      Enterprise
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-of-service" className="hover:text-foreground transition-colors">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border/50 mt-12 pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2026 SoundFlare. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}