import { NextResponse } from 'next/server'

/**
 * Safely extract an error message from an unknown catch value.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

/**
 * Get a required environment variable or return a 500 error response.
 * Use inside route handlers:
 *
 *   const baseUrl = requireEnv('API_BASE_URL')
 *   if (baseUrl instanceof NextResponse) return baseUrl
 */
export function requireEnv(name: string): string | NextResponse {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing required environment variable: ${name}`)
    return NextResponse.json(
      { error: `Server configuration error: ${name} is not configured` },
      { status: 500 }
    )
  }
  return value
}
