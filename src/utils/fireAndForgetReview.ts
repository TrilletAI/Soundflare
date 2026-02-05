/**
 *  utility for triggering AI reviews
 * 
 * This utility provides a non-blocking way to trigger AI reviews for call logs.
 * The review is processed asynchronously in the background without blocking the
 * main API response.
 * 
 * Usage:
 * ```typescript
 * import { triggerAIReviewFireAndForget } from '@/utils/fireAndForgetReview'
 * 
 * // Trigger review without waiting
 * triggerAIReviewFireAndForget(callLogId, agentId)
 * ```
 */

/**
 * Trigger AI review for a call log without blocking
 * 
 * This function:
 * 1. Doesn't return a Promise that needs to be awaited
 * 2. Catches all errors internally
 * 3. Logs errors but doesn't throw
 * 4. Returns immediately
 * 
 * @param callLogId - The ID of the call log to review
 * @param agentId - The ID of the agent that handled the call
 */
export function triggerAIReviewFireAndForget(
  callLogId: string,
  agentId: string
): void {
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/ai-review`
    : 'http://localhost:8000/api/internal/ai-review';
  
  const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET || '';
  
  // no await
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${webhookSecret}`,
    },
    body: JSON.stringify({
      call_log_id: callLogId,
      agent_id: agentId,
    }),
  }).catch(err => {
    // Log error but don't throw
    console.error('⚠️ Background AI review webhook failed (non-blocking):', err.message);
  });
  
  console.log(`🤖 AI Review triggered for call log: ${callLogId} (processing in background)`);
}

/**
 * Trigger AI review with explicit async/await pattern (returns a Promise)
 * 
 * Use this when you want to wait for the webhook call to complete,
 * but still process the review in the background.
 * 
 * @param callLogId - The ID of the call log to review
 * @param agentId - The ID of the agent that handled the call
 */
export async function triggerAIReviewAsync(
  callLogId: string,
  agentId: string
): Promise<void> {
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/ai-review`
    : 'http://localhost:8000/api/internal/ai-review';
  
  const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET || '';
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`,
      },
      body: JSON.stringify({
        call_log_id: callLogId,
        agent_id: agentId,
      }),
    });
    
    console.log(`🤖 AI Review webhook called for call log: ${callLogId}`);
  } catch (err) {
    console.error('⚠️ AI review webhook failed:', err);
    throw err; // Re-throw so caller can handle
  }
}
