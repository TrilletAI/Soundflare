-- Dummy Metrics Logs (Turns) for SoundFlare
-- Run this in Supabase SQL Editor AFTER dummy_data.sql

-- CLEANUP: Remove existing metrics logs for these sessions
DELETE FROM public.soundflare_metrics_logs WHERE session_id IN (
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000008'
);

-- Metrics Logs for call_success_001_new (ID: 00000000-0000-0000-0000-000000000006)
-- Complete conversation with 7 realistic turns showing the full support interaction
INSERT INTO public.soundflare_metrics_logs (
    id, session_id, turn_id, user_transcript, agent_response,
    stt_metrics, llm_metrics, tts_metrics, eou_metrics,
    created_at, unix_timestamp, phone_number, call_success
)
VALUES
-- Turn 1: Initial greeting
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'turn_001',
    'Hello, I need help with my agent.',
    'Hello! I''d be happy to help you with your agent. What seems to be the issue?',
    '{"duration": 0.45}'::jsonb,
    '{"ttft": 0.82, "tokens": 24}'::jsonb,
    '{"ttfb": 0.31, "duration": 2.8}'::jsonb,
    '{"end_of_utterance_delay": 0.52}'::jsonb,
    NOW() - INTERVAL '29 minutes 50 seconds',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '29 minutes 50 seconds')),
    '+15551234567',
    true
),
-- Turn 2: User explains problem
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'turn_002',
    'Hi, I am having trouble connecting my agent to the API.',
    'I can help with that. Have you checked that your API key is properly configured in your agent settings?',
    '{"duration": 0.52}'::jsonb,
    '{"ttft": 0.95, "tokens": 28}'::jsonb,
    '{"ttfb": 0.38, "duration": 3.2}'::jsonb,
    '{"end_of_utterance_delay": 0.61}'::jsonb,
    NOW() - INTERVAL '29 minutes 30 seconds',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '29 minutes 30 seconds')),
    '+15551234567',
    true
),
-- Turn 3: User realizes mistake
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'turn_003',
    'Oh, I think I missed that step. Let me check the settings.',
    'No problem at all. Take your time to verify the API key. It should be in the Configuration tab under Authentication.',
    '{"duration": 0.48}'::jsonb,
    '{"ttft": 0.75, "tokens": 32}'::jsonb,
    '{"ttfb": 0.29, "duration": 3.5}'::jsonb,
    '{"end_of_utterance_delay": 0.58}'::jsonb,
    NOW() - INTERVAL '29 minutes 10 seconds',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '29 minutes 10 seconds')),
    '+15551234567',
    true
),
-- Turn 4: User confirms finding
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'turn_004',
    'I found it! The API key field was empty.',
    'Great! Now please paste your API key there and make sure to save the configuration.',
    '{"duration": 0.41}'::jsonb,
    '{"ttft": 0.68, "tokens": 22}'::jsonb,
    '{"ttfb": 0.27, "duration": 2.6}'::jsonb,
    '{"end_of_utterance_delay": 0.49}'::jsonb,
    NOW() - INTERVAL '28 minutes 50 seconds',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '28 minutes 50 seconds')),
    '+15551234567',
    true
),
-- Turn 5: User tries solution
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'turn_005',
    'Okay, I''ve added the key and saved it. Should I try connecting again?',
    'Yes, please go ahead and try connecting your agent now. The connection should work properly.',
    '{"duration": 0.55}'::jsonb,
    '{"ttft": 0.88, "tokens": 26}'::jsonb,
    '{"ttfb": 0.35, "duration": 3.0}'::jsonb,
    '{"end_of_utterance_delay": 0.65}'::jsonb,
    NOW() - INTERVAL '28 minutes 30 seconds',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '28 minutes 30 seconds')),
    '+15551234567',
    true
),
-- Turn 6: Success confirmation
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'turn_006',
    'It works now! Thank you so much for your help.',
    'You''re very welcome! I''m glad we could resolve the issue quickly. Is there anything else I can help you with today?',
    '{"duration": 0.43}'::jsonb,
    '{"ttft": 0.79, "tokens": 30}'::jsonb,
    '{"ttfb": 0.32, "duration": 3.4}'::jsonb,
    '{"end_of_utterance_delay": 0.54}'::jsonb,
    NOW() - INTERVAL '28 minutes 10 seconds',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '28 minutes 10 seconds')),
    '+15551234567',
    true
),
-- Turn 7: Call closing
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'turn_007',
    'No, that''s all. Have a great day!',
    'Thank you for contacting SoundFlare Support. You have a great day too!',
    '{"duration": 0.38}'::jsonb,
    '{"ttft": 0.65, "tokens": 18}'::jsonb,
    '{"ttfb": 0.25, "duration": 2.2}'::jsonb,
    '{"end_of_utterance_delay": 0.47}'::jsonb,
    NOW() - INTERVAL '28 minutes',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '28 minutes')),
    '+15551234567',
    true
);

-- Metrics Logs for call_failed_001_new (ID: 00000000-0000-0000-0000-000000000007)
-- Failed call with audio issues (3 short turns)
INSERT INTO public.soundflare_metrics_logs (
    id, session_id, turn_id, user_transcript, agent_response,
    stt_metrics, llm_metrics, tts_metrics, eou_metrics,
    created_at, unix_timestamp, phone_number, call_success
)
VALUES
-- Turn 1: Initial audio issue
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000007', 'turn_001',
    'Hello?',
    'Hello, thank you for calling. How can I help you?',
    '{"duration": 1.2}'::jsonb,
    '{"ttft": 1.5, "tokens": 15}'::jsonb,
    '{"ttfb": 0.8, "duration": 2.0}'::jsonb,
    '{"end_of_utterance_delay": 1.2}'::jsonb,
    NOW() - INTERVAL '2 hours',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '2 hours')),
    '+15559876543',
    false
),
-- Turn 2: Audio degradation
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000007', 'turn_002',
    'Can you hear me?',
    'I''m having some trouble with the audio. Can you speak up?',
    '{"duration": 2.1}'::jsonb,
    '{"ttft": 1.8, "tokens": 18}'::jsonb,
    '{"ttfb": 1.1, "duration": 2.5}'::jsonb,
    '{"end_of_utterance_delay": 1.5}'::jsonb,
    NOW() - INTERVAL '1 hour 59 minutes 40 seconds',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 hour 59 minutes 40 seconds')),
    '+15559876543',
    false
),
-- Turn 3: Call drops
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000007', 'turn_003',
    'I can''t hear you well...',
    'I am having trouble hearing you...',
    '{"duration": 2.5}'::jsonb,
    '{"ttft": 2.0, "tokens": 12}'::jsonb,
    '{"ttfb": 1.3, "duration": 1.8}'::jsonb,
    '{"end_of_utterance_delay": 1.8}'::jsonb,
    NOW() - INTERVAL '1 hour 59 minutes 20 seconds',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 hour 59 minutes 20 seconds')),
    '+15559876543',
    false
);

-- Metrics Logs for call_long_001_new (ID: 00000000-0000-0000-0000-000000000008)
-- Longer sales call with 5 turns
INSERT INTO public.soundflare_metrics_logs (
    id, session_id, turn_id, user_transcript, agent_response,
    stt_metrics, llm_metrics, tts_metrics, eou_metrics,
    created_at, unix_timestamp, phone_number, call_success
)
VALUES
-- Turn 1: Sales greeting
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000008', 'turn_001',
    'Hello, I''m interested in learning about your enterprise plans.',
    'Welcome! I''d be happy to discuss our enterprise offerings with you. Let me start by understanding your specific needs.',
    '{"duration": 0.62}'::jsonb,
    '{"ttft": 1.1, "tokens": 35}'::jsonb,
    '{"ttfb": 0.42, "duration": 4.0}'::jsonb,
    '{"end_of_utterance_delay": 0.70}'::jsonb,
    NOW() - INTERVAL '1 day',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day')),
    '+15555555555',
    true
),
-- Turn 2: User requirements
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000008', 'turn_002',
    'We need to support about 500 agents with advanced analytics and custom integrations.',
    'That sounds perfect for our Enterprise Plus plan. It includes unlimited agents, advanced analytics dashboard, custom API integrations, and dedicated support.',
    '{"duration": 0.68}'::jsonb,
    '{"ttft": 1.25, "tokens": 42}'::jsonb,
    '{"ttfb": 0.48, "duration": 4.8}'::jsonb,
    '{"end_of_utterance_delay": 0.78}'::jsonb,
    NOW() - INTERVAL '1 day' + INTERVAL '1 minute',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day' + INTERVAL '1 minute')),
    '+15555555555',
    true
),
-- Turn 3: Pricing inquiry
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000008', 'turn_003',
    'What''s the pricing for that level, and do you offer volume discounts?',
    'Our Enterprise Plus starts at $2,500 per month. For 500 agents, we can offer a 25% volume discount, bringing it to $1,875 monthly. Would you like a detailed proposal?',
    '{"duration": 0.58}'::jsonb,
    '{"ttft": 1.05, "tokens": 48}'::jsonb,
    '{"ttfb": 0.40, "duration": 5.2}'::jsonb,
    '{"end_of_utterance_delay": 0.72}'::jsonb,
    NOW() - INTERVAL '1 day' + INTERVAL '2 minutes',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day' + INTERVAL '2 minutes')),
    '+15555555555',
    true
),
-- Turn 4: Implementation timeline
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000008', 'turn_004',
    'Yes, please. Also, how long does implementation typically take?',
    'Great! I''ll send over a detailed proposal within 24 hours. Implementation typically takes 2-4 weeks depending on your custom integration needs. We provide full onboarding support.',
    '{"duration": 0.55}'::jsonb,
    '{"ttft": 0.98, "tokens": 45}'::jsonb,
    '{"ttfb": 0.37, "duration": 4.5}'::jsonb,
    '{"end_of_utterance_delay": 0.68}'::jsonb,
    NOW() - INTERVAL '1 day' + INTERVAL '3 minutes 30 seconds',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day' + INTERVAL '3 minutes 30 seconds')),
    '+15555555555',
    true
),
-- Turn 5: Call wrap-up
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000008', 'turn_005',
    'Perfect! I look forward to reviewing the proposal. Thank you!',
    'You''re welcome! You''ll receive the proposal shortly. Feel free to reach out if you have any questions. Have a great day!',
    '{"duration": 0.51}'::jsonb,
    '{"ttft": 0.92, "tokens": 38}'::jsonb,
    '{"ttfb": 0.35, "duration": 4.2}'::jsonb,
    '{"end_of_utterance_delay": 0.63}'::jsonb,
    NOW() - INTERVAL '1 day' + INTERVAL '5 minutes',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day' + INTERVAL '5 minutes')),
    '+15555555555',
    true
);
