import { blog } from '../../.source';
import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';

export const blogSource = loader({
  baseUrl: '/blog',
  source: createMDXSource(blog),
});

type BlogPage = NonNullable<ReturnType<typeof blogSource.getPage>>;

export interface BlogPost {
  slug: string;
  url: string;
  title: string;
  description: string;
  tldr?: string;
  date: Date;
  author: string;
  authorTitle?: string;
  tags: string[];
  featured: boolean;
  readingMinutes: number;
  page: BlogPage;
}

function toPost(page: BlogPage): BlogPost {
  const data = page.data as BlogPage['data'] & {
    date?: unknown;
    author?: unknown;
    authorTitle?: unknown;
    tags?: unknown;
    featured?: unknown;
    tldr?: unknown;
  };
  const date = new Date(String(data.date));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Blog post "${page.url}" needs a valid \`date\` in its frontmatter (e.g. 2026-09-26)`);
  }
  const structured = data.structuredData as { contents?: { content: string }[] } | undefined;
  const words = (structured?.contents ?? []).reduce((sum, block) => sum + block.content.split(/\s+/).length, 0);

  return {
    slug: page.slugs.join('/'),
    url: page.url,
    title: data.title,
    description: data.description ?? '',
    tldr: typeof data.tldr === 'string' ? data.tldr : undefined,
    date,
    author: typeof data.author === 'string' ? data.author : 'The SoundFlare team',
    authorTitle: typeof data.authorTitle === 'string' ? data.authorTitle : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    featured: data.featured === true,
    readingMinutes: Math.max(1, Math.round(words / 220)),
    page,
  };
}

// Featured posts first, then newest first
export function getPosts(): BlogPost[] {
  return blogSource
    .getPages()
    .map(toPost)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.date.getTime() - a.date.getTime());
}

export function getPost(slug: string[]): BlogPost | undefined {
  const page = blogSource.getPage(slug);
  return page ? toPost(page) : undefined;
}

export function formatPostDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
