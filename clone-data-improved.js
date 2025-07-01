// Import our fetch polyfill to ensure compatibility
require('./fetch-polyfill');

const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config');
const fs = require('fs');
const logger = require('./logger');

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

// Read tables and views to clone
const tables = fs.readFileSync('./supabase_tables.txt', 'utf8').split(',').map(t => t.trim());
const views = fs.readFileSync('./supabase_views.txt', 'utf8').split(',').map(v => v.trim());

// Configurable parameters
const PAGE_SIZE = 50;
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // ms

/**
 * Sleep function for retry delays
 */
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
      logger.error(`Attempt ${attempt}/${retries} failed for ${name}`, error);
      
      if (attempt < retries) {
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Get table or view data count
 */
async function getDataCount(client, tableName) {
  const { count, error } = await withRetry(
    async () => {
      const result = await client
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (result.error) throw result.error;
      return result;
    },
    `getting count for ${tableName}`
  );
  
  if (error) throw error;
  return count;
}

/**
 * Get a page of data
 */
async function getDataPage(client, tableName, page, pageSize) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  return withRetry(
    async () => {
      const result = await client
        .from(tableName)
        .select('*')
        .range(from, to);
      
      if (result.error) throw result.error;
      return result.data;
    },
    `fetching page ${page} from ${tableName}`
  );
}

/**
 * Insert data into table
 */
async function insertData(client, tableName, data) {
  if (!data || data.length === 0) return;
  
  // Split large batches into smaller chunks
  const CHUNK_SIZE = 20;
  
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    
    await withRetry(
      async () => {
        // Try to use a simple insert first - this works in most cases
        // when the table has been cleared first
        try {
          const result = await client
            .from(tableName)
            .insert(chunk);
          
          if (result.error) throw result.error;
          return result;
        } catch (err) {
          // If the error is about duplicate keys, we can try upsert
          if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
            // Find a key we can use for upsert
            // First, check if 'id' exists
            if (chunk[0].id !== undefined) {
              const upsertResult = await client
                .from(tableName)
                .upsert(chunk, { onConflict: 'id' });
              
              if (upsertResult.error) throw upsertResult.error;
              return upsertResult;
            }
            
            // If we have a uuid field
            if (chunk[0].uuid !== undefined) {
              const upsertResult = await client
                .from(tableName)
                .upsert(chunk, { onConflict: 'uuid' });
              
              if (upsertResult.error) throw upsertResult.error;
              return upsertResult;
            }
            
            // Fallback to searching for common primary key names
            const potentialKeyFields = ['uid', 'user_id', 'key', 'ref_id', 'reference_id', 'farm_id', 'block_id', 'primary_key'];
            
            for (const keyField of potentialKeyFields) {
              if (chunk[0][keyField] !== undefined) {
                try {
                  const upsertResult = await client
                    .from(tableName)
                    .upsert(chunk, { onConflict: keyField });
                  
                  if (!upsertResult.error) {
                    return upsertResult;
                  }
                } catch (keyErr) {
                  // Continue to next potential key
                  console.log(`Tried using ${keyField} as key but failed: ${keyErr.message}`);
                }
              }
            }
            
            // If we couldn't find a suitable key, re-throw the original error
            throw err;
          } else {
            // For non-duplicate errors, re-throw
            throw err;
          }
        }
      },
      `inserting chunk ${Math.floor(i/CHUNK_SIZE) + 1} into ${tableName}`
    );
  }
}

/**
 * Delete all records from a table
 */
async function clearTable(client, tableName) {
  return withRetry(
    async () => {
      // Use a less aggressive approach that's less likely to timeout
      // First try with a standard delete
      try {
        const result = await client
          .from(tableName)
          .delete()
          .neq('id', 0); // This is a common approach to match all rows
          
        if (result.error && !result.error.message.includes('does not exist')) {
          throw result.error;
        }
        
        return result;
      } catch (err) {
        // If that fails, try with a different approach for tables without id
        const result = await client
          .from(tableName)
          .delete()
          .gte('created_at', '1970-01-01');
          
        if (result.error && !result.error.message.includes('does not exist')) {
          throw result.error;
        }
        
        return result;
      }
    },
    `clearing table ${tableName}`
  );
}

/**
 * Clone a table with pagination
 */
async function cloneTable(tableName) {
  console.log(`\n===== Cloning table: ${tableName} =====`);
  
  try {
    // Get total count
    const count = await getDataCount(sourceClient, tableName);
    
    if (!count || count === 0) {
      console.log(`No data in ${tableName} to clone`);
      return;
    }
    
    const totalPages = Math.ceil(count / PAGE_SIZE);
    console.log(`Found ${count} records in ${tableName} (${totalPages} pages)`);
    
    // Try to clear destination table
    try {
      await clearTable(destClient, tableName);
      console.log(`Cleared destination table ${tableName}`);
    } catch (error) {
      console.warn(`Warning: Could not clear destination table ${tableName}: ${error.message}`);
      console.log(`Proceeding with insert anyway...`);
    }
    
    // Clone data page by page
    let totalInserted = 0;
    
    for (let page = 1; page <= totalPages; page++) {
      try {
        const data = await getDataPage(sourceClient, tableName, page, PAGE_SIZE);
        
        if (data && data.length > 0) {
          await insertData(destClient, tableName, data);
          totalInserted += data.length;
          console.log(`Processed page ${page}/${totalPages} for ${tableName} (${totalInserted}/${count} records)`);
        }
      } catch (error) {
        console.error(`Error processing page ${page} for ${tableName}:`, error.message);
        console.log(`Continuing with next page...`);
      }
    }
    
    console.log(`Successfully cloned ${totalInserted}/${count} records to ${tableName}`);
  } catch (error) {
    logger.error(`Failed to clone table ${tableName}`, error);
    throw error;
  }
}

/**
 * Clone a view (as a table)
 */
async function cloneView(viewName) {
  console.log(`\n===== Cloning view: ${viewName} (as a table) =====`);
  
  try {
    // Get total count
    const count = await getDataCount(sourceClient, viewName);
    
    if (!count || count === 0) {
      console.log(`No data in view ${viewName} to clone`);
      return;
    }
    
    const totalPages = Math.ceil(count / PAGE_SIZE);
    console.log(`Found ${count} records in view ${viewName} (${totalPages} pages)`);
    
    // Try to clear destination table
    try {
      await clearTable(destClient, viewName);
      console.log(`Cleared destination table ${viewName}`);
    } catch (error) {
      console.warn(`Warning: Could not clear destination table for view ${viewName}: ${error.message}`);
      console.log(`Proceeding with insert anyway...`);
    }
    
    // Clone data page by page
    let totalInserted = 0;
    
    for (let page = 1; page <= totalPages; page++) {
      try {
        const data = await getDataPage(sourceClient, viewName, page, PAGE_SIZE);
        
        if (data && data.length > 0) {
          await insertData(destClient, viewName, data);
          totalInserted += data.length;
          console.log(`Processed page ${page}/${totalPages} for view ${viewName} (${totalInserted}/${count} records)`);
        }
      } catch (error) {
        console.error(`Error processing page ${page} for view ${viewName}:`, error.message);
        console.log(`Continuing with next page...`);
      }
    }
    
    console.log(`Successfully cloned ${totalInserted}/${count} records from view ${viewName}`);
  } catch (error) {
    logger.error(`Failed to clone view ${viewName}`, error);
    throw error;
  }
}

/**
 * Main function to clone all tables and views
 */
async function cloneAll() {
  console.log('Starting data cloning process...');
  
  // Clone tables first
  for (const table of tables) {
    await cloneTable(table);
  }
  
  // Then clone views
  for (const view of views) {
    await cloneView(view);
  }
  
  console.log('\nCloning process completed!');
}

// Run the cloning process
cloneAll().catch(error => {
  logger.error('Failed to complete cloning process', error);
  process.exit(1);
}); 