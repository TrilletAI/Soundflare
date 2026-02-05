-- Fix for GoTrue migration bug: id = user_id::text should be id::text = user_id::text
-- This creates the schema_migrations table and marks the buggy migration as already completed

-- Create GoTrue's schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.schema_migrations (
    version VARCHAR(255) PRIMARY KEY
);

-- Mark the problematic migration as already completed
-- This prevents GoTrue from running the buggy version
INSERT INTO auth.schema_migrations (version)
VALUES ('20221208132122')
ON CONFLICT (version) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE 'Pre-marked GoTrue migration 20221208132122 as completed to avoid UUID comparison bug';
END $$;
