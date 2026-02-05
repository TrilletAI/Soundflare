-- ============================================
-- LATEST DATABASE SCHEMA DEFINITIONS
-- ============================================
-- Collected table definitions from production database
-- This file is used to track incoming schema definitions
-- Will be compiled into setup-supabase.sql when complete
-- ============================================

-- ============================================
-- TABLE 1: audio_api_pricing
-- ============================================
CREATE TABLE public.audio_api_pricing (
    service_type text NULL,
    provider text NULL,
    model_or_plan text NULL,
    unit text NULL,
    cost_usd_per_unit numeric NULL,
    valid_from date NULL,
    source_url text NULL
) TABLESPACE pg_default;

-- ============================================
-- TABLE 2: call_reviews
-- ============================================
CREATE TABLE public.call_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    call_log_id uuid NOT NULL,
    agent_id uuid NOT NULL,
    status character varying(20) NOT NULL DEFAULT 'pending'::character varying,
    review_result jsonb NULL,
    error_count integer NULL DEFAULT 0,
    has_api_failures boolean NULL DEFAULT false,
    has_wrong_actions boolean NULL DEFAULT false,
    has_wrong_outputs boolean NULL DEFAULT false,
    error_message text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    reviewed_at timestamp with time zone NULL,
    CONSTRAINT call_reviews_pkey PRIMARY KEY (id),
    CONSTRAINT call_reviews_call_log_id_key UNIQUE (call_log_id),
    CONSTRAINT fk_call_reviews_call_log FOREIGN KEY (call_log_id) 
        REFERENCES public.soundflare_call_logs (id) ON DELETE CASCADE,
    CONSTRAINT call_reviews_status_check CHECK (
        (status)::text = ANY (
            ARRAY[
                ('pending'::character varying)::text,
                ('processing'::character varying)::text,
                ('completed'::character varying)::text,
                ('failed'::character varying)::text
            ]
        )
    )
) TABLESPACE pg_default;

-- Indexes for call_reviews
CREATE INDEX IF NOT EXISTS idx_call_reviews_agent_id 
    ON public.call_reviews USING btree (agent_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_call_reviews_call_log_id 
    ON public.call_reviews USING btree (call_log_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_call_reviews_error_count 
    ON public.call_reviews USING btree (error_count)
    WHERE (error_count > 0) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_call_reviews_has_api_failures 
    ON public.call_reviews USING btree (has_api_failures)
    WHERE (has_api_failures = true) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_call_reviews_has_wrong_actions 
    ON public.call_reviews USING btree (has_wrong_actions)
    WHERE (has_wrong_actions = true) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_call_reviews_has_wrong_outputs 
    ON public.call_reviews USING btree (has_wrong_outputs)
    WHERE (has_wrong_outputs = true) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_call_reviews_status 
    ON public.call_reviews USING btree (status) TABLESPACE pg_default;

-- Trigger for call_reviews
CREATE TRIGGER call_reviews_updated_at 
    BEFORE UPDATE ON public.call_reviews 
    FOR EACH ROW
    EXECUTE FUNCTION update_call_reviews_updated_at();

-- ============================================
-- TABLE 3: gpt_api_pricing
-- ============================================
CREATE TABLE public.gpt_api_pricing (
    model_name text NULL,
    input_usd_per_million numeric NULL,
    output_usd_per_million numeric NULL,
    created_at timestamp with time zone NULL DEFAULT now()
) TABLESPACE pg_default;

-- ============================================
-- TABLE 4: gpt_api_pricing_inr
-- ============================================
CREATE TABLE public.gpt_api_pricing_inr (
    model_name text NULL,
    input_inr_per_million numeric NULL,
    output_inr_per_million numeric NULL,
    rate_date date NULL,
    created_at timestamp with time zone NULL DEFAULT now()
) TABLESPACE pg_default;

-- ============================================
-- TABLE 5: soundflare_agent_call_log_views
-- ============================================
CREATE TABLE public.soundflare_agent_call_log_views (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    agent_id uuid NULL,
    name text NULL,
    filters jsonb NULL,
    visible_columns jsonb NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL,
    CONSTRAINT soundflare_agent_call_log_views_pkey PRIMARY KEY (id),
    CONSTRAINT fk_agent_views_agent_id FOREIGN KEY (agent_id) 
        REFERENCES public.soundflare_agents (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================
-- TABLE 6: soundflare_agent_dropoff_settings
-- ============================================
CREATE TABLE public.soundflare_agent_dropoff_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    agent_id uuid NOT NULL,
    agent_name character varying NULL,
    enabled boolean NULL DEFAULT false,
    dropoff_message text NULL,
    delay_minutes integer NOT NULL DEFAULT 5,
    max_retries integer NOT NULL DEFAULT 2,
    context_dropoff_prompt text NULL,
    sip_trunk_id character varying NULL,
    phone_number_id uuid NULL,
    is_active boolean NULL DEFAULT true,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT soundflare_agent_dropoff_settings_pkey PRIMARY KEY (id),
    CONSTRAINT fk_dropoff_agent_id FOREIGN KEY (agent_id) 
        REFERENCES public.soundflare_agents (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for soundflare_agent_dropoff_settings
CREATE INDEX IF NOT EXISTS idx_dropoff_settings_active 
    ON public.soundflare_agent_dropoff_settings USING btree (is_active)
    WHERE (is_active = true) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dropoff_settings_agent 
    ON public.soundflare_agent_dropoff_settings USING btree (agent_id) TABLESPACE pg_default;

-- Trigger for soundflare_agent_dropoff_settings
CREATE TRIGGER trigger_update_dropoff_settings_updated_at 
    BEFORE UPDATE ON public.soundflare_agent_dropoff_settings 
    FOR EACH ROW
    EXECUTE FUNCTION update_dropoff_settings_updated_at();

-- ============================================
-- TABLE 7: soundflare_agents
-- ============================================
CREATE TABLE public.soundflare_agents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NULL,
    name character varying NULL,
    agent_type character varying NULL,
    configuration jsonb NULL,
    environment character varying NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL,
    is_active boolean NULL DEFAULT true,
    user_id uuid NULL,
    field_extractor boolean NULL,
    field_extractor_prompt text NULL,
    field_extractor_keys jsonb NULL,
    metrics jsonb NULL DEFAULT '{}'::jsonb,
    auto_review_enabled boolean NULL DEFAULT true,
    CONSTRAINT soundflare_agents_pkey PRIMARY KEY (id),
    CONSTRAINT fk_agents_project_id FOREIGN KEY (project_id) 
        REFERENCES public.soundflare_projects (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================
-- TABLE 8: soundflare_api_keys
-- ============================================
CREATE TABLE public.soundflare_api_keys (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    user_clerk_id text NOT NULL,
    token_hash text NOT NULL,
    token_hash_master text NOT NULL,
    masked_key character varying(50) NOT NULL,
    created_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP,
    last_used timestamp without time zone NULL,
    CONSTRAINT soundflare_api_keys_pkey PRIMARY KEY (id),
    CONSTRAINT fk_api_keys_project_id FOREIGN KEY (project_id) 
        REFERENCES public.soundflare_projects (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================
-- TABLE 9: soundflare_call_logs
-- ============================================
CREATE TABLE public.soundflare_call_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    call_id character varying NULL,
    agent_id uuid NULL,
    customer_number character varying NULL,
    call_ended_reason character varying NULL,
    transcript_type character varying NULL,
    transcript_json jsonb NULL,
    metadata jsonb NULL,
    dynamic_variables jsonb NULL,
    environment character varying NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    call_started_at timestamp with time zone NULL,
    call_ended_at timestamp with time zone NULL,
    duration_seconds integer NULL,
    recording_url text NULL,
    voice_recording_url text NULL,
    avg_latency double precision NULL,
    transcription_metrics jsonb NULL,
    total_stt_cost double precision NULL,
    total_tts_cost double precision NULL,
    total_llm_cost double precision NULL,
    complete_configuration jsonb NULL,
    telemetry_data jsonb NULL,
    telemetry_analytics jsonb NULL,
    billing_duration_seconds integer NULL,
    metrics jsonb NULL DEFAULT '{}'::jsonb,
    CONSTRAINT soundflare_call_logs_pkey PRIMARY KEY (id),
    CONSTRAINT fk_call_logs_agent_id FOREIGN KEY (agent_id) 
        REFERENCES public.soundflare_agents (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================
-- TABLE 10: soundflare_call_logs_backup
-- ============================================
CREATE TABLE public.soundflare_call_logs_backup (
    id uuid NULL,
    call_id character varying NULL,
    agent_id uuid NULL,
    customer_number character varying NULL,
    call_ended_reason character varying NULL,
    transcript_type character varying NULL,
    transcript_json jsonb NULL,
    metadata jsonb NULL,
    dynamic_variables jsonb NULL,
    environment character varying NULL,
    created_at timestamp without time zone NULL,
    call_started_at timestamp without time zone NULL,
    call_ended_at timestamp without time zone NULL,
    duration_seconds integer NULL,
    recording_url text NULL,
    voice_recording_url text NULL,
    avg_latency double precision NULL,
    transcription_metrics jsonb NULL,
    total_stt_cost double precision NULL,
    total_tts_cost double precision NULL,
    total_llm_cost double precision NULL,
    complete_configuration jsonb NULL,
    telemetry_data jsonb NULL,
    telemetry_analytics jsonb NULL,
    billing_duration_seconds integer NULL,
    metrics jsonb NULL DEFAULT '{}'::jsonb
) TABLESPACE pg_default;

-- ============================================
-- TABLE 11: soundflare_call_logs_with_context
-- ============================================
CREATE TABLE public.soundflare_call_logs_with_context (
    id uuid NULL,
    call_id character varying NULL,
    agent_id uuid NULL,
    customer_number character varying NULL,
    call_ended_reason character varying NULL,
    transcript_type character varying NULL,
    transcript_json jsonb NULL,
    metadata jsonb NULL,
    dynamic_variables jsonb NULL,
    environment character varying NULL,
    created_at timestamp without time zone NULL,
    call_started_at timestamp without time zone NULL,
    call_ended_at timestamp without time zone NULL,
    duration_seconds integer NULL,
    agent_name character varying NULL,
    agent_type character varying NULL,
    project_name character varying NULL,
    project_id uuid NULL
) TABLESPACE pg_default;

-- ============================================
-- TABLE 12: soundflare_custom_totals_configs
-- ============================================
CREATE TABLE public.soundflare_custom_totals_configs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NULL,
    agent_id uuid NULL,
    name character varying NULL,
    description text NULL,
    aggregation character varying NULL,
    column_name character varying NULL,
    json_field character varying NULL,
    filters jsonb NULL DEFAULT '[]'::jsonb,
    filter_logic character varying NULL DEFAULT 'AND'::character varying,
    icon character varying NULL,
    color character varying NULL,
    created_by character varying NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT soundflare_custom_totals_configs_pkey PRIMARY KEY (id),
    CONSTRAINT fk_custom_totals_agent_id FOREIGN KEY (agent_id) 
        REFERENCES public.soundflare_agents (id) ON DELETE CASCADE,
    CONSTRAINT fk_custom_totals_project_id FOREIGN KEY (project_id) 
        REFERENCES public.soundflare_projects (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================
-- TABLE 13: soundflare_dropoff_calls
-- ============================================
CREATE TABLE public.soundflare_dropoff_calls (
    phone_number character varying NOT NULL,
    agent_id uuid NULL,
    retry_count integer NOT NULL DEFAULT 0,
    latest_call_at timestamp with time zone NULL,
    next_call_at timestamp with time zone NULL,
    last_call_retry_required numeric NULL,
    is_active boolean NULL DEFAULT true,
    variables jsonb NULL DEFAULT '{}'::jsonb,
    stopped_at timestamp with time zone NULL,
    stop_reason character varying NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT soundflare_dropoff_calls_pkey PRIMARY KEY (phone_number),
    CONSTRAINT fk_dropoff_calls_agent_id FOREIGN KEY (agent_id) 
        REFERENCES public.soundflare_agents (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Indexes for soundflare_dropoff_calls
CREATE INDEX IF NOT EXISTS idx_dropoff_calls_active 
    ON public.soundflare_dropoff_calls USING btree (is_active)
    WHERE (is_active = true) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dropoff_calls_agent 
    ON public.soundflare_dropoff_calls USING btree (agent_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dropoff_calls_latest_call 
    ON public.soundflare_dropoff_calls USING btree (latest_call_at) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dropoff_calls_next_call 
    ON public.soundflare_dropoff_calls USING btree (next_call_at)
    WHERE ((is_active = true) AND (next_call_at IS NOT NULL)) TABLESPACE pg_default;

-- Trigger for soundflare_dropoff_calls
CREATE TRIGGER trigger_update_dropoff_calls_updated_at 
    BEFORE UPDATE ON public.soundflare_dropoff_calls 
    FOR EACH ROW
    EXECUTE FUNCTION update_dropoff_calls_updated_at();

-- ============================================
-- TABLE 14: soundflare_email_project_mapping
-- ============================================
CREATE TABLE public.soundflare_email_project_mapping (
    id serial,
    email text NULL,
    project_id uuid NULL,
    role text NULL,
    permissions jsonb NULL,
    added_by_clerk_id text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    clerk_id text NULL,
    is_active boolean NULL DEFAULT true,
    CONSTRAINT soundflare_email_project_mapping_pkey PRIMARY KEY (id),
    CONSTRAINT fk_email_mapping_project_id FOREIGN KEY (project_id) 
        REFERENCES public.soundflare_projects (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================
-- TABLE 15: soundflare_evaluation_campaigns
-- ============================================
CREATE TABLE public.soundflare_evaluation_campaigns (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    agent_id uuid NOT NULL,
    name text NOT NULL,
    test_count integer NOT NULL,
    notes text NULL,
    status text NULL DEFAULT 'pending'::text,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT soundflare_evaluation_campaigns_pkey PRIMARY KEY (id),
    CONSTRAINT soundflare_evaluation_campaigns_agent_id_fkey FOREIGN KEY (agent_id) 
        REFERENCES public.soundflare_agents (id) ON DELETE CASCADE,
    CONSTRAINT soundflare_evaluation_campaigns_project_id_fkey FOREIGN KEY (project_id) 
        REFERENCES public.soundflare_projects (id) ON DELETE CASCADE,
    CONSTRAINT soundflare_evaluation_campaigns_status_check CHECK (
        (status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text]))
    ),
    CONSTRAINT soundflare_evaluation_campaigns_test_count_check CHECK (
        (test_count = ANY (ARRAY[10, 25, 50]))
    )
) TABLESPACE pg_default;

-- ============================================
-- TABLE 16: soundflare_evaluation_prompts
-- ============================================
CREATE TABLE public.soundflare_evaluation_prompts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    prompt text NOT NULL,
    defiance_level text NOT NULL,
    expected_behavior text NULL,
    sequence_order integer NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT soundflare_evaluation_prompts_pkey PRIMARY KEY (id),
    CONSTRAINT soundflare_evaluation_prompts_project_id_fkey FOREIGN KEY (project_id) 
        REFERENCES public.soundflare_projects (id) ON DELETE CASCADE,
    CONSTRAINT soundflare_evaluation_prompts_defiance_level_check CHECK (
        (defiance_level = ANY (ARRAY[
            'Cooperative'::text,
            'Hesitant'::text,
            'Evasive'::text,
            'Defiant'::text,
            'Hostile'::text
        ]))
    )
) TABLESPACE pg_default;

-- ============================================
-- TABLE 17: soundflare_evaluation_results
-- ============================================
CREATE TABLE public.soundflare_evaluation_results (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL,
    prompt_id uuid NOT NULL,
    room_name text NOT NULL,
    agent_id text NULL,
    score numeric(5, 2) NULL,
    transcript text NULL,
    reasoning text NULL,
    timestamp numeric NULL,
    webhook_payload jsonb NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT soundflare_evaluation_results_pkey PRIMARY KEY (id),
    CONSTRAINT soundflare_evaluation_results_campaign_id_fkey FOREIGN KEY (campaign_id) 
        REFERENCES public.soundflare_evaluation_campaigns (id) ON DELETE CASCADE,
    CONSTRAINT soundflare_evaluation_results_prompt_id_fkey FOREIGN KEY (prompt_id) 
        REFERENCES public.soundflare_evaluation_prompts (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================
-- TABLE 18: soundflare_metrics_logs
-- ============================================
CREATE TABLE public.soundflare_metrics_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id uuid NULL,
    turn_id text NULL,
    user_transcript text NULL,
    agent_response text NULL,
    stt_metrics jsonb NULL,
    llm_metrics jsonb NULL,
    tts_metrics jsonb NULL,
    eou_metrics jsonb NULL,
    lesson_day integer NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    unix_timestamp numeric NULL,
    phone_number text NULL,
    call_duration numeric NULL,
    call_success boolean NULL,
    lesson_completed boolean NULL,
    trace_id text NULL,
    trace_duration_ms integer NULL,
    trace_cost_usd double precision NULL,
    turn_configuration jsonb NULL,
    bug_report boolean NULL,
    bug_details text NULL,
    enhanced_data jsonb NULL,
    tool_calls jsonb NULL,
    CONSTRAINT soundflare_metrics_logs_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ============================================
-- TABLE 19: soundflare_projects
-- ============================================
CREATE TABLE public.soundflare_projects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying NULL,
    description text NULL,
    environment character varying NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL,
    is_active boolean NULL DEFAULT true,
    retry_configuration jsonb NULL,
    token_hash text NULL,
    owner_clerk_id text NULL,
    campaign_config jsonb NULL,
    plans jsonb NULL DEFAULT '{}'::jsonb,
    CONSTRAINT soundflare_projects_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ============================================
-- TABLE 20: soundflare_session_traces
-- ============================================
CREATE TABLE public.soundflare_session_traces (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id uuid NULL,
    total_spans integer NULL DEFAULT 0,
    performance_summary jsonb NULL DEFAULT '{}'::jsonb,
    span_summary jsonb NULL DEFAULT '{}'::jsonb,
    session_start_time timestamp without time zone NULL,
    session_end_time timestamp without time zone NULL,
    total_duration_ms integer NULL,
    created_at timestamp without time zone NULL DEFAULT now(),
    trace_key character varying(255) NULL,
    CONSTRAINT soundflare_session_traces_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ============================================
-- TABLE 21: soundflare_spans
-- ============================================
CREATE TABLE public.soundflare_spans (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    span_id text NULL,
    trace_id text NULL,
    name text NULL,
    operation_type text NULL,
    start_time_ns bigint NULL,
    end_time_ns bigint NULL,
    duration_ms integer NULL,
    status jsonb NULL,
    attributes jsonb NULL,
    events jsonb NULL,
    metadata jsonb NULL,
    request_id text NULL,
    parent_span_id text NULL,
    created_at timestamp without time zone NULL DEFAULT now(),
    duration_ns bigint NULL,
    captured_at timestamp without time zone NULL,
    context jsonb NULL,
    request_id_source text NULL,
    trace_key character varying(255) NOT NULL,
    CONSTRAINT soundflare_spans_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ============================================
-- TABLE 22: soundflare_users
-- ============================================
CREATE TABLE public.soundflare_users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NULL,
    first_name text NULL,
    last_name text NULL,
    profile_image_url text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL,
    clerk_id text NULL,
    is_active boolean NULL DEFAULT true,
    roles jsonb NULL DEFAULT '["user"]'::jsonb,
    CONSTRAINT soundflare_users_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ============================================
-- TABLE 23: usd_to_inr_rate
-- ============================================
CREATE TABLE public.usd_to_inr_rate (
    as_of date NULL,
    rate numeric NULL,
    source text NULL
) TABLESPACE pg_default;
