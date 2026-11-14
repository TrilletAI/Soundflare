import type { MetadataRoute } from 'next'
import { getPosts } from '@/lib/blog'
import { source } from '@/lib/source'

// Absolute URLs are required in a sitemap; self-hosted deployments set their own domain
const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${SITE_URL}/blog`,
      lastModified: posts.reduce<Date | undefined>((latest, p) => (!latest || p.date > latest ? p.date : latest), undefined),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms-of-service`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}${post.url}`,
    lastModified: post.date,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const docsPages: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${SITE_URL}${page.url}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticPages, ...blogPages, ...docsPages]
}
