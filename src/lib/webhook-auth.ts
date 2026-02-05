import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify webhook authorization header
 * @param request - NextRequest object
 * @param secretEnvVar - Environment variable name containing the secret
 * @returns NextResponse with error if unauthorized, null if authorized
 */
export function verifyWebhookAuth(
  request: NextRequest,
  secretEnvVar: string
): NextResponse | null {
  const authHeader = request.headers.get('authorization')
  const secret = process.env[secretEnvVar]

  if (!secret) {
    console.error(`[Webhook Auth] ${secretEnvVar} not configured`)
    return NextResponse.json(
      { success: false, error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  const expectedAuth = `Bearer ${secret}`

  if (!authHeader || authHeader !== expectedAuth) {
    console.error('[Webhook Auth] Unauthorized webhook attempt')
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return null // Authorized
}
