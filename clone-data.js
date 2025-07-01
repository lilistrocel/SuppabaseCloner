const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config');
const fs = require('fs');

// Create Supabase clients
const sourceClient = createClient(config.source.url, config.source.key, {
  auth: { persistSession: false },
  realtime: { timeout: 60000 }
});

const destClient = createClient(config.destination.url, config.destination.key, {
  auth: { persistSession: false },
  realtime: { timeout: 60000 }
});

// Read tables and views to clone
const tables = fs.readFileSync('./supabase_tables.txt', 'utf8').split(',').map(t => t.trim());
const views = fs.readFileSync('./supabase_views.txt', 'utf8').split(',').map(v => v.trim());

// Configurable parameters
const PAGE_SIZE = 100;
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // ms

/**
 * Sleep function for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch data with retries
 */
async function fetchWithRetry(client, table, page, pageSize) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await client
        .from(table)
        .select('*', { count: 'exact' })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error(`Attempt ${attempt}/${MAX_RETRIES} failed for ${table} (page ${page}):`, error.message);
      
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      
      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

/**
 * Insert data with retries
 */
async function insertWithRetry(client, table, data) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { error } = await client
        .from(table)
        .insert(data);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Attempt ${attempt}/${MAX_RETRIES} failed inserting into ${table}:`, error.message);
      
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      
      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

/**
 * Clone a table with pagination
 */
async function cloneTable(tableName) {
  console.log(`Cloning table: ${tableName}`);
  
  try {
    // Get first page and total count
    const { data: firstPageData, count } = await fetchWithRetry(sourceClient, tableName, 1, PAGE_SIZE);
    
    if (!firstPageData || firstPageData.length === 0) {
      console.log(`No data in ${tableName} to clone`);
      return;
    }
    
    const totalRecords = count || firstPageData.length;
    const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
    
    console.log(`Found ${totalRecords} records in ${tableName} (${totalPages} pages)`);
    
    // Instead of trying to delete all records at once, let's create a clean table on the destination
    // by first checking for the table structure
    // Let's create a small batch from the source data to insert into the destination
    const sampleBatch = firstPageData.slice(0, 1);
    
    if (!data || data.length === 0) {
      console.log(`No data in ${tableName} to clone`);
      return;
    }
    
    console.log(`Found ${data.length} records in ${tableName}`);
    
    // First delete all existing data in destination table
    const { error: deleteError } = await destClient
      .from(tableName)
      .delete()
      .neq('id', 0); // This will delete all rows
    
    if (deleteError) {
      console.error(`Error clearing destination table ${tableName}:`, deleteError);
      return;
    }
    
    // Insert data into destination
    const { error: insertError } = await destClient
      .from(tableName)
      .insert(data);
    
    if (insertError) {
      console.error(`Error inserting data into ${tableName}:`, insertError);
      return;
    }
    
    console.log(`Successfully cloned ${data.length} records to ${tableName}`);
  } catch (err) {
    console.error(`Unexpected error cloning ${tableName}:`, err);
  }
}

async function cloneView(viewName) {
  console.log(`Cloning view: ${viewName}`);
  
  try {
    // For views, we need to get the definition from source and create it in destination
    // This requires admin access which we don't have with just keys
    // Instead, we'll just copy the data to a table with the same name
    
    // Fetch all data from source view
    const { data, error } = await sourceClient
      .from(viewName)
      .select('*');
    
    if (error) {
      console.error(`Error fetching data from view ${viewName}:`, error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`No data in view ${viewName} to clone`);
      return;
    }
    
    console.log(`Found ${data.length} records in view ${viewName}`);
    
    // We'll create a table with the same name in the destination (if it doesn't exist already)
    // In a real implementation, you would need to handle the schema creation properly
    
    // First delete all existing data if the table exists
    const { error: deleteError } = await destClient
      .from(viewName)
      .delete()
      .neq('id', 0); // This deletes all rows, assuming there's an id column
    
    if (deleteError && !deleteError.message.includes('does not exist')) {
      console.error(`Error clearing destination table for view ${viewName}:`, deleteError);
      return;
    }
    
    // Insert data into destination
    const { error: insertError } = await destClient
      .from(viewName)
      .insert(data);
    
    if (insertError) {
      console.error(`Error inserting data for view ${viewName}:`, insertError);
      return;
    }
    
    console.log(`Successfully cloned ${data.length} records from view ${viewName}`);
  } catch (err) {
    console.error(`Unexpected error cloning view ${viewName}:`, err);
  }
}

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
  
  console.log('Cloning process completed!');
}

cloneAll().catch(error => {
  console.error('Error in cloning process:', error);
}); 