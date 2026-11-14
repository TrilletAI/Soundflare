'use client'

import { useEffect, useState } from 'react'
import { GITHUB_URL } from './github-urls'

// Shared across every component on the page so the GitHub API is hit once
let starsRequest: Promise<number | null> | null = null

function fetchStars() {
  const repo = GITHUB_URL.replace(/^https:\/\/github\.com\//, '')
  starsRequest ??= fetch(`https://api.github.com/repos/${repo}`)
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
