-- 1. Create the missing Materialized View
-- This view aggregates call logs for the dashboard
DROP MATERIALIZED VIEW IF EXISTS public.call_summary_materialized CASCADE;

CREATE MATERIALIZED VIEW public.call_summary_materialized AS
SELECT
  agent_id,
  DATE(created_at) AS call_date,
  COUNT(*) AS calls,
  SUM(duration_seconds) AS total_seconds,
  ROUND(SUM(duration_seconds)::numeric / 60, 0) AS total_minutes,
  SUM(billing_duration_seconds) AS total_billing_seconds,
  ROUND(SUM(billing_duration_seconds)::numeric / 60, 0) AS total_billing_minutes,
  AVG(avg_latency) AS avg_latency,
  COUNT(DISTINCT call_id) AS unique_customers,
  COUNT(*) FILTER (WHERE call_ended_reason = 'completed') AS successful_calls,
  ROUND(
    (COUNT(*) FILTER (WHERE call_ended_reason = 'completed')::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS success_rate,
  -- Telecom cost only for completed calls (₹ 0.70 per started minute)
  SUM(
    CEIL(duration_seconds::numeric / 60)
  ) FILTER (WHERE call_ended_reason = 'completed') * 0.70 AS telecom_cost,
  -- Total LLM+TTS+STT cost only for completed calls
  (
    COALESCE(SUM(total_llm_cost) FILTER (WHERE call_ended_reason = 'completed'), 0)
    + COALESCE(SUM(total_tts_cost) FILTER (WHERE call_ended_reason = 'completed'), 0)
    + COALESCE(SUM(total_stt_cost) FILTER (WHERE call_ended_reason = 'completed'), 0)
    + SUM(CEIL(duration_seconds::numeric / 60)) FILTER (WHERE call_ended_reason = 'completed') * 0.70
  )::numeric(16, 2) AS total_cost
FROM soundflare_call_logs
GROUP BY agent_id, DATE(created_at);

-- 2. Create the unique index for performance and concurrent refreshes
CREATE UNIQUE INDEX call_summary_agent_date_idx
  ON public.call_summary_materialized (agent_id, call_date);

-- 3. Grant permissions so the API can read it
GRANT SELECT ON public.call_summary_materialized TO anon, authenticated, service_role;

-- 4. Re-create the refresh function to ensure it's linked correctly
CREATE OR REPLACE FUNCTION public.refresh_call_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.call_summary_materialized;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_call_summary() TO anon, authenticated, service_role;

-- 5. Force schema reload
NOTIFY pgrst, 'reload schema';
