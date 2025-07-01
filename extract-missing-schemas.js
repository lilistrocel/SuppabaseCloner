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

// Read tables and views from files
const tablesFromFile = fs.readFileSync('./supabase_tables.txt', 'utf8').split(',').map(t => t.trim());
const viewsFromFile = fs.readFileSync('./supabase_views.txt', 'utf8').split(',').map(v => v.trim());

// Sleep function for retry delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get table structure by examining a few records
 */
async function getTableStructure(tableName) {
  try {
    console.log(`Extracting schema for table: ${tableName}`);
    
    // Get a few sample records to better determine structure
    const { data, error } = await sourceClient
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log(`No data found in table ${tableName}`);
      return null;
    }
    
    // Extract column names and types from combined data
    const columns = [];
    const columnMap = new Map();
    
    // Process each record to get more accurate type inference
    data.forEach(record => {
      for (const [columnName, value] of Object.entries(record)) {
        if (!columnMap.has(columnName)) {
          let type = 'text'; // default type
          
          if (typeof value === 'number') {
            if (Number.isInteger(value)) {
              type = 'integer';
            } else {
              type = 'numeric';
            }
          } else if (typeof value === 'boolean') {
            type = 'boolean';
          } else if (value instanceof Date || 
                    (typeof value === 'string' && !isNaN(Date.parse(value)) && 
                    (value.includes('T') || value.match(/^\d{4}-\d{2}-\d{2}$/)))) {
            type = 'timestamp with time zone';
          } else if (typeof value === 'object' && value !== null) {
            type = 'jsonb';
          }
          
          columnMap.set(columnName, {
            name: columnName,
            type: type,
            nullable: value === null,
            examples: [value]
          });
        } else {
          // Update existing column info
          const colInfo = columnMap.get(columnName);
          
          // Track if the column ever has null values
          if (value === null) {
            colInfo.nullable = true;
          }
          
          // Add to examples if different
          if (!colInfo.examples.some(ex => 
              (ex === null && value === null) || 
              (ex !== null && value !== null && JSON.stringify(ex) === JSON.stringify(value)))) {
            colInfo.examples.push(value);
          }
        }
      }
    });
    
    // Convert map to array
    for (const [_, colInfo] of columnMap) {
      columns.push(colInfo);
    }
    
    // Try to determine primary key by common naming patterns
    let primaryKey = null;
    const pkCandidates = ['id', 'uuid', `${tableName}_id`, 'primary_key'];
    
    for (const candidate of pkCandidates) {
      if (columns.some(col => col.name === candidate)) {
        primaryKey = candidate;
        break;
      }
    }
    
    return { tableName, columns, primaryKey };
  } catch (err) {
    console.error(`Error getting structure for ${tableName}:`, err.message);
    return null;
  }
}

/**
 * Generate a SQL CREATE TABLE statement
 */
function generateCreateTableSQL(tableStructure) {
  if (!tableStructure) return '';
  
  const { tableName, columns, primaryKey } = tableStructure;
  
  // Handle no columns case
  if (!columns || columns.length === 0) {
    return '';
  }
  
  let sql = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
  
  // Add columns
  const columnDefs = columns.map(col => {
    // Determine if this is a primary key
    const isPrimaryKey = col.name === primaryKey;
    
    let def = `  "${col.name}" ${col.type}`;
    
    if (!col.nullable && !isPrimaryKey) {
      def += ' NOT NULL';
    }
    
    return def;
  });
  
  sql += columnDefs.join(',\n');
  
  // Add PRIMARY KEY constraint if we found one
  if (primaryKey) {
    sql += `,\n  PRIMARY KEY ("${primaryKey}")`;
  }
  
  sql += '\n);\n';
  
  return sql;
}

/**
 * Get view definition from source data
 */
async function getViewData(viewName) {
  try {
    console.log(`Extracting data for view: ${viewName}`);
    
    // Get sample data from view
    const { data, error } = await sourceClient
      .from(viewName)
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log(`No data found in view ${viewName}`);
      return null;
    }
    
    return { viewName, data };
  } catch (err) {
    console.error(`Error getting data for view ${viewName}:`, err.message);
    return null;
  }
}

/**
 * Generate SQL for creating a view as a table
 */
function generateCreateViewAsTableSQL(viewData) {
  if (!viewData || !viewData.data || viewData.data.length === 0) return '';
  
  const { viewName, data } = viewData;
  
  // Extract column structure from first record
  const record = data[0];
  const columns = [];
  
  for (const [columnName, value] of Object.entries(record)) {
    let type = 'text'; // default type
    
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        type = 'integer';
      } else {
        type = 'numeric';
      }
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (value instanceof Date || 
              (typeof value === 'string' && !isNaN(Date.parse(value)) && 
              (value.includes('T') || value.match(/^\d{4}-\d{2}-\d{2}$/)))) {
      type = 'timestamp with time zone';
    } else if (typeof value === 'object' && value !== null) {
      type = 'jsonb';
    }
    
    columns.push({
      name: columnName,
      type: type
    });
  }
  
  // Generate CREATE TABLE statement for the view
  let sql = `-- Creating table to replace view: ${viewName}\n`;
  sql += `CREATE TABLE IF NOT EXISTS "${viewName}" (\n`;
  
  const columnDefs = columns.map(col => {
    return `  "${col.name}" ${col.type}`;
  });
  
  sql += columnDefs.join(',\n');
  sql += '\n);\n';
  
  return sql;
}

/**
 * Main function to generate SQL for tables and views
 */
async function generateSQLScripts() {
  console.log('Generating SQL scripts for tables and views...');
  
  // Tables to create
  let tablesSQL = '-- SQL script to create missing tables in destination database\n\n';
  
  for (const tableName of tablesFromFile) {
    const structure = await getTableStructure(tableName);
    
    if (structure) {
      const sql = generateCreateTableSQL(structure);
      tablesSQL += `-- Table: ${tableName}\n${sql}\n`;
    }
  }
  
  fs.writeFileSync('create_tables.sql', tablesSQL);
  console.log('SQL script for creating tables saved to create_tables.sql');
  
  // Views to create as tables
  let viewsSQL = '-- SQL script to create tables from views in destination database\n\n';
  
  for (const viewName of viewsFromFile) {
    const viewData = await getViewData(viewName);
    
    if (viewData) {
      const sql = generateCreateViewAsTableSQL(viewData);
      viewsSQL += `${sql}\n`;
    }
  }
  
  fs.writeFileSync('create_views_as_tables.sql', viewsSQL);
  console.log('SQL script for creating views as tables saved to create_views_as_tables.sql');
  
  // Generate a combined approach information file
  let combinedInfo = `
# Instructions for Setting Up Missing Tables and Views

## Missing Tables
To create the missing tables in your destination Supabase database:

1. Open your Supabase dashboard and navigate to the SQL Editor
2. Load the file \`create_tables.sql\`
3. Run the SQL commands to create all missing tables

## Views Strategy
For views, we have two recommended approaches:

### Option 1: Create as Regular Tables
1. Open your Supabase dashboard and navigate to the SQL Editor
2. Load the file \`create_views_as_tables.sql\`
3. Run the SQL commands to create tables with the same structure as the views

### Option 2: Recreate the Actual Views
For this approach, you'll need to:
1. Extract the view definitions from your source database (requires admin privileges)
2. Create the same views in your destination database

Since we don't have admin access to your source database, we can't automatically extract the view definitions.
However, you may be able to:
1. Use the Supabase dashboard in your source project to see the SQL that defines each view
2. Copy those definitions and run them in your destination project

## After Creating Tables and Views
Once you've created all the missing tables and views, you can run the data cloning process:

\`\`\`
npm start
\`\`\`

This will copy all the data from your source database to your destination database.
`;

  fs.writeFileSync('setup_instructions.md', combinedInfo);
  console.log('Setup instructions saved to setup_instructions.md');
}

// Run the script
generateSQLScripts().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
}); 