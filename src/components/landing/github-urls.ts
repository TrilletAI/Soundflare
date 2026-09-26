// Plain strings shared by server and client components.
// Keep these out of github.ts: that module is 'use client', and importing
// its exports into a server component turns them into client-boundary stubs.
export const GITHUB_URL = 'https://github.com/TrilletAI/Soundflare'
export const SDK_GITHUB_URL = 'https://github.com/TrilletAI/soundflare-sdk'
