#!/usr/bin/env node

/**
 * Run database migration using Supabase client
 * Uses credentials from .env.local
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local')
  console.error('Required:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🔧 Running call_reviews table migration...\n')

  // Read the SQL file
  const sqlPath = path.join(__dirname, '../database/add_call_reviews_table.sql')

  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Error: Migration file not found at:', sqlPath)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // If exec_sql doesn't exist, we need to use the REST API differently
      // Try splitting and executing statements one by one
      console.log('⚠️  Direct SQL execution not available via REST API')
      console.log('📋 Please run this migration manually in Supabase SQL Editor:\n')
      console.log('1. Go to: https://app.supabase.com')
      console.log('2. SQL Editor → New Query')
      console.log('3. Copy from: database/add_call_reviews_table.sql')
      console.log('4. Click Run\n')
      console.log('Reason:', error.message)
      process.exit(1)
    }

    console.log('✅ Successfully created call_reviews table!\n')
    console.log('Next steps:')
    console.log('  1. Refresh your app')
    console.log('  2. Select some calls and click "AI Review"')
    console.log('  3. The AI Review column should now work!\n')

  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    console.log('\n📋 Please run the migration manually:')
    console.log('  1. Open: https://app.supabase.com')
    console.log('  2. SQL Editor → New Query')
    console.log('  3. Copy from: database/add_call_reviews_table.sql')
    console.log('  4. Click Run\n')
    process.exit(1)
  }
}

// Check if table already exists first
async function checkTableExists() {
  try {
    const { data, error } = await supabase
      .from('call_reviews')
      .select('id')
      .limit(1)

    if (!error) {
      console.log('ℹ️  Table "call_reviews" already exists!')
      console.log('   Skipping migration.\n')
      return true
    }

    return false
  } catch (err) {
    return false
  }
}

async function main() {
  const exists = await checkTableExists()

  if (!exists) {
    await runMigration()
  }
}

main()
