// Types for AI-powered call log review system

export type CallReviewErrorType = 'API_FAILURE' | 'WRONG_ACTION' | 'WRONG_OUTPUT'

export interface CallReviewError {
  type: CallReviewErrorType
  title: string
  description: string
  evidence: {
    transcript_excerpt: string | null
    api_request: string | null
    api_response: string | null
    expected: string
    actual: string
  }
  timestamp: string
  impact: string
}

export interface CallReviewResult {
  call_timestamp: string
  analysis_date: string
  errors: CallReviewError[]
}

export interface CallReviewRecord {
  id?: string
  call_log_id: string
  agent_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  review_result: CallReviewResult | null
  error_count: number
  has_api_failures: boolean
  has_wrong_actions: boolean
  has_wrong_outputs: boolean
  error_message: string | null
  created_at?: string
  updated_at?: string
  reviewed_at?: string
}

export interface CallReviewSummary {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorCount: number
  hasErrors: boolean
  errors: CallReviewError[]
}
