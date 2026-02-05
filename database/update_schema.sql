-- Add plans column to soundflare_projects
ALTER TABLE public.soundflare_projects 
ADD COLUMN IF NOT EXISTS plans jsonb DEFAULT '{}'::jsonb;

-- Add roles column to soundflare_users
ALTER TABLE public.soundflare_users 
ADD COLUMN IF NOT EXISTS roles jsonb DEFAULT '["user"]'::jsonb;
