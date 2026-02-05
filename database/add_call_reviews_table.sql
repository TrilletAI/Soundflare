-- Migration: Add call_reviews table for AI-powered call analysis
-- This table stores the results of AI reviews for each call log

-- Create the call_reviews table in public schema
CREATE TABLE IF NOT EXISTS public.call_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_log_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  review_result JSONB,
  error_count INTEGER DEFAULT 0,
  has_api_failures BOOLEAN DEFAULT false,
  has_wrong_actions BOOLEAN DEFAULT false,
  has_wrong_outputs BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  

  -- Ensure only one review per call log
  UNIQUE(call_log_id)
);

-- Add foreign key constraint (only if the parent table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'soundflare_call_logs'
  ) THEN
    ALTER TABLE public.call_reviews
    ADD CONSTRAINT fk_call_reviews_call_log
    FOREIGN KEY (call_log_id)
    REFERENCES public.soundflare_call_logs(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_call_reviews_call_log_id ON public.call_reviews(call_log_id);
CREATE INDEX IF NOT EXISTS idx_call_reviews_agent_id ON public.call_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_reviews_status ON public.call_reviews(status);
CREATE INDEX IF NOT EXISTS idx_call_reviews_has_api_failures ON public.call_reviews(has_api_failures) WHERE has_api_failures = true;
CREATE INDEX IF NOT EXISTS idx_call_reviews_has_wrong_actions ON public.call_reviews(has_wrong_actions) WHERE has_wrong_actions = true;
CREATE INDEX IF NOT EXISTS idx_call_reviews_has_wrong_outputs ON public.call_reviews(has_wrong_outputs) WHERE has_wrong_outputs = true;
CREATE INDEX IF NOT EXISTS idx_call_reviews_error_count ON public.call_reviews(error_count) WHERE error_count > 0;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_call_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER call_reviews_updated_at
  BEFORE UPDATE ON public.call_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_call_reviews_updated_at();

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE public.call_reviews ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read reviews
CREATE POLICY "Users can read call reviews"
  ON public.call_reviews
  FOR SELECT
  USING (true);

-- Policy to allow service role to insert/update reviews
CREATE POLICY "Service role can insert/update reviews"
  ON public.call_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE public.call_reviews IS 'Stores AI-powered analysis results for call logs, identifying API failures, wrong actions, and wrong outputs';
COMMENT ON COLUMN public.call_reviews.status IS 'Review status: pending (not yet reviewed), processing (review in progress), completed (review finished), failed (review error)';
COMMENT ON COLUMN public.call_reviews.review_result IS 'Complete JSON result from AI analysis including all detected errors';
COMMENT ON COLUMN public.call_reviews.error_count IS 'Total number of errors found in this call';
COMMENT ON COLUMN public.call_reviews.has_api_failures IS 'Quick flag: true if call contains any API failure errors (4xx/5xx responses)';
COMMENT ON COLUMN public.call_reviews.has_wrong_actions IS 'Quick flag: true if call contains any wrong action errors (mismatch between request and execution)';
COMMENT ON COLUMN public.call_reviews.has_wrong_outputs IS 'Quick flag: true if call contains any wrong output errors (agent stated incorrect information)';
