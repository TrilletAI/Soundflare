-- Initial Setup and Schema for SoundFlare
-- This script runs during Docker initialization

-- 1. Create Roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
END
$$;

-- 2. Create Schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Public Schema Tables (From setup-supabase.sql)

-- User management
CREATE TABLE IF NOT EXISTS public.soundflare_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text,
    first_name text,
    last_name text,
    profile_image_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    clerk_id text,
    is_active boolean DEFAULT true,
    roles jsonb DEFAULT '["user"]'::jsonb
);

-- Projects
CREATE TABLE IF NOT EXISTS public.soundflare_projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar,
    description text,
    environment varchar,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    is_active boolean DEFAULT true,
    retry_configuration jsonb,
    token_hash text,
    owner_clerk_id text,
    campaign_config jsonb,
    plans jsonb DEFAULT '{}'::jsonb
);

-- Agents
CREATE TABLE IF NOT EXISTS public.soundflare_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid,
    name varchar,
    agent_type varchar,
    configuration jsonb,
    environment varchar,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    is_active boolean DEFAULT true,
    user_id uuid,
    field_extractor boolean,
    field_extractor_prompt text,
    field_extractor_keys jsonb,
    metrics jsonb DEFAULT '{}'::jsonb,
    auto_review_enabled boolean DEFAULT true
);

-- Email project mapping
CREATE TABLE IF NOT EXISTS public.soundflare_email_project_mapping (
    id serial PRIMARY KEY,
    email text,
    project_id uuid,
    role text,
    permissions jsonb,
    added_by_clerk_id text,
    created_at timestamp with time zone DEFAULT now(),
    clerk_id text,
    is_active boolean DEFAULT true
);

-- API Keys
CREATE TABLE IF NOT EXISTS public.soundflare_api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    user_clerk_id text NOT NULL,
    token_hash text NOT NULL,
    token_hash_master text NOT NULL,
    masked_key varchar(50) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    last_used timestamp
);

-- Call logging tables
CREATE TABLE IF NOT EXISTS public.soundflare_call_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id varchar,
    agent_id uuid,
    customer_number varchar,
    call_ended_reason varchar,
    transcript_type varchar,
    transcript_json jsonb,
    metadata jsonb,
    dynamic_variables jsonb,
    environment varchar,
    created_at timestamp with time zone DEFAULT now(),
    call_started_at timestamp with time zone,
    call_ended_at timestamp with time zone,
    duration_seconds int4,
    recording_url text,
    voice_recording_url text,
    avg_latency float8,
    transcription_metrics jsonb,
    total_stt_cost float8,
    total_tts_cost float8,
    total_llm_cost float8,
    complete_configuration jsonb,
    telemetry_data jsonb,
    telemetry_analytics jsonb,
    billing_duration_seconds int4,
    metrics jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.call_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    call_log_id uuid NOT NULL,
    agent_id uuid NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    review_result jsonb,
    error_count int4 DEFAULT 0,
    has_api_failures boolean DEFAULT false,
    has_wrong_actions boolean DEFAULT false,
    has_wrong_outputs boolean DEFAULT false,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    CONSTRAINT call_reviews_call_log_id_key UNIQUE (call_log_id),
    CONSTRAINT call_reviews_status_check CHECK (
        status IN ('pending', 'processing', 'completed', 'failed')
    )
);

-- Trigger for public.soundflare_users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.soundflare_users (
    id,
    clerk_id,
    email,
    first_name,
    last_name,
    profile_image_url
  )
  values (
    new.id,
    new.id::text,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  return new;
end;
$$ language plpgsql security definer;