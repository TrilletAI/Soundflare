-- Fix All Missing Columns Migration
-- Run this entire script in your Supabase SQL Editor to resolve all schema errors

-- 1. Add metrics column to soundflare_agents
ALTER TABLE public.soundflare_agents 
ADD COLUMN IF NOT EXISTS metrics jsonb DEFAULT '{}'::jsonb;

-- 2. Add metrics column to soundflare_call_logs
ALTER TABLE public.soundflare_call_logs 
ADD COLUMN IF NOT EXISTS metrics jsonb DEFAULT '{}'::jsonb;

-- 3. Add metrics column to soundflare_call_logs_backup
ALTER TABLE public.soundflare_call_logs_backup 
ADD COLUMN IF NOT EXISTS metrics jsonb DEFAULT '{}'::jsonb;

-- 4. Add billing_duration_seconds to soundflare_call_logs
ALTER TABLE public.soundflare_call_logs 
ADD COLUMN IF NOT EXISTS billing_duration_seconds int4;

-- 5. Add billing_duration_seconds to soundflare_call_logs_backup
ALTER TABLE public.soundflare_call_logs_backup 
ADD COLUMN IF NOT EXISTS billing_duration_seconds int4;

-- 6. Update call_summary_materialized view
-- First drop it
DROP MATERIALIZED VIEW IF EXISTS call_summary_materialized CASCADE;

-- Recreate it with new columns
CREATE MATERIALIZED VIEW call_summary_materialized AS
SELECT
  agent_id,
  DATE(created_at) AS call_date,
  COUNT(*) AS calls,
  SUM(duration_seconds) AS total_seconds,
  ROUND(SUM(duration_seconds)::numeric / 60, 0) AS total_minutes,
  -- New billing fields
  SUM(billing_duration_seconds) AS total_billing_seconds,
  ROUND(SUM(billing_duration_seconds)::numeric / 60, 0) AS total_billing_minutes,
  -- End new billing fields
  AVG(avg_latency) AS avg_latency,
  COUNT(DISTINCT call_id) AS unique_customers,
  COUNT(*) FILTER (WHERE call_ended_reason = 'completed') AS successful_calls,
  ROUND(
    (COUNT(*) FILTER (WHERE call_ended_reason = 'completed')::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS success_rate,
  SUM(
    CEIL(duration_seconds::numeric / 60)
  ) FILTER (WHERE call_ended_reason = 'completed') * 0.70 AS telecom_cost,
  (
    COALESCE(SUM(total_llm_cost) FILTER (WHERE call_ended_reason = 'completed'), 0)
    + COALESCE(SUM(total_tts_cost) FILTER (WHERE call_ended_reason = 'completed'), 0)
    + COALESCE(SUM(total_stt_cost) FILTER (WHERE call_ended_reason = 'completed'), 0)
    + SUM(CEIL(duration_seconds::numeric / 60)) FILTER (WHERE call_ended_reason = 'completed') * 0.70
  )::numeric(16, 2) AS total_cost
FROM soundflare_call_logs
GROUP BY agent_id, DATE(created_at);

-- Recreate index
CREATE UNIQUE INDEX call_summary_agent_date_idx
  ON call_summary_materialized (agent_id, call_date);

-- Refresh the view
REFRESH MATERIALIZED VIEW CONCURRENTLY call_summary_materialized;
