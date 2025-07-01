// Script to extract exact PostgreSQL schema information from source database
require('./fetch-polyfill');
const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config');
const fs = require('fs');

// Create Supabase client
const sourceClient = createClient(config.source.url, config.source.key, {
  auth: { persistSession: false },
  global: { 
    headers: { 'x-retry-enabled': 'true' }
  }
});

// Read tables and views from files
const tables = fs.readFileSync('./supabase_tables.txt', 'utf8').split(',').map(t => t.trim());
const views = fs.readFileSync('./supabase_views.txt', 'utf8').split(',').map(v => v.trim());

// Manual schema definitions for views where we have the exact structure
const manualSchemas = {
  'block_change_pending': [
    { column_name: 'reference', data_type: 'uuid', is_nullable: true },
    { column_name: 'block_id', data_type: 'text', is_nullable: true },
    { column_name: 'status', data_type: 'text', is_nullable: true }
  ]
};

// Manual field corrections for specific tables when our detection is incorrect
const fieldCorrections = {
  'farm_block': {
    'InventoryData': 'jsonb'
  },
  'inventory_stock': {
    'stock': 'float8',
    'total_harvest': 'text',
    'totaldelivery': 'text'
  },
  'orderlist_re': {
    'vehicle_id': 'text'
  },
  'vehicle_details': {
    'vehiclename': 'text'
  },
  'my_table': {
    'my_column': 'float8'
  }
};

/**
 * Get column information including PostgreSQL types
 */
async function getTableColumns(tableName) {
  try {
    console.log(`Extracting schema for: ${tableName}`);
    
    // Check if we have a manual schema definition
    if (manualSchemas[tableName]) {
      console.log(`  Using manual schema definition for ${tableName}`);
      return manualSchemas[tableName];
    }
    
    // This query uses RPC to get column definitions with exact PostgreSQL types
    const { data, error } = await sourceClient.rpc('get_table_definition', { 
      table_name: tableName 
    });
    
    if (error) {
      // If RPC fails (which is likely without admin rights), fall back to inferring from data
      console.log(`  RPC failed, inferring schema from data`);
      return inferSchemaFromData(tableName);
    }
    
    return data;
  } catch (err) {
    console.error(`Error getting schema for ${tableName}:`, err.message);
    console.log(`  Falling back to inferring schema from data`);
    return inferSchemaFromData(tableName);
  }
}

/**
 * Infer schema by querying for data and including column info
 */
async function inferSchemaFromData(tableName) {
  try {
    // First try to get the exact column definitions from information_schema
    // This preserves the original PostgreSQL types
    try {
      console.log(`  Trying to get schema from information_schema for ${tableName}`);
      const { data, error } = await sourceClient.from('information_schema.columns')
        .select('column_name, data_type, udt_name, is_nullable')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (!error && data && data.length > 0) {
        console.log(`  Successfully retrieved schema from information_schema (${data.length} columns)`);
        
        // Map PostgreSQL types correctly
        return data.map(col => {
          // Use the more specific udt_name when available (e.g., 'int8' instead of 'bigint')
          let dataType = col.udt_name || col.data_type;
          
          // Retain original precision and domain-specific types
          if (dataType === 'numeric' && col.numeric_precision) {
            dataType = `numeric(${col.numeric_precision}, ${col.numeric_scale || 0})`;
          }
          
          return {
            column_name: col.column_name,
            data_type: dataType,
            is_nullable: true // Make all columns nullable as requested
          };
        });
      }
    } catch (catalogErr) {
      console.log(`  Cannot access information_schema, continuing with data inference: ${catalogErr.message}`);
    }
    
    // If we can't access system tables, infer from the data itself
    const { data, error } = await sourceClient
      .from(tableName)
      .select('*')
      .limit(10); // Increase sample size to better detect types
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log(`  No data found in ${tableName}`);
      
      // Check if we should use a manual schema
      if (tableName === 'block_change_pending' && !manualSchemas[tableName]) {
        console.log(`  Using backup schema from create_views_accurate.sql for ${tableName}`);
        return [
          { column_name: 'reference', data_type: 'uuid', is_nullable: true },
          { column_name: 'block_id', data_type: 'text', is_nullable: true },
          { column_name: 'status', data_type: 'text', is_nullable: true }
        ];
      }
      
      return [];
    }
    
    // Extract more accurate type information by examining all records in the sample
    // For numeric fields especially, check if any record has a decimal value
    const columnTypes = {};
    const records = data;
    
    // Initialize with types from the first record
    records.forEach(record => {
      Object.keys(record).forEach(columnName => {
        const value = record[columnName];
        if (!(columnName in columnTypes)) {
          columnTypes[columnName] = {
            samples: [],
            hasDecimals: false,
            isString: false,
            isNumber: false,
            isDate: false,
            isBoolean: false,
            isUuid: false,
            isObject: false
          };
        }
        
        if (value !== null) {
          columnTypes[columnName].samples.push(value);
          
          if (typeof value === 'number') {
            columnTypes[columnName].isNumber = true;
            if (!Number.isInteger(value)) {
              columnTypes[columnName].hasDecimals = true;
            }
          } else if (typeof value === 'boolean') {
            columnTypes[columnName].isBoolean = true;
          } else if (typeof value === 'string') {
            columnTypes[columnName].isString = true;
            
            // Check if string contains decimal number
            if (!isNaN(parseFloat(value)) && isFinite(value) && value.includes('.')) {
              columnTypes[columnName].hasDecimals = true;
            }
            
            // Check if it's a date
            if (!isNaN(Date.parse(value)) && (value.includes('T') || value.match(/^\d{4}-\d{2}-\d{2}$/))) {
              columnTypes[columnName].isDate = true;
            }
            
            // Check if it's a UUID
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
              columnTypes[columnName].isUuid = true;
            }
          } else if (typeof value === 'object') {
            columnTypes[columnName].isObject = true;
          }
        }
      });
    });
    
    // Convert the collected type information to PostgreSQL types
    return Object.keys(columnTypes).map(columnName => {
      const typeInfo = columnTypes[columnName];
      let dataType = 'text'; // Default
      
      if (typeInfo.isBoolean) {
        dataType = 'boolean';
      } else if (typeInfo.isUuid) {
        dataType = 'uuid';
      } else if (typeInfo.isDate) {
        dataType = 'timestamptz';
      } else if (typeInfo.isNumber || (typeInfo.isString && typeInfo.samples.every(s => !isNaN(parseFloat(s)) && isFinite(s)))) {
        if (typeInfo.hasDecimals) {
          dataType = 'float8';
        } else {
          dataType = 'int8';
        }
      } else if (typeInfo.isObject) {
        dataType = 'jsonb';
      }
      
      // Apply manual field corrections if available
      if (fieldCorrections[tableName] && fieldCorrections[tableName][columnName]) {
        dataType = fieldCorrections[tableName][columnName];
      }
      
      return {
        column_name: columnName,
        data_type: dataType,
        is_nullable: true // Always make nullable as requested
      };
    });
  } catch (err) {
    console.error(`  Error inferring schema for ${tableName}:`, err.message);
    return [];
  }
}

/**
 * Generate CREATE TABLE statement with exact PostgreSQL types
 */
function generateCreateTableSQL(tableName, columns) {
  if (!columns || columns.length === 0) {
    return `-- No schema information available for ${tableName}\n`;
  }
  
  let sql = `DROP TABLE IF EXISTS "${tableName}";\n\n`;
  sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
  
  // Add columns with their PostgreSQL types
  const columnDefs = columns.map(col => {
    // Remove NOT NULL constraints to allow nullable fields
    return `  "${col.column_name}" ${col.data_type}`;
  });
  
  sql += columnDefs.join(',\n');
  sql += '\n);\n';
  
  return sql;
}

/**
 * Main function to extract schemas and generate SQL
 */
async function extractAndGenerateSQL() {
  console.log('Extracting exact PostgreSQL schema information...');
  
  // Process tables
  let tablesSQL = '-- SQL script to create tables with exact PostgreSQL types\n\n';
  
  for (const tableName of tables) {
    const columns = await getTableColumns(tableName);
    const sql = generateCreateTableSQL(tableName, columns);
    tablesSQL += `-- Table: ${tableName}\n${sql}\n`;
  }
  
  fs.writeFileSync('create_tables_exact.sql', tablesSQL);
  console.log('\nSQL for tables saved to create_tables_exact.sql');
  
  // Process views
  let viewsSQL = '-- SQL script to create tables from views with exact PostgreSQL types\n\n';
  
  for (const viewName of views) {
    const columns = await getTableColumns(viewName);
    const sql = generateCreateTableSQL(viewName, columns);
    viewsSQL += `-- View -> Table: ${viewName}\n${sql}\n`;
  }
  
  fs.writeFileSync('create_views_exact.sql', viewsSQL);
  console.log('SQL for views saved to create_views_exact.sql');
  
  console.log('\nExtraction complete!');
}

// Run the script
extractAndGenerateSQL().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
}); 