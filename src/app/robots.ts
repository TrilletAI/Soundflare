import type { MetadataRoute } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

// Only marketing pages, the blog, docs, and legal pages are meant to be indexed;
// everything else is the signed-in app or an API route
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/dashboard', '/projects', '/onboarding', '/sign-in', '/sign-up'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
