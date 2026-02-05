#!/bin/bash

# Script to manually trigger AI reviews for recent call logs
# Usage: ./scripts/trigger-batch-review.sh <agent_id> [limit]

AGENT_ID=$1
LIMIT=${2:-50}
API_URL=${API_URL:-"http://localhost:3000"}

if [ -z "$AGENT_ID" ]; then
  echo "❌ Error: Agent ID is required"
  echo "Usage: $0 <agent_id> [limit]"
  echo "Example: $0 1e69181b-62f7-4c2b-a328-bab6680f189b 50"
  exit 1
fi

echo "🤖 Triggering AI reviews for agent: $AGENT_ID"
echo "📊 Limit: $LIMIT calls"
echo "🌐 API URL: $API_URL"
echo ""

# Make the API call
response=$(curl -s -X POST "$API_URL/api/call-reviews/batch-review" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\": \"$AGENT_ID\", \"limit\": $LIMIT}")

# Check if curl succeeded
if [ $? -ne 0 ]; then
  echo "❌ Failed to connect to API"
  exit 1
fi

# Parse the response
success=$(echo "$response" | grep -o '"success":[^,}]*' | cut -d':' -f2)

if [ "$success" = "true" ]; then
  queued=$(echo "$response" | grep -o '"queued":[0-9]*' | cut -d':' -f2)
  echo "✅ Success! Queued $queued calls for AI review"
  echo "⏳ Reviews will be processed in the next few minutes"
  echo ""
  echo "💡 Tip: Run this command to process them immediately:"
  echo "   curl -X POST $API_URL/api/call-reviews/process-pending"
else
  error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo "❌ Failed to queue reviews"
  echo "Error: $error"
  exit 1
fi
