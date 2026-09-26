"use client"

import React, { useState } from "react"
import { motion } from "motion/react"
import { AlertTriangle, Check, CheckCircle2, Copy, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

// Deterministic bar heights (no Math.random) so server and client render the same markup
function barHeight(i: number, count: number) {
  const x = i / count
  const envelope = Math.sin(Math.PI * x) ** 0.6
  const detail = 0.55 + 0.45 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.43))
  return Math.max(0.08, envelope * detail)
}

export function Waveform({ bars = 96, className }: { bars?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-[3px] h-full", className)}>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className="sf-wave-bar flex-1 rounded-full bg-current"
          style={{
            height: `${Math.round(barHeight(i, bars) * 100)}%`,
            animationDelay: `${(i % 12) * -0.11}s`,
            animationDuration: `${1.1 + (i % 5) * 0.18}s`,
          }}
        />
      ))}
    </div>
  )
}

export function MonoLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[11px] uppercase tracking-[0.2em] text-[#ff4d00]", className)}>
      {children}
    </span>
  )
}

/* ---------- Feature mocks (illustrative sample data) ---------- */

const reviewLines = [
  { who: "caller", text: "Can you move my appointment to Friday?" },
  { who: "tool", text: "get_availability(date=\"fri\")", result: "200 OK", ok: true },
  {
    who: "agent",
    text: "Done! You're booked for Friday at 3pm.",
    flag: "Wrong action · reschedule_appointment was never called",
  },
  { who: "agent", text: "Your copay for that visit is $20.", flag: "Hallucination · not in knowledge base" },
]

export function ReviewMock() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 font-mono text-[12px] leading-relaxed overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 text-white/50">
        <span>call_a41f · ai review</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4d00]/15 px-2 py-0.5 text-[#ff8a4c]">
          <AlertTriangle className="h-3 w-3" /> 2 issues
        </span>
      </div>
      <div className="p-4 space-y-3">
        {reviewLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.25, duration: 0.4 }}
            className="space-y-1.5"
          >
            <div className="flex gap-3">
              <span
                className={cn(
                  "w-12 shrink-0 text-right",
                  line.who === "agent" ? "text-[#ff8a4c]" : line.who === "tool" ? "text-sky-400/80" : "text-white/40",
                )}
              >
                {line.who}
              </span>
              <span className={line.who === "tool" ? "text-white/60" : "text-white/85"}>
                {line.text}
                {line.result && (
                  <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">
                    <Check className="h-3 w-3" /> {line.result}
                  </span>
                )}
              </span>
            </div>
            {line.flag && (
              <div className="ml-[3.75rem] inline-flex items-center gap-1.5 rounded-md border border-[#ff4d00]/30 bg-[#ff4d00]/10 px-2 py-1 text-[11px] text-[#ff9a63]">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {line.flag}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const spans = [
  { name: "stt", start: 0, end: 18, color: "bg-sky-400/80" },
  { name: "llm", start: 18, end: 62, color: "bg-[#ff4d00]" },
  { name: "tool", start: 30, end: 52, color: "bg-violet-400/80" },
  { name: "tts", start: 62, end: 88, color: "bg-emerald-400/80" },
]

export function WaterfallMock() {
  return (
    <div className="space-y-2 font-mono text-[11px]">
      {spans.map((s, i) => (
        <div key={s.name} className="flex items-center gap-3">
          <span className="w-8 text-white/40">{s.name}</span>
          <div className="relative h-2.5 flex-1 rounded-full bg-white/[0.04]">
            <motion.div
              className={cn("absolute inset-y-0 rounded-full", s.color)}
              style={{ left: `${s.start}%` }}
              initial={{ width: 0 }}
              whileInView={{ width: `${s.end - s.start}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
      <div className="flex justify-between pl-11 pt-1 text-white/30">
        <span>0ms</span>
        <span>500ms</span>
        <span>1s</span>
      </div>
    </div>
  )
}

export function MetricsMock() {
  return (
    <div>
      <div className="flex items-end gap-2">
        <span className="text-5xl font-bold tracking-tight text-white">471</span>
        <span className="mb-1.5 font-mono text-sm text-white/50">ms · ttft p50</span>
      </div>
      <svg viewBox="0 0 200 48" className="mt-4 h-12 w-full" aria-hidden>
        <defs>
          <linearGradient id="sf-spark" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff4d00" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff4d00" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 34 L20 30 L40 36 L60 22 L80 26 L100 14 L120 20 L140 12 L160 18 L180 8 L200 12 L200 48 L0 48 Z" fill="url(#sf-spark)" />
        <motion.path
          d="M0 34 L20 30 L40 36 L60 22 L80 26 L100 14 L120 20 L140 12 L160 18 L180 8 L200 12"
          fill="none"
          stroke="#ff4d00"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-white/50">
        <span>tokens <span className="text-white/80">1.2k</span></span>
        <span>cost <span className="text-white/80">$0.018</span></span>
      </div>
    </div>
  )
}

/* ---------- Code window ---------- */

const PY_TOKENS = /(#.*$)|("[^"]*")|\b(from|import|def|async|await|lambda|return)\b|\b([A-Za-z_]\w*)(?=\()/gm

function highlightPython(code: string) {
  const out: React.ReactNode[] = []
  let last = 0
  for (const m of code.matchAll(PY_TOKENS)) {
    const idx = m.index ?? 0
    if (idx > last) out.push(code.slice(last, idx))
    const cls = m[1] ? "text-white/35" : m[2] ? "text-emerald-300" : m[3] ? "text-[#ff8a4c]" : "text-sky-300"
    out.push(
      <span key={idx} className={cls}>
        {m[0]}
      </span>,
    )
    last = idx + m[0].length
  }
  out.push(code.slice(last))
  return out
}

function highlightShell(code: string) {
  return code.split("\n").map((line, i) => (
    <React.Fragment key={i}>
      {line.startsWith("#") ? (
        <span className="text-white/35">{line}</span>
      ) : (
        <>
          <span className="select-none text-[#ff4d00]">$ </span>
          {line}
        </>
      )}
      {"\n"}
    </React.Fragment>
  ))
}

type CodeTab = { label: string; lang: "shell" | "python"; code: string }

export function CodeWindow({ tabs }: { tabs: CodeTab[] }) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const tab = tabs[active]

  const copy = () => {
    const text = tab.lang === "shell" ? tab.code.split("\n").filter((l) => !l.startsWith("#")).join("\n") : tab.code
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl shadow-black/60 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-4">
        <div className="flex gap-1.5 pr-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </div>
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-3 font-mono text-xs transition-colors",
              i === active ? "text-white" : "text-white/40 hover:text-white/70",
            )}
          >
            <Terminal className="h-3 w-3" />
            {t.label}
            {i === active && <motion.span layoutId="sf-tab" className="absolute inset-x-2 -bottom-px h-px bg-[#ff4d00]" />}
          </button>
        ))}
        <button
          onClick={copy}
          aria-label="Copy code"
          className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white"
        >
          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="min-h-[15rem] overflow-x-auto p-5 font-mono text-[13px] leading-7 text-white/85">
        <code>{tab.lang === "shell" ? highlightShell(tab.code) : highlightPython(tab.code)}</code>
      </pre>
    </div>
  )
}
