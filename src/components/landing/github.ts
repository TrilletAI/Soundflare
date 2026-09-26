'use client'

import { useEffect, useState } from 'react'

export const GITHUB_URL = 'https://github.com/TrilletAI/Soundflare'
export const SDK_GITHUB_URL = 'https://github.com/TrilletAI/soundflare-sdk'

// Shared across every component on the page so the GitHub API is hit once
let starsRequest: Promise<number | null> | null = null

function fetchStars() {
  starsRequest ??= fetch('https://api.github.com/repos/TrilletAI/Soundflare')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => (typeof data?.stargazers_count === 'number' ? data.stargazers_count : null))
    .catch(() => null)
  return starsRequest
}

// Live star count for the repo; null until loaded or if the GitHub API is unavailable
export function useGithubStars() {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    fetchStars().then((count) => {
      if (active) setStars(count)
    })
    return () => {
      active = false
    }
  }, [])

  return stars
}
