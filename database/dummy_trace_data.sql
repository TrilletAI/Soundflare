-- Dummy Trace Data for SoundFlare
-- Run this in Supabase SQL Editor AFTER dummy_data.sql and dummy_metrics_logs.sql have been run.

-- CLEANUP: Remove existing traces for these dummy sessions to avoid duplicates
DELETE FROM public.soundflare_session_traces WHERE session_id IN (
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000008'
);

-- Trace data for call_success_001_new (7 turns with realistic conversation data)
INSERT INTO public.soundflare_session_traces (id, session_id, total_spans, performance_summary, span_summary, session_start_time, session_end_time, total_duration_ms, trace_key)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 28,
   '{"avg_llm_latency": 800, "avg_stt_latency": 450, "avg_tts_latency": 350, "avg_eou_latency": 600, "total_spans": 28}'::jsonb,
   '{"by_operation": {"stt": 7, "llm": 7, "tts": 7, "eou": 7}}'::jsonb,
   NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes', 120000,
   'trace_success_001_new'
  );

-- Spans for call_success_001_new - Complete turn-by-turn pipeline traces
-- Turn 1 spans
INSERT INTO public.soundflare_spans (id, span_id, trace_id, name, operation_type, start_time_ns, end_time_ns, duration_ms, status, attributes, metadata, request_id, parent_span_id, trace_key)
VALUES
  (gen_random_uuid(), 'span_t1_stt', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'STT Processing - Turn 1', 'stt', 100000000000, 100000450000, 450, '{"code": "OK"}'::jsonb, '{"model": "deepgram", "language": "en-US", "confidence": 0.95}'::jsonb, '{"turn_id": "turn_001"}'::jsonb, 'stt_req_001', NULL, 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t1_eou', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'EOU Detection - Turn 1', 'eou', 100000450000, 100001070000, 520, '{"code": "OK"}'::jsonb, '{"threshold": 0.8, "confidence": 0.92}'::jsonb, '{"turn_id": "turn_001"}'::jsonb, 'eou_req_001', 'span_t1_stt', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t1_llm', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'LLM Inference - Turn 1', 'llm', 100001070000, 100001890000, 820, '{"code": "OK"}'::jsonb, '{"model": "gpt-4o", "tokens": 24, "prompt_tokens": 120, "completion_tokens": 24}'::jsonb, '{"turn_id": "turn_001"}'::jsonb, 'llm_req_001', 'span_t1_eou', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t1_tts', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'TTS Generation - Turn 1', 'tts', 100001890000, 100002200000, 310, '{"code": "OK"}'::jsonb, '{"voice": "alloy", "chars": 68, "provider": "openai"}'::jsonb, '{"turn_id": "turn_001"}'::jsonb, 'tts_req_001', 'span_t1_llm', 'trace_success_001_new'),

-- Turn 2 spans
  (gen_random_uuid(), 'span_t2_stt', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'STT Processing - Turn 2', 'stt', 100020000000, 100020520000, 520, '{"code": "OK"}'::jsonb, '{"model": "deepgram", "language": "en-US", "confidence": 0.93}'::jsonb, '{"turn_id": "turn_002"}'::jsonb, 'stt_req_002', NULL, 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t2_eou', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'EOU Detection - Turn 2', 'eou', 100020520000, 100021130000, 610, '{"code": "OK"}'::jsonb, '{"threshold": 0.8, "confidence": 0.89}'::jsonb, '{"turn_id": "turn_002"}'::jsonb, 'eou_req_002', 'span_t2_stt', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t2_llm', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'LLM Inference - Turn 2', 'llm', 100021130000, 100022080000, 950, '{"code": "OK"}'::jsonb, '{"model": "gpt-4o", "tokens": 28, "prompt_tokens": 180, "completion_tokens": 28}'::jsonb, '{"turn_id": "turn_002"}'::jsonb, 'llm_req_002', 'span_t2_eou', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t2_tts', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'TTS Generation - Turn 2', 'tts', 100022080000, 100022460000, 380, '{"code": "OK"}'::jsonb, '{"voice": "alloy", "chars": 92, "provider": "openai"}'::jsonb, '{"turn_id": "turn_002"}'::jsonb, 'tts_req_002', 'span_t2_llm', 'trace_success_001_new'),

-- Turn 3 spans
  (gen_random_uuid(), 'span_t3_stt', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'STT Processing - Turn 3', 'stt', 100040000000, 100040480000, 480, '{"code": "OK"}'::jsonb, '{"model": "deepgram", "language": "en-US", "confidence": 0.91}'::jsonb, '{"turn_id": "turn_003"}'::jsonb, 'stt_req_003', NULL, 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t3_eou', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'EOU Detection - Turn 3', 'eou', 100040480000, 100041060000, 580, '{"code": "OK"}'::jsonb, '{"threshold": 0.8, "confidence": 0.94}'::jsonb, '{"turn_id": "turn_003"}'::jsonb, 'eou_req_003', 'span_t3_stt', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t3_llm', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'LLM Inference - Turn 3', 'llm', 100041060000, 100041810000, 750, '{"code": "OK"}'::jsonb, '{"model": "gpt-4o", "tokens": 32, "prompt_tokens": 240, "completion_tokens": 32}'::jsonb, '{"turn_id": "turn_003"}'::jsonb, 'llm_req_003', 'span_t3_eou', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t3_tts', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'TTS Generation - Turn 3', 'tts', 100041810000, 100042100000, 290, '{"code": "OK"}'::jsonb, '{"voice": "alloy", "chars": 98, "provider": "openai"}'::jsonb, '{"turn_id": "turn_003"}'::jsonb, 'tts_req_003', 'span_t3_llm', 'trace_success_001_new'),

-- Turn 4 spans
  (gen_random_uuid(), 'span_t4_stt', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'STT Processing - Turn 4', 'stt', 100060000000, 100060410000, 410, '{"code": "OK"}'::jsonb, '{"model": "deepgram", "language": "en-US", "confidence": 0.96}'::jsonb, '{"turn_id": "turn_004"}'::jsonb, 'stt_req_004', NULL, 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t4_eou', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'EOU Detection - Turn 4', 'eou', 100060410000, 100060900000, 490, '{"code": "OK"}'::jsonb, '{"threshold": 0.8, "confidence": 0.91}'::jsonb, '{"turn_id": "turn_004"}'::jsonb, 'eou_req_004', 'span_t4_stt', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t4_llm', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'LLM Inference - Turn 4', 'llm', 100060900000, 100061580000, 680, '{"code": "OK"}'::jsonb, '{"model": "gpt-4o", "tokens": 22, "prompt_tokens": 290, "completion_tokens": 22}'::jsonb, '{"turn_id": "turn_004"}'::jsonb, 'llm_req_004', 'span_t4_eou', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t4_tts', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'TTS Generation - Turn 4', 'tts', 100061580000, 100061850000, 270, '{"code": "OK"}'::jsonb, '{"voice": "alloy", "chars": 76, "provider": "openai"}'::jsonb, '{"turn_id": "turn_004"}'::jsonb, 'tts_req_004', 'span_t4_llm', 'trace_success_001_new'),

-- Turn 5 spans
  (gen_random_uuid(), 'span_t5_stt', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'STT Processing - Turn 5', 'stt', 100080000000, 100080550000, 550, '{"code": "OK"}'::jsonb, '{"model": "deepgram", "language": "en-US", "confidence": 0.92}'::jsonb, '{"turn_id": "turn_005"}'::jsonb, 'stt_req_005', NULL, 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t5_eou', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'EOU Detection - Turn 5', 'eou', 100080550000, 100081200000, 650, '{"code": "OK"}'::jsonb, '{"threshold": 0.8, "confidence": 0.88}'::jsonb, '{"turn_id": "turn_005"}'::jsonb, 'eou_req_005', 'span_t5_stt', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t5_llm', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'LLM Inference - Turn 5', 'llm', 100081200000, 100082080000, 880, '{"code": "OK"}'::jsonb, '{"model": "gpt-4o", "tokens": 26, "prompt_tokens": 350, "completion_tokens": 26}'::jsonb, '{"turn_id": "turn_005"}'::jsonb, 'llm_req_005', 'span_t5_eou', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t5_tts', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'TTS Generation - Turn 5', 'tts', 100082080000, 100082430000, 350, '{"code": "OK"}'::jsonb, '{"voice": "alloy", "chars": 84, "provider": "openai"}'::jsonb, '{"turn_id": "turn_005"}'::jsonb, 'tts_req_005', 'span_t5_llm', 'trace_success_001_new'),

-- Turn 6 spans
  (gen_random_uuid(), 'span_t6_stt', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'STT Processing - Turn 6', 'stt', 100100000000, 100100430000, 430, '{"code": "OK"}'::jsonb, '{"model": "deepgram", "language": "en-US", "confidence": 0.94}'::jsonb, '{"turn_id": "turn_006"}'::jsonb, 'stt_req_006', NULL, 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t6_eou', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'EOU Detection - Turn 6', 'eou', 100100430000, 100100970000, 540, '{"code": "OK"}'::jsonb, '{"threshold": 0.8, "confidence": 0.93}'::jsonb, '{"turn_id": "turn_006"}'::jsonb, 'eou_req_006', 'span_t6_stt', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t6_llm', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'LLM Inference - Turn 6', 'llm', 100100970000, 100101760000, 790, '{"code": "OK"}'::jsonb, '{"model": "gpt-4o", "tokens": 30, "prompt_tokens": 420, "completion_tokens": 30}'::jsonb, '{"turn_id": "turn_006"}'::jsonb, 'llm_req_006', 'span_t6_eou', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t6_tts', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'TTS Generation - Turn 6', 'tts', 100101760000, 100102080000, 320, '{"code": "OK"}'::jsonb, '{"voice": "alloy", "chars": 102, "provider": "openai"}'::jsonb, '{"turn_id": "turn_006"}'::jsonb, 'tts_req_006', 'span_t6_llm', 'trace_success_001_new'),

-- Turn 7 spans
  (gen_random_uuid(), 'span_t7_stt', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'STT Processing - Turn 7', 'stt', 100120000000, 100120380000, 380, '{"code": "OK"}'::jsonb, '{"model": "deepgram", "language": "en-US", "confidence": 0.97}'::jsonb, '{"turn_id": "turn_007"}'::jsonb, 'stt_req_007', NULL, 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t7_eou', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'EOU Detection - Turn 7', 'eou', 100120380000, 100120850000, 470, '{"code": "OK"}'::jsonb, '{"threshold": 0.8, "confidence": 0.96}'::jsonb, '{"turn_id": "turn_007"}'::jsonb, 'eou_req_007', 'span_t7_stt', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t7_llm', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'LLM Inference - Turn 7', 'llm', 100120850000, 100121500000, 650, '{"code": "OK"}'::jsonb, '{"model": "gpt-4o", "tokens": 18, "prompt_tokens": 480, "completion_tokens": 18}'::jsonb, '{"turn_id": "turn_007"}'::jsonb, 'llm_req_007', 'span_t7_eou', 'trace_success_001_new'),
  (gen_random_uuid(), 'span_t7_tts', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000006' LIMIT 1), 'TTS Generation - Turn 7', 'tts', 100121500000, 100121750000, 250, '{"code": "OK"}'::jsonb, '{"voice": "alloy", "chars": 64, "provider": "openai"}'::jsonb, '{"turn_id": "turn_007"}'::jsonb, 'tts_req_007', 'span_t7_llm', 'trace_success_001_new');

-- Trace data for call_failed_001_new
INSERT INTO public.soundflare_session_traces (id, session_id, total_spans, performance_summary, span_summary, session_start_time, session_end_time, total_duration_ms, trace_key)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000007', 2,
   '{"avg_stt_latency": 500, "error": "STT_ERROR"}'::jsonb,
   '{"by_operation": {"stt": 1, "error": 1}}'::jsonb,
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 59 minutes', 60000,
   'trace_failed_001_new'
  );

-- Spans for call_failed_001_new
INSERT INTO public.soundflare_spans (id, span_id, trace_id, name, operation_type, start_time_ns, end_time_ns, duration_ms, status, attributes, metadata, request_id, parent_span_id, trace_key)
VALUES
  (gen_random_uuid(), 'span_stt_fail_001', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000007' LIMIT 1), 'STT Processing', 'stt', 200000000000, 200000000500, 500, '{"code": "ERROR", "message": "No speech detected"}'::jsonb, '{"model": "deepgram"}'::jsonb, '{}'::jsonb, 'stt_req_fail_001', NULL, 'trace_failed_001_new');


-- Trace data for call_long_001_new
INSERT INTO public.soundflare_session_traces (id, session_id, total_spans, performance_summary, span_summary, session_start_time, session_end_time, total_duration_ms, trace_key)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000008', 6,
   '{"avg_llm_latency": 300, "avg_tts_latency": 250, "avg_stt_latency": 350, "total_spans": 6}'::jsonb,
   '{"by_operation": {"stt": 3, "llm": 2, "tts": 1}}'::jsonb,
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '5 minutes', 300000,
   'trace_long_001_new'
  );

-- Spans for call_long_001_new
INSERT INTO public.soundflare_spans (id, span_id, trace_id, name, operation_type, start_time_ns, end_time_ns, duration_ms, status, attributes, metadata, request_id, parent_span_id, trace_key)
VALUES
  (gen_random_uuid(), 'span_stt_002', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000008' LIMIT 1), 'STT Processing', 'stt', 300000000000, 300000000350, 350, '{"code": "OK"}'::jsonb, '{"model": "deepgram"}'::jsonb, '{}'::jsonb, 'stt_req_002', NULL, 'trace_long_001_new'),
  (gen_random_uuid(), 'span_llm_002', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000008' LIMIT 1), 'LLM Inference', 'llm', 300000000400, 300000000700, 300, '{"code": "OK"}'::jsonb, '{"model": "gpt-4o", "tokens": 70}'::jsonb, '{}'::jsonb, 'llm_req_002', 'span_stt_002', 'trace_long_001_new'),
  (gen_random_uuid(), 'span_tts_002', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000008' LIMIT 1), 'TTS Generation', 'tts', 300000000750, 300000001000, 250, '{"code": "OK"}'::jsonb, '{"voice": "nova", "chars": 150}'::jsonb, '{}'::jsonb, 'tts_req_002', 'llm_req_002', 'trace_long_001_new'),
  (gen_random_uuid(), 'span_stt_003', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000008' LIMIT 1), 'STT Processing', 'stt', 300000001500, 300000001800, 300, '{"code": "OK"}'::jsonb, '{"model": "deepgram"}'::jsonb, '{}'::jsonb, 'stt_req_003', 'span_tts_002', 'trace_long_001_new'),
  (gen_random_uuid(), 'span_llm_003', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000008' LIMIT 1), 'LLM Inference', 'llm', 300000001850, 300000002150, 300, '{"code": "OK"}'::jsonb, '{"model": "gpt-4o", "tokens": 80}'::jsonb, '{}'::jsonb, 'llm_req_003', 'span_stt_003', 'trace_long_001_new'),
  (gen_random_uuid(), 'span_eou_002', (SELECT id FROM public.soundflare_session_traces WHERE session_id = '00000000-0000-0000-0000-000000000008' LIMIT 1), 'EOU Detection', 'eou', 300000002200, 300000002300, 100, '{"code": "OK"}'::jsonb, '{}'::jsonb, '{}'::jsonb, 'eou_req_002', 'span_stt_003', 'trace_long_001_new');