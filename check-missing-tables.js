// Import our fetch polyfill to ensure compatibility
require('./fetch-polyfill');

const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config');
const fs = require('fs');

// Create Supabase clients
const sourceClient = createClient(config.source.url, config.source.key, {
  auth: { persistSession: false }
});

const destClient = createClient(config.destination.url, config.destination.key, {
  auth: { persistSession: false }
});

// Get table names from file
const tables = fs.readFileSync('./supabase_tables.txt', 'utf8').split(',').map(t => t.trim());
const views = fs.readFileSync('./supabase_views.txt', 'utf8').split(',').map(v => v.trim());

/**
 * Check if a table exists in the database
 */
async function checkTableExists(client, tableName) {
  try {
    // Try to select one row with limit to see if the table exists
    const { data, error } = await client
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(1);
    
    // If there's no error about the table not existing, then it exists
    return !error || !error.message.includes('does not exist');
  } catch (err) {
    // If we get an error about the table not existing, it doesn't exist
    return !err.message.includes('does not exist');
  }
}

/**
 * Main function to check all tables
 */
async function checkAllTables() {
  console.log('Checking tables in source and destination databases...');
  
  const results = {
    source: { exists: [], missing: [] },
    destination: { exists: [], missing: [] }
  };
  
  // Check tables
  console.log('\nChecking tables:');
  for (const tableName of tables) {
    process.stdout.write(`Checking ${tableName}... `);
    
    // Check in source
    const existsInSource = await checkTableExists(sourceClient, tableName);
    if (existsInSource) {
      results.source.exists.push(tableName);
      process.stdout.write('✓ in source, ');
    } else {
      results.source.missing.push(tableName);
      process.stdout.write('✗ in source, ');
    }
    
    // Check in destination
    const existsInDest = await checkTableExists(destClient, tableName);
    if (existsInDest) {
      results.destination.exists.push(tableName);
      process.stdout.write('✓ in destination\n');
    } else {
      results.destination.missing.push(tableName);
      process.stdout.write('✗ in destination\n');
    }
  }
  
  // Check views
  console.log('\nChecking views:');
  for (const viewName of views) {
    process.stdout.write(`Checking ${viewName}... `);
    
    // Check in source
    const existsInSource = await checkTableExists(sourceClient, viewName);
    if (existsInSource) {
      results.source.exists.push(viewName);
      process.stdout.write('✓ in source, ');
    } else {
      results.source.missing.push(viewName);
      process.stdout.write('✗ in source, ');
    }
    
    // Check in destination
    const existsInDest = await checkTableExists(destClient, viewName);
    if (existsInDest) {
      results.destination.exists.push(viewName);
      process.stdout.write('✓ in destination\n');
    } else {
      results.destination.missing.push(viewName);
      process.stdout.write('✗ in destination\n');
    }
  }
  
  // Print summary
  console.log('\n--- Summary ---');
  console.log(`Source: ${results.source.exists.length} tables/views exist, ${results.source.missing.length} missing`);
  console.log(`Destination: ${results.destination.exists.length} tables/views exist, ${results.destination.missing.length} missing`);
  
  if (results.destination.missing.length > 0) {
    console.log('\nMissing tables/views in destination:');
    results.destination.missing.forEach(table => console.log(`- ${table}`));
  }
}

// Run the script
checkAllTables().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
}); 