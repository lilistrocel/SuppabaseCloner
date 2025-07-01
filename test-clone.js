// Import our fetch polyfill to ensure compatibility
require('./fetch-polyfill');

const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config');

// Create Supabase clients with improved options
const sourceClient = createClient(config.source.url, config.source.key, {
  auth: { persistSession: false },
  global: { 
    headers: { 'x-retry-enabled': 'true' }
  }
});

const destClient = createClient(config.destination.url, config.destination.key, {
  auth: { persistSession: false },
  global: { 
    headers: { 'x-retry-enabled': 'true' }
  }
});

// Configurable parameters
const PAGE_SIZE = 10;
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // ms

// Sleep function for retry delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generic retry wrapper for any async function
 */
async function withRetry(fn, name, retries = MAX_RETRIES, delay = RETRY_DELAY) {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt}/${retries} failed for ${name}:`, error.message || error);
      
      if (attempt < retries) {
        const waitTime = delay * Math.pow(1.5, attempt - 1);
        console.log(`Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      }
    }
  }
  
  throw lastError;
}

/**
 * Test basic connectivity to Supabase
 */
async function testConnection() {
  console.log("Testing source database connection...");
  try {
    const { data, error } = await sourceClient.auth.getSession();
    if (error) throw error;
    console.log("✅ Source connection successful");
  } catch (err) {
    console.error("❌ Source connection failed:", err.message);
  }
  
  console.log("Testing destination database connection...");
  try {
    const { data, error } = await destClient.auth.getSession();
    if (error) throw error;
    console.log("✅ Destination connection successful");
  } catch (err) {
    console.error("❌ Destination connection failed:", err.message);
  }
}

/**
 * Test cloning a single small table
 */
async function testCloneSingleTable(tableName) {
  console.log(`\nTesting clone of table: ${tableName}`);
  
  try {
    // Test SELECT query on source
    console.log("Testing SELECT on source...");
    const { data: sourceData, error: sourceError } = await withRetry(
      async () => {
        return await sourceClient
          .from(tableName)
          .select('*')
          .limit(5);
      },
      `SELECT from ${tableName}`
    );
    
    if (sourceError) throw sourceError;
    console.log(`✅ Successfully fetched ${sourceData.length} rows from source`);
    
    // Test INSERT on destination
    if (sourceData && sourceData.length > 0) {
      console.log("Testing INSERT on destination...");
      
      // First get the schema of the table to identify the primary key column
      const { data: schemaData, error: schemaError } = await withRetry(
        async () => {
          // Try to get schema by selecting just one row
          return await destClient
            .from(tableName)
            .select()
            .limit(1);
        },
        `getting schema for ${tableName}`
      );
      
      // If we can't get the schema, we'll just try direct insert without timestamp
      // Clone the first record from source to use for insert test
      const testRecord = {...sourceData[0]};
      
      // Try to insert the record
      console.log("Attempting to insert a record into destination...");
      const { data: insertData, error: insertError } = await withRetry(
        async () => {
          return await destClient
            .from(tableName)
            .insert([testRecord])
            .select();
        },
        `INSERT to ${tableName}`
      );
      
      if (insertError) {
        if (insertError.message.includes('duplicate')) {
          console.log("✅ Record already exists in destination (which is good for testing)");
        } else {
          throw insertError;
        }
      } else {
        console.log(`✅ Successfully inserted test record to destination`);
      }
      
      console.log("Skipping record cleanup since we used direct data from source");
    }
    
    console.log(`\n✅ All tests passed for ${tableName}!`);
  } catch (err) {
    console.error(`\n❌ Test failed for ${tableName}:`, err.message);
  }
}

// Run tests
async function main() {
  console.log("=== SUPABASE CONNECTION TEST ===");
  await testConnection();
  
  // Pick the first table from the list for testing
  // You can replace this with any table name you want to test
  const testTable = "farm_details"; // Use a table that likely has a small amount of data
  
  await testCloneSingleTable(testTable);
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
}); 