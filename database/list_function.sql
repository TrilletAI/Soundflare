SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
WHERE 
    p.proname = 'refresh_call_summary';