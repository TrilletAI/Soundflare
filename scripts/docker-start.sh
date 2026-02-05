#!/bin/bash

# Wrapper script for starting Docker stack with auto-configuration
# This ensures .env exists before starting Docker Compose

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   SoundFlare Docker Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
    echo -e "${YELLOW}⚠️  .env.docker not found. Generating local environment...${NC}"
    echo ""

    # Generate a random JWT secret for this installation
    JWT_SECRET=$(openssl rand -hex 32)

    echo -e "${BLUE}Generating JWT tokens with unique secret...${NC}"
    ./scripts/generate-jwt-keys.sh "$JWT_SECRET" --write-env --docker
    echo ""

    echo -e "${GREEN}✅ Local environment configured!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Your generated credentials:${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Extract and display the keys
    ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.docker | cut -d '=' -f2)
    SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY=" .env.docker | cut -d '=' -f2)

    echo ""
    echo -e "${GREEN}JWT Secret:${NC}"
    echo "$JWT_SECRET"
    echo ""
    echo -e "${GREEN}Anon Key (public):${NC}"
    echo "$ANON_KEY"
    echo ""
    echo -e "${GREEN}Service Role Key (private):${NC}"
    echo "$SERVICE_KEY"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}💡 These keys are stored in .env.docker${NC}"
    echo -e "${BLUE}💡 Use the Anon Key for client-side SDK connections${NC}"
    echo ""

    # Save credentials to a readable file as well
    cat > .docker-credentials.txt << EOF
SoundFlare Local Docker Credentials
Generated: $(date)

Dashboard URL: http://localhost:8000
Supabase API: http://localhost:54321

Default Login:
  Email: admin@soundflare.ai
  Password: password123

JWT Secret:
  $JWT_SECRET

Anon Key (for SDK):
  $ANON_KEY

Service Role Key (server-side only):
  $SERVICE_KEY

These credentials are also stored in .env.docker
EOF

    echo -e "${GREEN}✅ Credentials saved to .docker-credentials.txt${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Using existing .env.docker${NC}"
    echo ""

    if [ -f .docker-credentials.txt ]; then
        echo -e "${BLUE}💡 Your credentials are in .docker-credentials.txt${NC}"
        echo ""
    fi
fi

# Check if user wants to just generate without starting
if [ "$1" == "--generate-only" ]; then
    echo -e "${BLUE}Done! Run without --generate-only to start Docker.${NC}"
    exit 0
fi

# Start Docker Compose (using .env.docker file)
echo -e "${BLUE}Starting Docker Compose...${NC}"
echo ""

docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d

# Wait for database to be ready
echo -e "${BLUE}Waiting for database to be ready...${NC}"
sleep 5

# Create database schema
echo -e "${BLUE}Creating database schema...${NC}"
docker exec -i soundflare-db psql -U postgres -d postgres < database/setup-supabase.sql
echo -e "${GREEN}✅ Database schema created${NC}"

# Seed the database
./scripts/seed-db.sh

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   🚀 SoundFlare is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Dashboard:${NC}      http://localhost:8000"
echo -e "${BLUE}Supabase API:${NC}   http://localhost:54321"
echo ""
echo -e "${BLUE}Default Login:${NC}"
echo -e "  Email:    admin@soundflare.ai"
echo -e "  Password: password123"
echo ""
echo -e "${YELLOW}📋 Credentials: .docker-credentials.txt${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  docker compose logs -f web    ${GREEN}# View web logs${NC}"
echo -e "  docker compose logs -f auth   ${GREEN}# View auth logs${NC}"
echo -e "  docker compose down           ${GREEN}# Stop all services${NC}"
echo -e "  docker compose down -v        ${GREEN}# Stop and reset database${NC}"
echo ""
