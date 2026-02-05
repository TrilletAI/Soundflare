#!/bin/bash

# Script to seed the database after services are up and migrations are finished
# Uses the API to create the user to ensure all auth tables are correctly populated.

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Waiting for Supabase Auth to be ready...${NC}"

# Wait for Auth health check to pass
for i in {1..60}; do
  if curl -s http://localhost:54321/auth/v1/health | grep -q "GoTrue"; then
    echo -e "${GREEN}Supabase Auth is ready!${NC}"
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${RED}Timeout waiting for Auth to be ready.${NC}"
    exit 1
  fi
  echo -n "."
  sleep 1
done

echo ""
echo -e "${BLUE}Ensuring admin user exists...${NC}"

# Get the Anon Key from .env.docker (fallback to .env if not found)
if [ -f .env.docker ]; then
    ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.docker | cut -d '=' -f2)
else
    ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env | cut -d '=' -f2)
fi

# Try to sign up the admin user
# We ignore the error if the user already exists
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:54321/auth/v1/signup \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON_KEY" \
  -d '{
    "email": "admin@soundflare.ai",
    "password": "password123",
    "data": {
      "first_name": "Admin",
      "last_name": "User"
    }
  }')

# Extract User ID from response
USER_ID=$(echo $SIGNUP_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d '"' -f4)

if [ -z "$USER_ID" ]; then
    # User might already exist, try to get ID from DB
    USER_ID=$(docker exec -i soundflare-db psql -U postgres -d postgres -t -c "SELECT id FROM auth.users WHERE email = 'admin@soundflare.ai';" | tr -d '[:space:]')
    echo -e "${YELLOW}Admin user already exists with ID: $USER_ID${NC}"
else
    echo -e "${GREEN}Admin user created with ID: $USER_ID${NC}"
fi

echo -e "${BLUE}Setting up triggers and seeding database...${NC}"

# Run the seeding SQL
# We use docker exec to run psql inside the db container
docker exec -i soundflare-db psql -U postgres -d postgres << EOF
-- 1. Create the trigger function for new users (if not exists)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS \$\$
BEGIN
  INSERT INTO public.soundflare_users (
    id,
    clerk_id,
    email,
    first_name,
    last_name,
    profile_image_url
  )
  VALUES (
    new.id,
    new.id::text,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users (if not exists)
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END \$\$;

-- 3. Ensure the admin user is in soundflare_users with the right roles
INSERT INTO public.soundflare_users (id, email, clerk_id, first_name, last_name, roles, is_active)
VALUES ('$USER_ID', 'admin@soundflare.ai', '$USER_ID', 'Admin', 'User', '["admin", "owner"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET roles = '["admin", "owner"]'::jsonb, is_active = true;

-- 4. Create a default project linked to this user
INSERT INTO public.soundflare_projects (
    id,
    name,
    description,
    environment,
    is_active,
    created_at,
    updated_at,
    owner_clerk_id
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Default Project',
    'Auto-generated project for local development',
    'dev',
    true,
    now(),
    now(),
    '$USER_ID'
) ON CONFLICT (id) DO NOTHING;

-- 5. Link user to project
INSERT INTO public.soundflare_email_project_mapping (
    email,
    project_id,
    role,
    permissions,
    created_at,
    is_active,
    clerk_id
) VALUES (
    'admin@soundflare.ai',
    '22222222-2222-2222-2222-222222222222',
    'owner',
    '["all"]'::jsonb,
    now(),
    true,
    '$USER_ID'
) ON CONFLICT DO NOTHING;
EOF

echo ""
echo -e "${GREEN}Database seeded successfully!${NC}"