#!/bin/bash
set -e

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting SoundFlare database setup...${NC}"

# Stop any running containers to ensure a clean state
echo "Stopping existing containers..."
docker compose down

# Start the database container in detached mode
echo "Starting database container..."
docker compose up -d db

# Wait for the database to be healthy
echo "Waiting for database to be ready..."
# Loop for up to 60 seconds
for i in {1..60}; do
  if docker compose ps db | grep -q "healthy"; then
    echo -e "${GREEN}Database is healthy!${NC}"
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${RED}Timeout waiting for database to be healthy.${NC}"
    echo "Check logs with: docker compose logs db"
    exit 1
  fi
  echo -n "."
  sleep 1
done

# Check logs for any initialization errors (optional, but good for debugging)
if docker compose logs db | grep -q "ERROR"; then
  echo -e "${RED}Found errors in database logs:${NC}"
  docker compose logs db | grep "ERROR"
  # Don't exit here necessarily, as some errors might be non-fatal or expected during init
else
  echo -e "${GREEN}No errors found in database logs.${NC}"
fi

echo -e "${GREEN}Database setup complete.${NC}"
echo "You can now run: docker compose up -d"
