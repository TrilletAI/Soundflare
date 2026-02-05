#!/bin/bash

# Quick migration runner - opens SQL file and gives instructions
# Uses credentials from .env.local

cd "$(dirname "$0")/.." || exit 1

# Load .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

SQL_FILE="database/add_call_reviews_table.sql"

echo "🔧 Call Reviews Table Migration"
echo ""
echo "📋 Using Supabase project:"
echo "   $NEXT_PUBLIC_SUPABASE_URL"
echo ""
echo "══════════════════════════════════════════════════════════"
echo ""
echo "To run this migration:"
echo ""
echo "  1. Opening SQL file for you..."
echo "  2. Go to: https://app.supabase.com"
echo "  3. Click: SQL Editor → New Query"
echo "  4. Copy the SQL from the opened file"
echo "  5. Paste into Supabase and click Run"
echo ""
echo "══════════════════════════════════════════════════════════"
echo ""

# Open the SQL file
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "$SQL_FILE"
  echo "✅ Opened: $SQL_FILE"
  echo ""
  echo "💡 The SQL file is now open - copy it to Supabase SQL Editor!"
else
  echo "📄 SQL file location: $SQL_FILE"
  cat "$SQL_FILE"
fi

echo ""
echo "After running in Supabase, refresh your app and you're done! 🎉"
