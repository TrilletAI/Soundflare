// Keep these in a module without 'use client'. Next.js turns every export of a
// client module into a client reference, so a server component that interpolates
// GITHUB_URL (footer, blog) stringifies the stub instead of the URL.
export const GITHUB_URL = 'https://github.com/TrilletAI/Soundflare'
export const SDK_GITHUB_URL = 'https://github.com/TrilletAI/soundflare-sdk'
