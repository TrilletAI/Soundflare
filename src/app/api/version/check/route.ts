import { NextResponse } from 'next/server'
import { APP_VERSION } from '@/lib/version'

const GITHUB_REPO = 'TrilletAI/Soundflare'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

let cache: { data: GitHubRelease; fetchedAt: number } | null = null

interface GitHubRelease {
  tag_name: string
  html_url: string
}

function compareVersions(current: string, latest: string): boolean {
  const normalize = (v: string) => v.replace(/^v/, '')
  const [cMajor, cMinor, cPatch] = normalize(current).split('.').map(Number)
  const [lMajor, lMinor, lPatch] = normalize(latest).split('.').map(Number)

  if (lMajor !== cMajor) return lMajor > cMajor
  if (lMinor !== cMinor) return lMinor > cMinor
  return lPatch > cPatch
}

async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data
  }

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
    {
      headers: { Accept: 'application/vnd.github.v3+json' },
      next: { revalidate: 3600 },
    }
  )

  if (!response.ok) return null

  const data = await response.json()
  cache = { data: { tag_name: data.tag_name, html_url: data.html_url }, fetchedAt: Date.now() }
  return cache.data
}

export async function GET() {
  try {
    const release = await fetchLatestRelease()

    if (!release) {
      return NextResponse.json({
        currentVersion: APP_VERSION,
        latestVersion: APP_VERSION,
        updateAvailable: false,
        releaseUrl: null,
      })
    }

    const latestVersion = release.tag_name.replace(/^v/, '')
    const updateAvailable = compareVersions(APP_VERSION, release.tag_name)

    return NextResponse.json({
      currentVersion: APP_VERSION,
      latestVersion,
      updateAvailable,
      releaseUrl: release.html_url,
    })
  } catch {
    return NextResponse.json({
      currentVersion: APP_VERSION,
      latestVersion: APP_VERSION,
      updateAvailable: false,
      releaseUrl: null,
    })
  }
}
