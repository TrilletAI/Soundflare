import { NextResponse } from 'next/server'
import { ApiResponse } from '../types/logs'

/**
 * Create a standardized JSON success response (App Router).
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  }
  return NextResponse.json(body, { status })
}

/**
 * Create a standardized JSON error response (App Router).
 */
export function createErrorResponse(error: string, status = 500): NextResponse {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error,
    timestamp: new Date().toISOString(),
  }
  return NextResponse.json(body, { status })
}
