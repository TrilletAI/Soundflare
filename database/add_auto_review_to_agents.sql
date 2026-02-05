-- Add auto_review_enabled column to soundflare_agents
-- This column controls whether AI reviews are automatically triggered for call logs

ALTER TABLE public.soundflare_agents 
ADD COLUMN IF NOT EXISTS auto_review_enabled BOOLEAN DEFAULT true;

-- Set existing agents to have auto-review enabled by default
UPDATE public.soundflare_agents 
SET auto_review_enabled = true 
WHERE auto_review_enabled IS NULL;
