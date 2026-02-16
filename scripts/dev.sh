#!/bin/bash

# Local development: runs infrastructure in Docker + Next.js dev server locally
# This gives you instant hot-reload instead of waiting for Docker rebuilds

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   SoundFlare Local Dev Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Ensure .env.docker exists (needed for infrastructure services)
if [ ! -f .env.docker ]; then
    echo -e "${YELLOW}No .env.docker found. Running initial setup...${NC}"
    ./scripts/docker-start.sh --generate-only
fi

# Create .env.local from .env.docker with adjustments for local dev
echo -e "${BLUE}Creating .env.local for local dev server...${NC}"
sed \
    -e 's|SUPABASE_INTERNAL_URL=http://kong:54321|SUPABASE_INTERNAL_URL=http://localhost:54321|' \
    -e 's|NODE_ENV=production|NODE_ENV=development|' \
    .env.docker > .env.local

echo -e "${GREEN}✅ .env.local created${NC}"
echo ""

# Start only infrastructure services (not the web container)
echo -e "${BLUE}Starting infrastructure services (db, auth, rest, kong)...${NC}"
docker compose --env-file .env.docker up -d db auth rest kong
echo ""

# Wait for DB to be healthy
echo -e "${BLUE}Waiting for database...${NC}"
for i in {1..30}; do
    if docker exec soundflare-db pg_isready -U postgres > /dev/null 2>&1; then
        break
    fi
    sleep 1
done

# Always apply schema (idempotent — safe to re-run without data loss)
echo -e "${BLUE}Applying database schema...${NC}"
docker exec -i soundflare-db psql -U postgres -d postgres < database/setup-supabase.sql
echo -e "${GREEN}✅ Schema applied${NC}"

# Reload PostgREST schema cache (it started before FKs/grants were applied)
echo -e "${BLUE}Reloading PostgREST schema cache...${NC}"
docker restart soundflare-rest
sleep 5
echo -e "${GREEN}✅ PostgREST reloaded${NC}"

# Seed if admin user doesn't exist in auth
ADMIN_EXISTS=$(docker exec soundflare-db psql -U postgres -d postgres -tAc "SELECT count(*) FROM auth.users WHERE email = 'admin@soundflare.ai'" 2>/dev/null || echo "0")
if [ "$ADMIN_EXISTS" -lt "1" ] 2>/dev/null; then
    echo -e "${BLUE}Seeding database...${NC}"
    ./scripts/seed-db.sh
    echo -e "${GREEN}✅ Database seeded${NC}"
else
    echo -e "${GREEN}✅ Admin user already exists${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Infrastructure ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Starting Next.js dev server...${NC}"
echo -e "${YELLOW}App will be at: http://localhost:8000${NC}"
echo ""

npm run dev
