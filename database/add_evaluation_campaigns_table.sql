-- Create evaluation prompts table (project-level)
CREATE TABLE IF NOT EXISTS soundflare_evaluation_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES soundflare_projects(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  defiance_level TEXT NOT NULL CHECK (defiance_level IN ('Cooperative', 'Hesitant', 'Evasive', 'Defiant', 'Hostile')),
  expected_behavior TEXT,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create evaluation campaigns table
CREATE TABLE IF NOT EXISTS soundflare_evaluation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES soundflare_projects(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES soundflare_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  test_count INTEGER NOT NULL CHECK (test_count IN (10, 25, 50)),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create evaluation results table (stores webhook responses)
CREATE TABLE IF NOT EXISTS soundflare_evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES soundflare_evaluation_campaigns(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES soundflare_evaluation_prompts(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  agent_id TEXT,  -- Changed from UUID to TEXT to support MongoDB ObjectIds
  
  -- Results from webhook
  score NUMERIC(5,2),
  transcript TEXT,
  reasoning TEXT,
  
  -- Metadata
  timestamp NUMERIC,
  
  -- Full webhook payload
  webhook_payload JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_eval_prompts_project_id ON soundflare_evaluation_prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_eval_prompts_sequence ON soundflare_evaluation_prompts(project_id, sequence_order);

CREATE INDEX IF NOT EXISTS idx_eval_campaigns_project_id ON soundflare_evaluation_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_eval_campaigns_agent_id ON soundflare_evaluation_campaigns(agent_id);
CREATE INDEX IF NOT EXISTS idx_eval_campaigns_status ON soundflare_evaluation_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_eval_campaigns_created_at ON soundflare_evaluation_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_eval_results_campaign_id ON soundflare_evaluation_results(campaign_id);
CREATE INDEX IF NOT EXISTS idx_eval_results_room_name ON soundflare_evaluation_results(room_name);
CREATE INDEX IF NOT EXISTS idx_eval_results_agent_id ON soundflare_evaluation_results(agent_id);

-- Create RLS policies
ALTER TABLE soundflare_evaluation_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE soundflare_evaluation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE soundflare_evaluation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to evaluation prompts"
  ON soundflare_evaluation_prompts
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to evaluation campaigns"
  ON soundflare_evaluation_campaigns
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to evaluation results"
  ON soundflare_evaluation_results
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- to refresh the cache in supabase db
NOTIFY pgrst, 'reload schema';