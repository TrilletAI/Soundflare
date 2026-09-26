import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { formatPostDate, getPosts, type BlogPost } from '@/lib/blog'
import { GITHUB_URL } from '@/components/landing/github'

export const metadata: Metadata = {
  title: 'Blog | SoundFlare',
  description: 'Releases, guides, and notes from the team building SoundFlare, the open-source observability platform for voice AI.',
}

function PostMeta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">
      <time dateTime={post.date.toISOString()}>{formatPostDate(post.date)}</time>
      <span className="text-white/20">/</span>
      <span>{post.readingMinutes} min read</span>
      {post.tags.slice(0, 2).map((tag) => (
        <span key={tag} className="rounded-full border border-[#ff4d00]/30 px-2 py-0.5 text-[#ff8a4c]">
          {tag}
        </span>
      ))}
    </div>
  )
}

export default function BlogIndex() {
  const [featured, ...rest] = getPosts()

  return (
    <>
      <section className="relative px-5 pb-16 pt-24 sm:px-8 sm:pt-28">
        <div aria-hidden className="sf-grid absolute inset-0 -top-20" />
        <div aria-hidden className="absolute left-1/2 top-0 h-[360px] w-[700px] -translate-x-1/2 rounded-full bg-[#ff4d00]/[0.10] blur-[120px]" />
        <div className="relative mx-auto max-w-6xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#ff4d00]">Blog</span>
          <h1 className="mt-4 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-7xl">
            Notes from the <span className="text-[#ff4d00]">flight deck</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/55">
            Releases, guides, and lessons from building open-source observability for voice AI.
          </p>
        </div>
      </section>

      <section className="px-5 pb-28 sm:px-8">
        <div className="mx-auto max-w-6xl">
          {!featured ? (
            <p className="text-white/50">No posts yet. Check back soon.</p>
          ) : (
            <>
              <Link
                href={featured.url}
                className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#ff4d00]/[0.08] via-white/[0.02] to-transparent p-8 transition-colors hover:border-[#ff4d00]/40 sm:p-12"
              >
                <div aria-hidden className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#ff4d00]/10 blur-3xl transition-colors duration-500 group-hover:bg-[#ff4d00]/20" />
                <div className="relative">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#ff4d00]">Latest</span>
                  <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{featured.title}</h2>
                  <p className="mt-4 max-w-2xl text-lg text-white/55">{featured.description}</p>
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                    <PostMeta post={featured} />
                    <span className="inline-flex items-center gap-2 font-semibold text-white/80 transition-colors group-hover:text-[#ff4d00]">
                      Read post <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>

              {rest.length > 0 && (
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <Link
                      key={post.url}
                      href={post.url}
                      className="group flex flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 transition-colors hover:border-[#ff4d00]/30"
                    >
                      <PostMeta post={post} />
                      <h3 className="mt-4 text-xl font-bold leading-snug tracking-tight">{post.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">{post.description}</p>
                      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 transition-colors group-hover:text-[#ff4d00]">
                        Read <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-16 flex items-center justify-between gap-4 border-t border-white/[0.06] pt-8 font-mono text-xs text-white/40 transition-colors hover:text-white"
          >
            <span>Want to write about SoundFlare? Open a PR with a post in content/blog.</span>
            <ArrowUpRight className="h-4 w-4 shrink-0" />
          </a>
        </div>
      </section>
    </>
  )
}
