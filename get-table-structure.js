// Import our fetch polyfill to ensure compatibility
require('./fetch-polyfill');

const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config');
const fs = require('fs');

// Create Supabase clients with improved options
const sourceClient = createClient(config.source.url, config.source.key, {
  auth: { persistSession: false },
  global: { 
    headers: { 'x-retry-enabled': 'true' }
  }
});

// Get table names from file
const tables = fs.readFileSync('./supabase_tables.txt', 'utf8').split(',').map(t => t.trim());
const views = fs.readFileSync('./supabase_views.txt', 'utf8').split(',').map(v => v.trim());

// Sleep function for retry delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get table structure by examining first record
 */
async function getTableStructure(tableName) {
  try {
    // Get a sample record to determine structure
    const { data, error } = await sourceClient
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log(`No data found in table ${tableName}`);
      return null;
    }
    
    // Extract column names and types
    const record = data[0];
    const columns = [];
    
    // Try to detect types
    for (const [columnName, value] of Object.entries(record)) {
      let type = 'text'; // default type
      
      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          type = 'integer';
        } else {
          type = 'float';
        }
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('T'))) {
        type = 'timestamp with time zone';
      } else if (typeof value === 'object' && value !== null) {
        type = 'jsonb';
      }
      
      columns.push({
        name: columnName,
        type: type,
        value: value
      });
    }
    
    return { tableName, columns };
  } catch (err) {
    console.error(`Error getting structure for ${tableName}:`, err.message);
    return null;
  }
}

/**
 * Generate CREATE TABLE statement
 */
function generateCreateTableSQL(tableStructure) {
  if (!tableStructure) return '';
  
  const { tableName, columns } = tableStructure;
  
  // Handle no columns case
  if (!columns || columns.length === 0) {
    return '';
  }
  
  let sql = `CREATE TABLE "${tableName}" (\n`;
  
  // Add columns
  const columnDefs = columns.map(col => {
    // Try to detect primary key (common names)
    const isPrimaryKey = col.name === 'id' || col.name === 'uuid' || 
                        col.name === 'primary_key' || col.name === `${tableName}_id`;
    
    let def = `  "${col.name}" ${col.type}`;
    
    // Add PRIMARY KEY if detected
    if (isPrimaryKey) {
      def += ' PRIMARY KEY';
    }
    
    return def;
  });
  
  sql += columnDefs.join(',\n');
  sql += '\n);\n';
  
  return sql;
}

/**
 * Main function to generate SQL for all tables
 */
async function generateSQLForAllTables() {
  console.log('Generating SQL for table creation...');
  
  let sqlContent = '-- SQL script to create missing tables in destination database\n\n';
  
  // Process tables
  for (const tableName of tables) {
    console.log(`Processing table: ${tableName}`);
    const structure = await getTableStructure(tableName);
    
    if (structure) {
      const sql = generateCreateTableSQL(structure);
      sqlContent += `-- Table: ${tableName}\n${sql}\n`;
    }
  }
  
  // Process views as tables
  for (const viewName of views) {
    console.log(`Processing view as table: ${viewName}`);
    const structure = await getTableStructure(viewName);
    
    if (structure) {
      // Change the structure name to the view name
      structure.tableName = viewName;
      const sql = generateCreateTableSQL(structure);
      sqlContent += `-- View -> Table: ${viewName}\n${sql}\n`;
    }
  }
  
  // Save to file
  fs.writeFileSync('create_tables.sql', sqlContent);
  console.log('SQL script saved to create_tables.sql');
}

// Run the script
generateSQLForAllTables().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
}); 