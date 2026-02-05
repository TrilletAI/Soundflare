#!/bin/bash

# Script to help create the call_reviews table
# Since we use Supabase, you should run this in the SQL Editor

echo "🔧 Call Reviews Table Setup"
echo ""
echo "To create the call_reviews table, follow these steps:"
echo ""
echo "1. Open Supabase Dashboard:"
echo "   https://app.supabase.com"
echo ""
echo "2. Go to SQL Editor → New Query"
echo ""
echo "3. Copy and paste the SQL from:"
echo "   database/add_call_reviews_table.sql"
echo ""
echo "4. Click Run (or press Cmd/Ctrl + Enter)"
echo ""
echo "5. You should see: 'Success. No rows returned'"
echo ""
echo "That's it! Then refresh your app and the AI Review features will work."
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# If they have psql installed and want to try command line
if command -v psql &> /dev/null; then
  echo "💡 Alternative: If you have a direct database URL, you can run:"
  echo ""
  echo "   export DATABASE_URL='postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres'"
  echo "   psql \"\$DATABASE_URL\" -f database/add_call_reviews_table.sql"
  echo ""
else
  echo "💡 Tip: Install psql if you want to run migrations from command line"
  echo ""
fi

# Open the SQL file for them
SQL_FILE="$(dirname "$0")/../database/add_call_reviews_table.sql"
if [ -f "$SQL_FILE" ]; then
  echo "📄 SQL file location:"
  echo "   $SQL_FILE"
  echo ""

  # Try to open it in their default editor on macOS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "Would you like to open the SQL file now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      open "$SQL_FILE"
      echo "✅ Opened SQL file!"
    fi
  fi
fi
