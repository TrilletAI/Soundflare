-- Pipeline Analytics: Materialized view for efficient latency aggregation
-- Run this in Supabase SQL Editor after setup-supabase.sql
--
-- This view pre-aggregates per-turn pipeline latency metrics (STT, LLM TTFT,
-- TTS TTFB, EOU delay) from soundflare_metrics_logs so the analytics dashboard
-- can query summaries without scanning the full table every time.

-- 1. Create materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.pipeline_analytics_daily AS
SELECT
    ml.session_id,
    cl.agent_id,
    DATE(cl.call_started_at) AS call_date,
    EXTRACT(HOUR FROM cl.call_started_at) AS call_hour,

    -- STT duration (seconds)
    AVG((ml.stt_metrics->>'duration')::numeric)
        FILTER (WHERE ml.stt_metrics->>'duration' IS NOT NULL)
        AS avg_stt_duration,

    -- LLM time-to-first-token (seconds)
    AVG((ml.llm_metrics->>'ttft')::numeric)
        FILTER (WHERE ml.llm_metrics->>'ttft' IS NOT NULL)
        AS avg_llm_ttft,

    -- TTS time-to-first-byte (seconds)
    AVG((ml.tts_metrics->>'ttfb')::numeric)
        FILTER (WHERE ml.tts_metrics->>'ttfb' IS NOT NULL)
        AS avg_tts_ttfb,

    -- End-of-utterance delay (seconds)
    AVG((ml.eou_metrics->>'end_of_utterance_delay')::numeric)
        FILTER (WHERE ml.eou_metrics->>'end_of_utterance_delay' IS NOT NULL)
        AS avg_eou_delay,

    -- Turn count for weighting
    COUNT(*) AS turn_count

FROM public.soundflare_metrics_logs ml
JOIN public.soundflare_call_logs cl
    ON ml.session_id = cl.id
WHERE cl.call_started_at IS NOT NULL
GROUP BY ml.session_id, cl.agent_id, DATE(cl.call_started_at), EXTRACT(HOUR FROM cl.call_started_at);

-- 2. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_pipeline_analytics_agent_date
    ON public.pipeline_analytics_daily (agent_id, call_date);

-- 3. Refresh function (call from cron or API)
CREATE OR REPLACE FUNCTION public.refresh_pipeline_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.pipeline_analytics_daily;
END;
$$;

-- 4. P95 helper — returns the 95th-percentile latency for a date range
CREATE OR REPLACE FUNCTION public.pipeline_p95_latency(
    p_agent_id uuid,
    p_from date,
    p_to date
)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
    SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY cl.avg_latency)
    FROM public.soundflare_call_logs cl
    WHERE cl.agent_id = p_agent_id
      AND cl.call_started_at >= p_from
      AND cl.call_started_at <  (p_to + INTERVAL '1 day')
      AND cl.avg_latency IS NOT NULL;
$$;

-- 5. RLS policy (mirrors existing call_logs policy)
ALTER MATERIALIZED VIEW public.pipeline_analytics_daily OWNER TO postgres;
