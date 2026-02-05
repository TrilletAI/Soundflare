

-- Ensure basic schema access (usually already there, but harmless to re-run)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant SELECT (for reading) on your specific table to anon
-- Add INSERT, UPDATE, DELETE if your app needs them
GRANT SELECT ON public.soundflare_users TO anon;

-- If you want anon to have broader access (e.g., all current + future tables created by certain roles)
-- This mimics hosted Supabase defaults more closely
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- For future tables created by 'postgres' or 'supabase_admin' (common in self-host)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

    
-- not recommended for production, use rls instead