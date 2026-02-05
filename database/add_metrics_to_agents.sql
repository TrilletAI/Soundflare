-- Add metrics column to soundflare_agents
ALTER TABLE public.soundflare_agents ADD COLUMN IF NOT EXISTS metrics jsonb DEFAULT '{}'::jsonb;
