-- Dummy Data for SoundFlare
-- Run this in Supabase SQL Editor

-- 1. Create/Update the specified Project
INSERT INTO public.soundflare_projects (id, name, description, environment, is_active)
VALUES 
  ('facdce7e-c95a-47b1-bb50-157ba9aa9af8', 'Trillet Test Project', 'Your existing project for testing SoundFlare', 'dev', true)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. Create/Update the specified Agent linked to the Project
INSERT INTO public.soundflare_agents (id, project_id, name, agent_type, environment, is_active, configuration, metrics)
VALUES
  ('a307a5ef-cd2c-4927-a4c5-b76db0e67855', 'facdce7e-c95a-47b1-bb50-157ba9aa9af8', 'Saad-agent-switch', 'trillet', 'dev', true,
   '{"trilletApiKey": "dummy_key", "trilletWorkspaceId": "ws_123", "trilletAgentId": "ag_123"}',
   '{"customer_satisfaction": {"description": "Rate user satisfaction 1-5", "enabled": true}, "issue_resolved": {"description": "Was the issue resolved? (0/1)", "enabled": true}}'
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, project_id = EXCLUDED.project_id, agent_type = EXCLUDED.agent_type, environment = EXCLUDED.environment, configuration = EXCLUDED.configuration, metrics = EXCLUDED.metrics;

-- 3. Create dummy Call Logs for the specified Agent
INSERT INTO public.soundflare_call_logs (
    id, call_id, agent_id, customer_number, call_ended_reason, 
    transcript_type, transcript_json, metadata, dynamic_variables, 
    environment, call_started_at, call_ended_at, duration_seconds, 
    recording_url, avg_latency, total_llm_cost, total_tts_cost, total_stt_cost,
    billing_duration_seconds, metrics, transcription_metrics
)
VALUES 
(
    '00000000-0000-0000-0000-000000000006', 'call_success_001_new', 'a307a5ef-cd2c-4927-a4c5-b76db0e67855', '+15551234567', 'completed',
    'json', 
    '[
        {"role": "assistant", "content": "Hello, thank you for calling SoundFlare Support. How can I assist you today?"},
        {"role": "user", "content": "Hi, I am having trouble connecting my agent."},
        {"role": "assistant", "content": "I can help with that. Have you checked your API key?"},
        {"role": "user", "content": "Oh, I missed that step. Let me try."},
        {"role": "assistant", "content": "No problem. Let me know if it works."},
        {"role": "user", "content": "It works now! Thanks."},
        {"role": "assistant", "content": "You are welcome! Have a great day."}
    ]'::jsonb,
    '{"user_id": "user_001", "campaign": "support_inbound"}'::jsonb,
    '{"customer_name": "Alice"}'::jsonb,
    'dev',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '28 minutes',
    120,
    'https://www.soundhelper.com/content/mp3/sound1.mp3', -- Dummy audio URL
    0.45,
    0.005,
    0.003,
    0.001,
    120,
    '{"customer_satisfaction": {"score": 5, "reason": "User issue was resolved quickly"}, "issue_resolved": {"score": 1, "reason": "User confirmed it works"}}'::jsonb,
    '{"summary": "User had connection issue, resolved by checking API key"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000007', 'call_failed_001_new', 'a307a5ef-cd2c-4927-a4c5-b76db0e67855', '+15559876543', 'failed',
    'json',
    '[
        {"role": "assistant", "content": "Hello?"},
        {"role": "user", "content": "Can you hear me?"},
        {"role": "assistant", "content": "I am having trouble hearing you..."}
    ]'::jsonb,
    '{"user_id": "user_002"}'::jsonb,
    '{}'::jsonb,
    'dev',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 59 minutes',
    60,
    NULL,
    0.0,
    0.001,
    0.001,
    0.001,
    60,
    '{"customer_satisfaction": {"score": 1, "reason": "Audio issues"}, "issue_resolved": {"score": 0, "reason": "Call failed"}}'::jsonb,
    '{"summary": "Call dropped due to audio issues"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000008', 'call_long_001_new', 'a307a5ef-cd2c-4927-a4c5-b76db0e67855', '+15555555555', 'completed',
    'json',
    '[
        {"role": "assistant", "content": "Welcome to the sales line."},
        {"role": "user", "content": "I want to buy the enterprise plan."}
    ]'::jsonb,
    '{"user_id": "user_vip", "priority": "high"}'::jsonb,
    '{"customer_name": "Bob"}'::jsonb,
    'prod',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '5 minutes',
    300,
    'https://www.soundhelper.com/content/mp3/sound2.mp3',
    0.3,
    0.05,
    0.02,
    0.01,
    300,
    '{"customer_satisfaction": {"score": 4, "reason": "Interested in buying"}, "issue_resolved": {"score": 1, "reason": "Sales lead captured"}}'::jsonb,
    '{"summary": "Sales inquiry for enterprise plan"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. Refresh materialized view to update dashboard stats
REFRESH MATERIALIZED VIEW call_summary_materialized;