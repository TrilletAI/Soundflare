-- Migration: Add Supabase trigger for auto AI review
-- This trigger calls the Next.js webhook when a pending review is created

-- 1. Enable pg_net extension (for HTTP requests)
create extension if not exists pg_net;

-- 2. Create function to notify AI review webhook
create or replace function notify_ai_review()
returns trigger
language plpgsql
security definer
as $$
declare
  webhook_url text;
  webhook_secret text;
  agent_auto_review boolean;
begin
  -- Get webhook configuration from environment/secrets
  -- Replace these with your actual values or use Supabase Vault
  webhook_url := current_setting('app.settings.webhook_url', true);
  webhook_secret := current_setting('app.settings.webhook_secret', true);
  
  -- Fallback to hardcoded values if settings not found
  -- TODO: Update these with your actual production values
  if webhook_url is null then
    webhook_url := 'https://soundflare.ai/api/internal/ai-review';
  end if;
  
  if webhook_secret is null then
    webhook_secret := 'YOUR_WEBHOOK_SECRET_HERE';
  end if;

  -- Check if auto-review is enabled for this agent
  select auto_review_enabled
  into agent_auto_review
  from soundflare_agents
  where id = new.agent_id;

  -- Only trigger webhook if auto-review is enabled (default to true if not set)
  if coalesce(agent_auto_review, true) = false then
    raise notice 'Auto-review disabled for agent %, skipping webhook', new.agent_id;
    return new;
  end if;

  -- Call the webhook asynchronously using pg_net
  perform
    net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || webhook_secret
      ),
      body := jsonb_build_object(
        'call_log_id', new.call_log_id,
        'agent_id', new.agent_id
      ),
      timeout_milliseconds := 30000 -- 30 second timeout
    );

  raise notice 'AI review webhook triggered for call_log_id: %', new.call_log_id;
  
  return new;
end;
$$;

-- 3. Create trigger on call_reviews table
drop trigger if exists call_reviews_ai_trigger on call_reviews;

create trigger call_reviews_ai_trigger
after insert on call_reviews
for each row
when (new.status = 'pending')
execute function notify_ai_review();

-- 4. Add comment for documentation
comment on function notify_ai_review() is 
'Triggers AI review webhook when a new pending review is created. Only triggers if agent has auto_review_enabled=true.';

comment on trigger call_reviews_ai_trigger on call_reviews is
'Automatically triggers AI review webhook for pending reviews when auto-review is enabled for the agent.';
