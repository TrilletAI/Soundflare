import { BookOpen, Github } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { GITHUB_URL, SDK_GITHUB_URL } from "./github"

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-5 pb-10 pt-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="" width={32} height={32} />
              <span className="bg-gradient-to-r from-[#ff4d00] to-[#ff6b35] bg-clip-text text-xl font-bold tracking-tight text-transparent">
                SoundFlare
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/45">Free, open-source observability for voice AI agents.</p>
          </div>

          {[
            {
              heading: "Project",
              links: [
                { label: "GitHub", href: GITHUB_URL, icon: Github },
                { label: "Python SDK", href: SDK_GITHUB_URL },
                { label: "Docs", href: `${GITHUB_URL}#readme`, icon: BookOpen },
                { label: "Blog", href: "/blog", internal: true },
                { label: "Issues", href: `${GITHUB_URL}/issues` },
              ],
            },
            {
              heading: "Community",
              links: [
                { label: "Discord", href: "https://discord.gg/hrj7H82WQG" },
                { label: "Trillet AI", href: "https://trillet.ai" },
              ],
            },
            {
              heading: "Legal",
              links: [
                { label: "MIT License", href: `${GITHUB_URL}/blob/main/LICENSE` },
                { label: "Privacy", href: "/privacy-policy", internal: true },
                { label: "Terms", href: "/terms-of-service", internal: true },
              ],
            },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">{heading}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-white/60">
                {links.map((link) => {
                  const Icon = "icon" in link ? link.icon : undefined
                  const content = (
                    <>
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {link.label}
                    </>
                  )
                  const cls = "inline-flex items-center gap-1.5 transition-colors hover:text-white"
                  return (
                    <li key={link.label}>
                      {"internal" in link ? (
                        <Link href={link.href} className={cls}>{content}</Link>
                      ) : (
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-8 font-mono text-xs text-white/35 sm:flex-row">
          <p>&copy; 2026 Trillet AI · Released under the MIT License</p>
          <p className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> recording every call
          </p>
        </div>
      </div>
    </footer>
  )
}
