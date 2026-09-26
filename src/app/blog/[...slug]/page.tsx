import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Github } from 'lucide-react'
import type { ComponentProps } from 'react'
import type { MDXContent } from 'mdx/types'
import { blogSource, formatPostDate, getPost, getPosts } from '@/lib/blog'
import { GITHUB_URL } from '@/components/landing/github'

type Params = { params: Promise<{ slug: string[] }> }

// Open external links in a new tab; keep internal ones as client-side navigation
function MdxLink({ href = '', ...props }: ComponentProps<'a'>) {
  if (href.startsWith('/')) return <Link href={href} {...props} />
  if (href.startsWith('#')) return <a href={href} {...props} />
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const MDX = post.page.data.body as MDXContent
  const next = getPosts().find((p) => p.url !== post.url)

  return (
    <article className="relative px-5 pb-24 pt-20 sm:px-8 sm:pt-24">
      <div aria-hidden className="sf-grid absolute inset-0 -top-20 h-[480px]" />
      <div aria-hidden className="absolute left-1/2 top-0 h-[320px] w-[640px] -translate-x-1/2 rounded-full bg-[#ff4d00]/[0.09] blur-[120px]" />

      <header className="relative mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-white/45 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          All posts
        </Link>

        <div className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[#ff4d00]/30 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.15em] text-[#ff8a4c]">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="mt-5 text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-6xl">{post.title}</h1>
        {post.description && <p className="mt-6 text-xl leading-relaxed text-white/55">{post.description}</p>}

        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-white/[0.08] py-4 font-mono text-xs text-white/45">
          <span className="text-white/75">{post.author}</span>
          <span className="text-white/20">/</span>
          <time dateTime={post.date.toISOString()}>{formatPostDate(post.date)}</time>
          <span className="text-white/20">/</span>
          <span>{post.readingMinutes} min read</span>
        </div>
      </header>

      <div className="sf-prose relative mx-auto mt-12 max-w-3xl">
        <MDX components={{ a: MdxLink }} />
      </div>

      <footer className="relative mx-auto mt-20 max-w-3xl space-y-6">
        <div className="overflow-hidden rounded-2xl border border-[#ff4d00]/25 bg-gradient-to-br from-[#ff4d00]/10 to-transparent p-8">
          <h2 className="text-2xl font-bold tracking-tight">SoundFlare is free and open source</h2>
          <p className="mt-2 text-white/55">Self-host the whole stack in one command, or star the repo to follow along.</p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ff4d00] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#ff5a14]"
          >
            <Github className="h-4 w-4" /> View on GitHub
          </a>
        </div>

        {next && (
          <Link
            href={next.url}
            className="group block rounded-2xl border border-white/[0.08] p-6 transition-colors hover:border-[#ff4d00]/30"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Read next</span>
            <p className="mt-2 text-lg font-bold transition-colors group-hover:text-[#ff4d00]">{next.title}</p>
          </Link>
        )}
      </footer>
    </article>
  )
}

export function generateStaticParams() {
  return blogSource.generateParams()
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  return {
    title: `${post.title} | SoundFlare Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date.toISOString(),
      authors: [post.author],
    },
  }
}
