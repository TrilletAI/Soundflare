-- Add metrics column to soundflare_call_logs
ALTER TABLE public.soundflare_call_logs ADD COLUMN IF NOT EXISTS metrics jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.soundflare_call_logs_backup ADD COLUMN IF NOT EXISTS metrics jsonb DEFAULT '{}'::jsonb;
