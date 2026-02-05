-- Ensure soundflare_metrics_logs has RLS enabled and a policy for reading
ALTER TABLE public.soundflare_metrics_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on metrics logs" ON public.soundflare_metrics_logs
    FOR ALL USING (true) WITH CHECK (true);
