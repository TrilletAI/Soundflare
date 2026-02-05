import { supabaseServer } from '@/lib/supabase-server'
import type { CallLog } from '@/types/logs'
import type { CallReviewResult, CallReviewRecord } from '@/types/callReview'
import { GoogleAuth } from 'google-auth-library'
import path from 'path'

/**
 * Service for AI-powered call log review
 * Analyzes calls for API failures, wrong actions, and wrong outputs
 * Uses Google Gemini Flash for fast, cost-effective analysis
 */
export class CallReviewService {
  private static GOOGLE_PROJECT_ID = 'trilletai'
  private static GOOGLE_LOCATION = 'us-central1'
  private static MODEL = 'gemini-2.5-flash'
  private static CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.cwd(), 'src/credentials/google-credentials.json')
  private static SYSTEM_PROMPT = `# Call Log Validation System Prompt

You are a call log validator. Your role is to analyze logs containing transcripts and API calls to identify errors and inconsistencies.

## Data You Receive

You will receive a JSON object containing:
- **transcript**: The conversation between user and agent
- **agent_instructions**: The agent's system prompt/instructions (what the agent was told to do)
- **api_calls**: Array of API/tool calls made during the conversation, each containing:
  - name, operation, status
  - http_status (HTTP status code if applicable)
  - request (method, url, body)
  - response (status, body)
  - error (if any)
  - timestamp

## Your Task

Review the provided log and identify any errors across three categories. **ONLY flag concrete data conflicts and failures. Do NOT evaluate workflow quality, process optimization, or conversational flow.**

### 1. API_FAILURE
API returned an error status code:
- **4xx errors**: Client-side errors (400 Bad Request, 404 Not Found, 409 Conflict, etc.)
- **5xx errors**: Server-side errors (500 Internal Server Error, 503 Service Unavailable, etc.)
- **How to detect**: Check \`api_calls[]\` array for \`http_status\` >= 400 OR check \`error\` field

**Only flag when the API response contains an error status code.**

### 2. WRONG_ACTION
The system executed an action with different data than what the user explicitly requested OR violated the agent's explicit instructions:
- Example: User said "cancel appointment on Aug 7th" → System cancelled Aug 8th appointment
- Example: User said "book for 3 PM" → API request shows 4 PM
- Example: Agent instructions say "must confirm before cancelling" → Agent cancelled without confirmation
- **How to detect**: Compare user requests in \`transcript\` against \`api_calls\` AND cross-reference with \`agent_instructions\`

**CRITICAL RULES for WRONG_ACTION:**
- ONLY flag when there is an **explicit user request** with specific data (dates, times, names, IDs)
- ONLY flag when the API action uses **different data** than what the user stated
- ONLY flag when agent **explicitly violates** a clear instruction (not workflow preferences)
- DO NOT flag workflow decisions (when to transfer, when to collect data, call flow)
- DO NOT flag timing issues (premature actions, unnecessary transfers)
- DO NOT flag missing API calls unless user explicitly requested an action and NO API call was made
- DO NOT evaluate whether the action was optimal or appropriate

**Examples of WRONG_ACTION:**
- User: "Cancel my appointment on January 21st" → System cancels January 28th [FLAG THIS]
- User: "Book at 9:20 AM" → API request shows 10:20 AM [FLAG THIS]
- Instructions: "Never cancel without confirmation" → Agent cancels without asking [FLAG THIS]
- System transfers before collecting info → [DO NOT FLAG]
- System collects data in unusual order → [DO NOT FLAG]

### 3. WRONG_OUTPUT
The agent stated specific factual data that directly contradicts the API response:
- Example: Agent said "I have slots at 4:50 PM" → API shows only up to 4:40 PM
- Example: Agent said "You have 3 appointments" → API returned 5 appointments
- Example: Agent said "Your appointment is on Monday" → API shows Tuesday
- **How to detect**: Compare agent's statements in \`transcript\` with actual \`response.body\` data in \`api_calls\`

**CRITICAL RULES for WRONG_OUTPUT:**
- ONLY flag when agent states **specific factual data** (dates, times, counts, names, statuses)
- ONLY flag when this data **directly contradicts** what's in the API response
- DO NOT flag paraphrasing or summarization
- DO NOT flag reasonable interpretations of data
- DO NOT flag conversational variations
- DO NOT flag if the agent simply didn't mention all available data

**Examples of WRONG_OUTPUT:**
- Agent: "Available at 5:20 PM" → API shows no 5:20 PM slot [FLAG THIS]
- Agent: "Appointment cancelled" → API shows status as "Scheduled" [FLAG THIS]
- Agent summarizes without listing every detail → [DO NOT FLAG]
- Agent uses different phrasing than API → [DO NOT FLAG]

## Output Format

You must respond with ONLY valid JSON in this exact structure:

\`\`\`json
{
  "call_timestamp": "timestamp from the log",
  "analysis_date": "current date",
  "errors": [
    {
      "type": "API_FAILURE|WRONG_ACTION|WRONG_OUTPUT",
      "title": "Brief error title",
      "description": "Detailed explanation of what went wrong",
      "evidence": {
        "transcript_excerpt": "Relevant quote from transcript showing the issue",
        "api_request": "Relevant request data if applicable, null otherwise",
        "api_response": "Relevant response data if applicable, null otherwise",
        "expected": "What should have happened or been said",
        "actual": "What actually happened or was said"
      },
      "timestamp": "When this error occurred in the call",
      "impact": "Consequence of this error on the user/system"
    }
  ]
}
\`\`\`

If no errors are found, return:
\`\`\`json
{
  "call_timestamp": "timestamp from the log",
  "analysis_date": "current date",
  "errors": []
}
\`\`\`

## Important Guidelines

1. **Check all API calls**:
   - Review each item in \`api_calls[]\` array
   - Check \`http_status\` field for 4xx/5xx errors
   - Check \`error\` field for any error messages
   - Examine \`request\` and \`response\` for each call

2. **Validate agent behavior**:
   - Review \`agent_instructions\` for explicit behavioral rules
   - Only flag violations of clear, specific instructions (not general preferences)
   - Ensure actions in \`api_calls\` align with agent's defined behavior

3. **Focus on data conflicts only**:
   - Compare what the user explicitly requested vs. what was executed
   - Compare what the agent said vs. what the API returned
   - Verify explicit instruction violations only

4. **Be precise**: Include specific timestamps, values, and quotes in your evidence

5. **Be conservative**: When in doubt, do NOT flag. Only flag clear, unambiguous data mismatches

6. **Verify explicit requests**: Only flag WRONG_ACTION if the user made a specific request (e.g., "cancel on Aug 7th", "book at 3 PM")

7. **Verify stated facts**: Only flag WRONG_OUTPUT if the agent stated specific data (e.g., "4:50 PM available", "3 appointments found")

8. **Cross-reference carefully**: Verify dates, times, names, IDs, and counts match between transcript and API responses

9. **Check HTTP status codes**: Any 4xx or 5xx response is an API_FAILURE

10. **Ignore workflow quality**: Do not evaluate call flow, transfers, timing, or process decisions

11. **Output JSON only**: Do not include any explanatory text before or after the JSON

## What NOT to Flag

- Workflow decisions (when to transfer, when to collect data)
- Process optimization opportunities
- Conversational quality issues
- Paraphrasing or summarization choices
- Actions that seem "unnecessary" or "premature" but have no data conflict
- Missing data in responses (unless agent claimed data exists that doesn't)
- Violations of workflow preferences (only flag violations of explicit rules)

Begin your analysis.`

  /**
   * Extract only API/tool calls from metrics logs
   */
  private static extractApiCalls(telemetryData: any): any[] {
    if (!telemetryData?.session_traces || !Array.isArray(telemetryData.session_traces)) return []

    const apiCalls: any[] = []

    // Iterate through each metrics log entry
    telemetryData.session_traces.forEach((log: any) => {
      // Extract tool calls if present
      if (log.tool_calls && Array.isArray(log.tool_calls)) {
        log.tool_calls.forEach((tool: any) => {
          const truncateBody = (body: any) => {
            if (!body) return null
            const str = typeof body === 'string' ? body : JSON.stringify(body)
            // Increased from 1000 to 15000 to capture full API responses for AI review
            return str.length > 15000 ? str.substring(0, 15000) + '...[truncated]' : str
          }

          apiCalls.push({
            name: tool.name || tool.function_name || 'unknown',
            operation: 'tool_call',
            status: tool.status || (tool.success === false ? 'error' : 'success'),
            http_status: tool.http_status_code || null,
            request: {
              method: tool.request_method || null,
              url: tool.url || null,
              body: truncateBody(tool.arguments || tool.request_body),
            },
            response: {
              status: tool.response_status || null,
              body: truncateBody(tool.result || tool.response_body),
            },
            error: tool.error || (tool.success === false ? 'Tool call failed' : null),
            timestamp: log.unix_timestamp,
          })
        })
      }

      // Also check otel_spans for API calls
      if (log.otel_spans && Array.isArray(log.otel_spans)) {
        log.otel_spans.forEach((span: any) => {
          const opType = (span.name || '').toLowerCase()
          if (opType.includes('api') || opType.includes('http') || opType.includes('request')) {
            const truncateBody = (body: any) => {
              if (!body) return null
              const str = typeof body === 'string' ? body : JSON.stringify(body)
              // Increased from 1000 to 15000 to capture full API responses for AI review
              return str.length > 15000 ? str.substring(0, 15000) + '...[truncated]' : str
            }

            apiCalls.push({
              name: span.name,
              operation: span.kind || 'api_call',
              status: span.status?.code === 2 ? 'error' : 'success',
              http_status: span.attributes?.[' http.status_code'] || null,
              request: {
                method: span.attributes?.['http.method'] || null,
                url: span.attributes?.['http.url'] || null,
                body: truncateBody(span.attributes?.['http.request.body']),
              },
              response: {
                status: span.attributes?.['http.status_code'] || null,
                body: truncateBody(span.attributes?.['http.response.body']),
              },
              error: span.status?.message || null,
              timestamp: log.unix_timestamp,
            })
          }
        })
      }
    })

    return apiCalls
  }

  /**
   * Extract system prompt from agent configuration (truncate if too long)
   */
  private static extractSystemPrompt(config: any): string | null {
    if (!config) return null

    // Try multiple possible field names for the system prompt
    const prompt =
      config.system_prompt ||
      config.prompt ||
      config.instructions ||
      config.agent_prompt ||
      config.systemPrompt ||
      config.first_message ||
      (config.llm?.messages?.[0]?.content) ||
      null

    if (!prompt) return null

    // Truncate to 3000 chars if too long (increased from 2000)
    return prompt.length > 3000 ? prompt.substring(0, 3000) + '...[truncated]' : prompt
  }

  /**
   * Build transcript from metrics logs (user_transcript + agent_response)
   */
  private static buildTranscriptFromMetrics(metricsLogs: any[]): any[] {
    if (!metricsLogs || !Array.isArray(metricsLogs)) return []

    return metricsLogs
      .filter((log: any) => log.user_transcript || log.agent_response)
      .map((log: any) => {
        const truncate = (text: string) => {
          if (!text) return text
          return text.length > 1000 ? text.substring(0, 1000) + '...[truncated]' : text
        }

        const entry: any = {
          turn_id: log.turn_id,
          timestamp: log.unix_timestamp,
        }

        if (log.user_transcript) {
          entry.user = truncate(log.user_transcript)
        }

        if (log.agent_response) {
          entry.agent = truncate(log.agent_response)
        }

        // Include tool calls for this turn
        if (log.tool_calls && Array.isArray(log.tool_calls)) {
          entry.tool_calls = log.tool_calls.map((t: any) => ({
            name: t.name || t.function_name,
            arguments: t.arguments,
            result: t.result,
          }))
        }

        return entry
      })
  }

  /**
   * Simplify transcript to reduce token count while preserving key data
   */
  private static simplifyTranscript(transcript: any, metricsLogs?: any[]): any {
    // If transcript is empty/null and we have metrics logs, build from metrics
    if ((!transcript || (Array.isArray(transcript) && transcript.length === 0)) && metricsLogs) {
      return this.buildTranscriptFromMetrics(metricsLogs)
    }

    if (!transcript) return null
    if (!Array.isArray(transcript)) return transcript

    // Keep all messages but truncate long content
    return transcript.map((item: any) => {
      // Handle different transcript formats
      const result: any = {}

      // Preserve role if present
      if (item.role) result.role = item.role

      // Handle content field
      if (item.content) {
        if (typeof item.content === 'string') {
          result.content = item.content.length > 1000
            ? item.content.substring(0, 1000) + '...[truncated]'
            : item.content
        } else {
          result.content = item.content
        }
      }

      // Preserve user_transcript and agent_response fields (alternative format)
      if (item.user_transcript) {
        result.user_transcript = item.user_transcript.length > 1000
          ? item.user_transcript.substring(0, 1000) + '...[truncated]'
          : item.user_transcript
      }

      if (item.agent_response) {
        result.agent_response = item.agent_response.length > 1000
          ? item.agent_response.substring(0, 1000) + '...[truncated]'
          : item.agent_response
      }

      // Preserve any tool_calls or function_calls (important for validation)
      if (item.tool_calls) result.tool_calls = item.tool_calls
      if (item.function_calls) result.function_calls = item.function_calls

      return result
    })
  }

  /**
   * Prepare call log data for AI review
   * Uses aggressive filtering to stay within token limits
   */
  private static prepareCallLogForReview(callLog: CallLog): string {
    const fullConfig = (callLog as any).complete_configuration || callLog.metadata?.complete_configuration
    const fullTelemetry = (callLog as any).telemetry_data
    const metricsLogs = fullTelemetry?.session_traces

    const data = {
      call_id: callLog.call_id,
      call_timestamp: callLog.call_started_at,
      duration_seconds: callLog.duration_seconds,
      call_status: callLog.call_ended_reason,

      // Build transcript from metrics logs if transcript_json is empty
      transcript: this.simplifyTranscript(callLog.transcript_json, metricsLogs),

      // Agent's system prompt (truncated to 3000 chars)
      agent_instructions: this.extractSystemPrompt(fullConfig),

      // API calls only (with truncated bodies)
      api_calls: this.extractApiCalls(fullTelemetry),
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * Get Google Cloud access token using service account
   */
  private static async getAccessToken(): Promise<string> {
    const auth = new GoogleAuth({
      keyFile: this.CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })

    const client = await auth.getClient()
    const accessToken = await client.getAccessToken()

    if (!accessToken.token) {
      throw new Error('Failed to get access token')
    }

    return accessToken.token
  }

  /**
   * Call Gemini API to analyze the call log
   */
  private static async analyzeWithGemini(callLogData: string): Promise<CallReviewResult> {
    const accessToken = await this.getAccessToken()
    const endpoint = `https://${this.GOOGLE_LOCATION}-aiplatform.googleapis.com/v1/projects/${this.GOOGLE_PROJECT_ID}/locations/${this.GOOGLE_LOCATION}/publishers/google/models/${this.MODEL}:generateContent`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${this.SYSTEM_PROMPT}\n\nAnalyze this call log:\n\n${callLogData}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      throw new Error('No content in Gemini response')
    }

    // Parse the JSON response
    const reviewResult: CallReviewResult = JSON.parse(content)
    return reviewResult
  }

  /**
   * Store review result in database
   */
  private static async storeReviewResult(
    callLogId: string,
    agentId: string,
    reviewResult: CallReviewResult,
  ): Promise<void> {
    const errorCount = reviewResult.errors.length
    const hasApiFailures = reviewResult.errors.some((e) => e.type === 'API_FAILURE')
    const hasWrongActions = reviewResult.errors.some((e) => e.type === 'WRONG_ACTION')
    const hasWrongOutputs = reviewResult.errors.some((e) => e.type === 'WRONG_OUTPUT')

    const reviewRecord: Partial<CallReviewRecord> = {
      call_log_id: callLogId,
      agent_id: agentId,
      status: 'completed',
      review_result: reviewResult,
      error_count: errorCount,
      has_api_failures: hasApiFailures,
      has_wrong_actions: hasWrongActions,
      has_wrong_outputs: hasWrongOutputs,
      reviewed_at: new Date().toISOString(),
    }

    const { error } = await supabaseServer.from('call_reviews').upsert(reviewRecord, {
      onConflict: 'call_log_id',
    })

    if (error) {
      throw new Error(`Failed to store review result: ${error.message}`)
    }

    // Broadcast update via SSE
    if (globalThis.sseConnectionStore) {
      globalThis.sseConnectionStore.broadcastCallReview(callLogId, {
        callLogId,
        status: 'completed',
        errorCount,
        hasApiFailures,
        hasWrongActions,
        hasWrongOutputs,
      })
      console.log('[CallReviewService] Broadcasted completed review:', callLogId)
    }
  }

  /**
   * Mark review as failed
   */
  private static async markReviewFailed(
    callLogId: string,
    agentId: string,
    errorMessage: string,
  ): Promise<void> {
    const reviewRecord: Partial<CallReviewRecord> = {
      call_log_id: callLogId,
      agent_id: agentId,
      status: 'failed',
      error_message: errorMessage,
    }

    await supabaseServer.from('call_reviews').upsert(reviewRecord, {
      onConflict: 'call_log_id',
    })

    // Broadcast update via SSE
    if (globalThis.sseConnectionStore) {
      globalThis.sseConnectionStore.broadcastCallReview(callLogId, {
        callLogId,
        status: 'failed',
        errorMessage,
      })
      console.log('[CallReviewService] Broadcasted failed review:', callLogId)
    }
  }

  /**
   * Fetch agent configuration from DynamoDB
   */
  private static async fetchAgentConfig(callLogId: string): Promise<any> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/agent-config-by-log-id/${callLogId}`)

      if (!response.ok) {
        console.warn(`Agent config not found for log ${callLogId}`)
        return null
      }

      const data = await response.json()
      return data.full_config
    } catch (error) {
      console.error('Failed to fetch agent config:', error)
      return null
    }
  }

  /**
   * Fetch telemetry data from metrics logs table
   */
  private static async fetchTelemetryData(callLogId: string): Promise<any> {
    try {
      const { data, error } = await supabaseServer
        .from('soundflare_metrics_logs')
        .select('*')
        .eq('session_id', callLogId)
        .order('unix_timestamp', { ascending: true })

      if (error) {
        console.error('Failed to fetch telemetry:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to fetch telemetry:', error)
      return null
    }
  }

  /**
   * Review a single call log
   */
  static async reviewCallLog(callLog: CallLog): Promise<CallReviewResult> {
    try {
      // Mark as processing
      await supabaseServer.from('call_reviews').upsert(
        {
          call_log_id: callLog.id,
          agent_id: callLog.agent_id,
          status: 'processing',
        },
        { onConflict: 'call_log_id' },
      )

      // Broadcast processing status via SSE
      if (globalThis.sseConnectionStore) {
        globalThis.sseConnectionStore.broadcastCallReview(callLog.id, {
          callLogId: callLog.id,
          status: 'processing',
        })
        console.log('[CallReviewService] Broadcasted processing status:', callLog.id)
      }

      // Fetch agent configuration from DynamoDB
      const agentConfig = await this.fetchAgentConfig(callLog.id)

      // Fetch telemetry data from metrics logs
      const telemetryLogs = await this.fetchTelemetryData(callLog.id)

      // Prepare enriched call log with all data
      const enrichedCallLog = {
        ...callLog,
        complete_configuration: agentConfig,
        telemetry_data: { session_traces: telemetryLogs || [] },
      }

      // Prepare data for review
      const callLogData = this.prepareCallLogForReview(enrichedCallLog as any)

      // Call Gemini for analysis
      const reviewResult = await this.analyzeWithGemini(callLogData)

      // Store result
      await this.storeReviewResult(callLog.id, callLog.agent_id, reviewResult)

      return reviewResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.markReviewFailed(callLog.id, callLog.agent_id, errorMessage)
      throw error
    }
  }

  /**
   * Get review status for a call log
   */
  static async getReviewStatus(callLogId: string): Promise<CallReviewRecord | null> {
    const { data, error } = await supabaseServer
      .from('call_reviews')
      .select('*')
      .eq('call_log_id', callLogId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No review found
        return null
      }
      throw new Error(`Failed to get review status: ${error.message}`)
    }

    return data as CallReviewRecord
  }

  /**
   * Get review statuses for multiple call logs
   */
  static async getReviewStatuses(callLogIds: string[]): Promise<Map<string, CallReviewRecord>> {
    const { data, error } = await supabaseServer
      .from('call_reviews')
      .select('*')
      .in('call_log_id', callLogIds)

    if (error) {
      throw new Error(`Failed to get review statuses: ${error.message}`)
    }

    const reviewMap = new Map<string, CallReviewRecord>()
    if (data) {
      data.forEach((review: any) => {
        reviewMap.set(review.call_log_id, review as CallReviewRecord)
      })
    }

    return reviewMap
  }

  /**
   * Queue review for a call log (creates pending record for Supabase trigger)
   */
  static async queueReview(callLogId: string, agentId: string): Promise<void> {
    try {
      // Insert/update pending review record
      // Supabase trigger will detect this and call the webhook
      const { error } = await supabaseServer.from('call_reviews').upsert(
        {
          call_log_id: callLogId,
          agent_id: agentId,
          status: 'pending',
        },
        { onConflict: 'call_log_id' }
      )

      if (error) {
        throw new Error(`Failed to create pending review: ${error.message}`)
      }

      // Broadcast pending status via SSE
      if (globalThis.sseConnectionStore) {
        globalThis.sseConnectionStore.broadcastCallReview(callLogId, {
          callLogId,
          status: 'pending',
        })
        console.log('[CallReviewService] Broadcasted pending status:', callLogId)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to queue review: ${errorMessage}`)
    }
  }

}
