"use client"

import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Bug,
  FlaskConical,
  Github,
  PhoneOutgoing,
  Scale,
  Search,
  Server,
  ShieldCheck,
  Star,
  Workflow,
} from "lucide-react"
import Image from "next/image"
import { motion, useScroll, useTransform } from "motion/react"
import React, { useRef } from "react"
import { cn } from "@/lib/utils"
import Header from "./landing-header"
import Footer from "./footer"
import { LandingStyles } from "./styles"
import { useGithubStars } from "./github"
import { GITHUB_URL, SDK_GITHUB_URL } from "./github-urls"
import { CodeWindow, MetricsMock, MonoLabel, ReviewMock, WaterfallMock, Waveform } from "./visuals"

const stack = ["LiveKit", "Trillet", "OpenAI", "Gemini", "ElevenLabs", "Google TTS", "Sarvam", "Supabase", "Docker"]

const smallFeatures = [
  {
    icon: FlaskConical,
    title: "Automated evaluations",
    description: "AI callers that behave like real people stress-test your agent on the happy paths and the messy ones.",
  },
  {
    icon: PhoneOutgoing,
    title: "Outbound campaigns",
    description: "Upload a CSV, set call windows and retries, and watch every dial land in the logs.",
  },
  {
    icon: Bot,
    title: "Agent builder",
    description: "Create and deploy LiveKit agents with your pick of LLM, STT, and voices from ElevenLabs, Google, or Sarvam.",
  },
  {
    icon: Workflow,
    title: "SIP & telephony",
    description: "Manage trunks, dispatch rules, and phone numbers so agents can take and place real calls.",
  },
  {
    icon: Search,
    title: "Search & saved views",
    description: "Global search, advanced filters, and saved views across thousands of calls.",
  },
  {
    icon: Bug,
    title: "Voice bug reporting",
    description: "Flag issues out loud mid-test. Voice commands pin the exact moment in the call.",
  },
]

const quickstart = `git clone ${GITHUB_URL}.git
cd Soundflare
./scripts/docker-start.sh
# dashboard → http://localhost:8000
# login credentials are printed in your terminal`

const sdkSnippet = `from soundflare import LivekitObserve

soundflare = LivekitObserve(
    agent_id="YOUR_AGENT_ID",
    apikey="YOUR_API_KEY",  # from your SoundFlare dashboard
)

async def entrypoint(ctx):
    session = AgentSession(...)
    session_id = soundflare.start_session(session=session)

    async def on_shutdown():
        await soundflare.export(session_id)
    ctx.add_shutdown_callback(on_shutdown)`

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

function GithubButton({ stars, className }: { stars: number | null; className?: string }) {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[#ff4d00] px-6 py-3.5 text-base font-semibold text-white shadow-[0_0_0_1px_rgba(255,120,60,0.5),0_12px_40px_-8px_rgba(255,77,0,0.6)] transition-all hover:bg-[#ff5a14] hover:shadow-[0_0_0_1px_rgba(255,140,80,0.7),0_16px_50px_-6px_rgba(255,77,0,0.75)]",
        className,
      )}
    >
      <Github className="h-5 w-5" />
      Star on GitHub
      {stars !== null && (
        <span className="inline-flex items-center gap-1 rounded-md bg-black/20 px-2 py-0.5 font-mono text-sm">
          <Star className="h-3.5 w-3.5 fill-current" />
          {stars.toLocaleString()}
        </span>
      )}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </a>
  )
}

function GhostButton({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3.5 text-base font-semibold text-white/90 backdrop-blur transition-colors hover:border-white/30 hover:bg-white/[0.06]"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </a>
  )
}

function SectionHeading({ index, label, title, children }: { index: string; label: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <motion.div {...fadeUp} className="mb-14 max-w-3xl">
      <MonoLabel>
        {index} — {label}
      </MonoLabel>
      <h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">{title}</h2>
      {children && <p className="mt-5 text-lg leading-relaxed text-white/55">{children}</p>}
    </motion.div>
  )
}

function Tile({ className, children, delay = 0 }: { className?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 transition-colors hover:border-[#ff4d00]/30",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#ff4d00]/0 blur-3xl transition-colors duration-500 group-hover:bg-[#ff4d00]/15" />
      <div className="relative">{children}</div>
    </motion.div>
  )
}

export default function LandingPage() {
  const stars = useGithubStars()
  const shotRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: shotRef, offset: ["start end", "center center"] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [22, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1])

  return (
    <>
      <LandingStyles />

      {/* Landing is designed dark-only; the `dark` class scopes the dark theme tokens to this page */}
      <div className="dark soundflare-landing-font relative min-h-screen overflow-x-clip bg-[#070707] text-white selection:bg-[#ff4d00]/40">
        <div aria-hidden className="sf-grain pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-overlay" />

        <Header />

        {/* ───────────── Hero ───────────── */}
        <section className="relative pt-24 sm:pt-32">
          <div aria-hidden className="sf-grid absolute inset-0 -top-20" />
          <div aria-hidden className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#ff4d00]/[0.13] blur-[140px]" />

          <div className="relative mx-auto max-w-6xl px-5 text-center sm:px-8">
            <motion.a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-4 font-mono text-xs text-white/70 backdrop-blur transition-colors hover:border-white/20 hover:text-white"
            >
              <span className="rounded-full bg-[#ff4d00] px-2.5 py-0.5 font-semibold text-white">v0.2</span>
              Free &amp; open source · MIT licensed
              <ArrowUpRight className="h-3.5 w-3.5" />
            </motion.a>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-8 max-w-5xl text-[clamp(2.75rem,8vw,6.5rem)] font-extrabold leading-[0.95] tracking-[-0.035em]"
            >
              The flight recorder
              <br />
              for{" "}
              <span className="relative inline-block bg-gradient-to-br from-[#ff7a3d] via-[#ff4d00] to-[#d93a00] bg-clip-text text-transparent">
                voice AI agents
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl"
            >
              Open-source observability for LiveKit and Trillet agents. Trace every turn, catch hallucinations and
              wrong actions automatically, and run it all on your own infrastructure.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <GithubButton stars={stars} />
              <GhostButton href="#self-host">Self-host in one command</GhostButton>
            </motion.div>

            {/* Waveform band */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.6 }}
              className="mx-auto mt-16 h-16 max-w-4xl text-[#ff4d00]/70 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]"
            >
              <Waveform bars={110} />
            </motion.div>
          </div>

          {/* Product shot with scroll-driven tilt */}
          <div ref={shotRef} className="relative mx-auto -mt-6 max-w-6xl px-5 pb-10 sm:px-8 [perspective:1600px]">
            <motion.div style={{ rotateX, scale }} className="relative origin-top">
              <div aria-hidden className="absolute -inset-x-10 -top-10 bottom-10 rounded-[2rem] bg-[#ff4d00]/20 blur-[100px]" />
              <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0d0d0d] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="mx-auto rounded-md bg-white/[0.05] px-10 py-1 font-mono text-[11px] text-white/40">
                    localhost:8000
                  </span>
                </div>
                <Image
                  src="/hero-banner-soundflare.png"
                  alt="SoundFlare observability view showing a call's turns, latency, and pipeline operations"
                  width={1423}
                  height={806}
                  priority
                  className="w-full"
                  draggable={false}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ───────────── Stack marquee ───────────── */}
        <section className="relative border-y border-white/[0.06] py-7">
          <div className="mx-auto flex max-w-6xl items-center gap-8 px-5 sm:px-8">
            <span className="hidden shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-white/35 sm:block">
              Plays well with
            </span>
            <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="sf-marquee flex w-max gap-12">
                {[...stack, ...stack].map((name, i) => (
                  <span key={i} className="whitespace-nowrap text-lg font-semibold text-white/40">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── Features bento ───────────── */}
        <section id="features" className="relative scroll-mt-20 px-5 py-28 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionHeading index="01" label="Capabilities" title={<>See what your agent <span className="text-white/40">actually</span> did.</>}>
              Build, test, and debug voice agents from one dashboard you own. No per-call pricing, no seat limits.
            </SectionHeading>

            <div className="grid gap-4 md:grid-cols-6">
              <Tile className="md:col-span-4 md:row-span-2">
                <div className="flex items-center gap-2 text-[#ff4d00]">
                  <ShieldCheck className="h-5 w-5" />
                  <MonoLabel>Core</MonoLabel>
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">AI call reviews</h3>
                <p className="mt-2 max-w-lg text-white/55">
                  A Gemini-powered reviewer reads every call and checks the agent&apos;s claims against what actually
                  happened: tool calls, API responses, and your knowledge base. Results stream in live.
                </p>
                <div className="mt-6">
                  <ReviewMock />
                </div>
                <div className="mt-5 flex flex-wrap gap-2 font-mono text-[11px] text-white/50">
                  {["auto-review per agent", "batch review recent calls", "queued on every new call", "live updates via SSE"].map((chip) => (
                    <span key={chip} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                      {chip}
                    </span>
                  ))}
                </div>
              </Tile>

              <Tile className="md:col-span-2" delay={0.1}>
                <MonoLabel className="text-white/40">Traces</MonoLabel>
                <h3 className="mt-2 text-xl font-bold tracking-tight">Span-level waterfall</h3>
                <p className="mt-1.5 mb-5 text-sm text-white/50">STT, LLM, tools, and TTS for every turn.</p>
                <WaterfallMock />
              </Tile>

              <Tile className="md:col-span-2" delay={0.2}>
                <MonoLabel className="text-white/40">Metrics</MonoLabel>
                <h3 className="mt-2 mb-4 text-xl font-bold tracking-tight">Latency, tokens &amp; cost</h3>
                <MetricsMock />
              </Tile>

              {smallFeatures.map(({ icon: Icon, title, description }, i) => (
                <Tile key={title} className="md:col-span-2" delay={(i % 3) * 0.08}>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#ff4d00] transition-colors group-hover:border-[#ff4d00]/40">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/50">{description}</p>
                </Tile>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── Self-host ───────────── */}
        <section id="self-host" className="relative scroll-mt-20 overflow-hidden border-t border-white/[0.06] px-5 py-28 sm:px-8">
          <div aria-hidden className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-[#ff4d00]/10 blur-[120px]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <SectionHeading index="02" label="Self-host" title="Up and running in one command.">
                A Docker Compose stack with the dashboard, Postgres, Supabase Auth, and an API gateway. Calls, recordings,
                and transcripts stay inside the compliance boundary you already manage, and AI reviews can run on your own
                cloud account or a model you host.
              </SectionHeading>

              <ol className="-mt-4 space-y-5">
                {[
                  ["Run the stack", "Generates JWT keys, starts every service, and seeds a login."],
                  ["Instrument your agent", "Add the Python SDK to your LiveKit or Trillet agent."],
                  ["Watch calls land", "Traces, metrics, and AI reviews show up in real time."],
                ].map(([title, text], i) => (
                  <motion.li key={title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ff4d00]/40 font-mono text-xs text-[#ff4d00]">
                      0{i + 1}
                    </span>
                    <div>
                      <h4 className="font-bold">{title}</h4>
                      <p className="text-sm text-white/50">{text}</p>
                    </div>
                  </motion.li>
                ))}
              </ol>

              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 font-mono text-xs text-white/45">
                <span className="inline-flex items-center gap-2"><Server className="h-3.5 w-3.5 text-[#ff4d00]" /> Docker · Vercel · any VM</span>
                <span className="inline-flex items-center gap-2"><Scale className="h-3.5 w-3.5 text-[#ff4d00]" /> MIT licensed</span>
              </div>
            </div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
              <CodeWindow
                tabs={[
                  { label: "terminal", lang: "shell", code: quickstart },
                  { label: "agent.py", lang: "python", code: sdkSnippet },
                ]}
              />
              <p className="mt-4 text-center font-mono text-xs text-white/35">
                SDK source:{" "}
                <a href={SDK_GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-white/60 underline underline-offset-4 hover:text-[#ff4d00]">
                  TrilletAI/soundflare-sdk
                </a>
              </p>
            </motion.div>
          </div>
        </section>

        {/* ───────────── Open source CTA ───────────── */}
        <section className="relative overflow-hidden border-t border-white/[0.06] px-5 py-32 sm:px-8">
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 translate-y-1/2 text-[#ff4d00]/25 [mask-image:linear-gradient(to_right,transparent,black_25%,black_75%,transparent)]">
            <Waveform bars={160} />
          </div>
          <motion.div {...fadeUp} className="relative mx-auto max-w-3xl text-center">
            <MonoLabel>03 — Open source</MonoLabel>
            <h2 className="mt-5 text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-7xl">
              Star it. Fork it.
              <br />
              <span className="text-[#ff4d00]">Ship it.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/55">
              SoundFlare is free and built in the open. Open an issue, send a pull request, or just tell us what your
              voice stack needs.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <GithubButton stars={stars} />
              <GhostButton href={`${GITHUB_URL}/issues`} external>
                Open an issue
              </GhostButton>
            </div>
          </motion.div>
        </section>

        <Footer />
      </div>
    </>
  )
}
