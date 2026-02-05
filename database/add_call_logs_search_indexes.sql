-- ========================================
-- Call Logs Search & Filter Performance Indexes
-- ========================================
-- These indexes improve performance for PowerBI-like search and filtering
-- Run this script in your Supabase SQL editor

-- ========================================
-- JSONB GIN Indexes (for fast JSONB queries)
-- ========================================

-- Index for metadata field searches
CREATE INDEX IF NOT EXISTS idx_call_logs_metadata_gin
ON soundflare_call_logs USING GIN (metadata);

-- Index for transcription_metrics field searches
CREATE INDEX IF NOT EXISTS idx_call_logs_transcription_metrics_gin
ON soundflare_call_logs USING GIN (transcription_metrics);

-- Index for metrics field searches
CREATE INDEX IF NOT EXISTS idx_call_logs_metrics_gin
ON soundflare_call_logs USING GIN (metrics);

-- Index for telemetry_data field searches
CREATE INDEX IF NOT EXISTS idx_call_logs_telemetry_gin
ON soundflare_call_logs USING GIN (telemetry_data);

-- Index for dynamic_variables field searches
CREATE INDEX IF NOT EXISTS idx_call_logs_dynamic_variables_gin
ON soundflare_call_logs USING GIN (dynamic_variables);

-- ========================================
-- B-tree Indexes (for standard field queries)
-- ========================================

-- Index for agent_id (most common filter)
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_id
ON soundflare_call_logs (agent_id);

-- Index for customer_number searches
CREATE INDEX IF NOT EXISTS idx_call_logs_customer_number
ON soundflare_call_logs (customer_number);

-- Index for call_id searches
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id
ON soundflare_call_logs (call_id);

-- Index for call_ended_reason (status filter)
CREATE INDEX IF NOT EXISTS idx_call_logs_call_ended_reason
ON soundflare_call_logs (call_ended_reason);

-- Index for call_started_at (date range queries)
CREATE INDEX IF NOT EXISTS idx_call_logs_call_started_at
ON soundflare_call_logs (call_started_at DESC);

-- Index for created_at (pagination and sorting)
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at
ON soundflare_call_logs (created_at DESC);

-- ========================================
-- Composite Indexes (for common query patterns)
-- ========================================

-- Composite index for agent_id + call_started_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_date
ON soundflare_call_logs (agent_id, call_started_at DESC);

-- Composite index for agent_id + created_at (pagination with agent filter)
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_created
ON soundflare_call_logs (agent_id, created_at DESC);

-- Composite index for agent_id + call_ended_reason (status filtering)
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_status
ON soundflare_call_logs (agent_id, call_ended_reason);

-- ========================================
-- Partial Indexes (for specific conditions)
-- ========================================

-- Index for failed calls only (faster filtering for failed calls)
CREATE INDEX IF NOT EXISTS idx_call_logs_failed_calls
ON soundflare_call_logs (agent_id, call_started_at DESC)
WHERE call_ended_reason != 'completed';

-- Index for completed calls only
CREATE INDEX IF NOT EXISTS idx_call_logs_completed_calls
ON soundflare_call_logs (agent_id, call_started_at DESC)
WHERE call_ended_reason = 'completed';

-- Index for calls with high latency (>2000ms)
CREATE INDEX IF NOT EXISTS idx_call_logs_high_latency
ON soundflare_call_logs (agent_id, avg_latency DESC)
WHERE avg_latency > 2000;

-- ========================================
-- Text Search Index (for full-text search)
-- ========================================

-- Add tsvector column for full-text search (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'soundflare_call_logs'
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE soundflare_call_logs
        ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION update_call_logs_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.customer_number, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.call_id, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.call_ended_reason, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.metadata::text, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.transcription_metrics::text, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS trigger_update_call_logs_search_vector ON soundflare_call_logs;
CREATE TRIGGER trigger_update_call_logs_search_vector
    BEFORE INSERT OR UPDATE ON soundflare_call_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_call_logs_search_vector();

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_call_logs_search_vector
ON soundflare_call_logs USING GIN (search_vector);

-- ========================================
-- Specific JSONB Path Indexes (for known high-traffic fields)
-- ========================================
-- Add these for frequently accessed metadata fields
-- Replace 'field_name' with actual field names from your data

-- Example: Index for metadata.customer_intent
-- CREATE INDEX IF NOT EXISTS idx_call_logs_metadata_customer_intent
-- ON soundflare_call_logs ((metadata->>'customer_intent'));

-- Example: Index for transcription_metrics.summary
-- CREATE INDEX IF NOT EXISTS idx_call_logs_transcription_summary
-- ON soundflare_call_logs ((transcription_metrics->>'summary'));

-- Example: Index for metrics scores
-- CREATE INDEX IF NOT EXISTS idx_call_logs_metrics_satisfaction_score
-- ON soundflare_call_logs (((metrics->'satisfaction'->>'score')::numeric));

-- ========================================
-- Statistics Update
-- ========================================

-- Update table statistics for better query planning
ANALYZE soundflare_call_logs;

-- ========================================
-- Index Usage Monitoring Query
-- ========================================
-- Run this query to see which indexes are being used:
--
-- SELECT
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan as index_scans,
--     idx_tup_read as tuples_read,
--     idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'soundflare_call_logs'
-- ORDER BY idx_scan DESC;

-- ========================================
-- Maintenance Notes
-- ========================================
--
-- 1. Monitor index usage with pg_stat_user_indexes
-- 2. Drop unused indexes to reduce write overhead
-- 3. Run ANALYZE regularly (especially after bulk inserts)
-- 4. Consider REINDEX CONCURRENTLY for maintenance
-- 5. Adjust fillfactor for frequently updated indexes
--
-- Example maintenance query:
-- REINDEX INDEX CONCURRENTLY idx_call_logs_metadata_gin;
