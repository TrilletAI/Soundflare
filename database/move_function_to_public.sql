-- 1. Drop the misplaced function from the 'auth' schema
DROP FUNCTION IF EXISTS auth.refresh_call_summary();

-- 2. Create the function in the 'public' schema
-- We explicitly specify 'public.' to ensure it goes to the right place
CREATE OR REPLACE FUNCTION public.refresh_call_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We also explicitly specify 'public.' for the view to be safe
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.call_summary_materialized;
END;
$$;

-- 3. Grant execution permissions
GRANT EXECUTE ON FUNCTION public.refresh_call_summary() TO anon, authenticated, service_role;

-- 4. Reload the schema cache
NOTIFY pgrst, 'reload schema';
