// Generate accurate SQL for views based on screenshots
const fs = require('fs');

// View definitions based on screenshots
const viewDefinitions = {
  'view_order_list_content': {
    columns: [
      { name: 'ref', type: 'uuid' },
      { name: 'Grade', type: 'text' },
      { name: 'packagesize', type: 'float4' },
      { name: 'packagetype', type: 'text' },
      { name: 'quantity', type: 'int4' },
      { name: 'order_list_ref', type: 'uuid' },
      { name: 'crop_id', type: 'text' },
      { name: 'farm_id', type: 'text' },
      { name: 'totalkg', type: 'float4' },
      { name: 'created_time', type: 'timestamptz' }
    ]
  },
  // We'll add more views as you provide screenshots
  'farm_block_comp': {
    columns: [
      { name: 'type', type: 'text' },
      { name: 'Name', type: 'text' },
      { name: 'standard_planning_ref', type: 'uuid' },
      { name: 'plannedseason', type: 'int4' },
      { name: 'drips', type: 'int4' },
      { name: 'state', type: 'text' },
      { name: 'time_start', type: 'timestamptz' },
      { name: 'time_finish', type: 'timestamptz' },
      { name: 'NetYieldPerDripkg', type: 'float4' },
      { name: 'HarvestDurationday', type: 'int4' },
      { name: 'PollinationLosspercent', type: 'int4' },
      { name: 'SowingDurationday', type: 'int4' },
      { name: 'seedsPerDrip', type: 'int4' },
      { name: 'ProductsPerDripkg', type: 'float4' },
      { name: 'Area', type: 'int4' },
      { name: 'ref', type: 'uuid' },
      { name: 'block_id', type: 'text' },
      { name: 'Item', type: 'text' },
      { name: 'isModified', type: 'bool' },
      { name: 'block_standard_ref', type: 'uuid' },
      { name: 'InventoryData', type: 'json' },
      { name: 'input_data', type: 'json' },
      { name: 'PlanningFertilizer', type: 'json' }
    ]
  },
  // Default structures for other views (can be updated later)
  'block_history_comp': {
    columns: [
      { name: 'ref', type: 'uuid' },
      { name: 'plannedseason', type: 'int4' },
      { name: 'area', type: 'int4' },
      { name: 'drips', type: 'int4' },
      { name: 'farm_id', type: 'text' },
      { name: 'block_id', type: 'text' },
      { name: 'crop_id', type: 'text' },
      { name: 'farm_type', type: 'text' },
      { name: 'time_start', type: 'timestamptz' },
      { name: 'time_finish', type: 'timestamptz' },
      { name: 'state', type: 'text' },
      { name: 'farm_block_ref', type: 'uuid' },
      { name: 'kpi', type: 'float4' },
      { name: 'harvest_data', type: 'float4' },
      { name: 'predicted_yield', type: 'float4' },
      { name: 'block_standard_ref', type: 'uuid' },
      { name: 'HarvestDurationday', type: 'int4' },
      { name: 'NetYieldPerDripkg', type: 'float4' },
      { name: 'SowingDurationday', type: 'int4' },
      { name: 'seedsPerDrip', type: 'int4' },
      { name: 'yieldperseed', type: 'float4' },
      { name: 'PlanningFertilizer', type: 'json' }
    ]
  },
  'harvest_reports_view': {
    columns: [
      { name: 'ref', type: 'uuid' },
      { name: 'block_id', type: 'text' },
      { name: 'farm', type: 'text' },
      { name: 'crop', type: 'text' },
      { name: 'Quantity', type: 'float4' },
      { name: 'harvestSeason', type: 'int4' },
      { name: 'time', type: 'timestamptz' },
      { name: 'farm_block_ref', type: 'uuid' },
      { name: 'reporter_user', type: 'text' }
    ]
  },
  'block_standard_list': {
    columns: [
      { name: 'BlockID', type: 'text' },
      { name: 'type', type: 'text' },
      { name: 'Name', type: 'text' }
    ]
  },
  'sp_listitem': {
    columns: [
      { name: 'Item', type: 'text' }
    ]
  },
  'block_change_pending': {
    columns: [
      { name: 'reference', type: 'uuid' },
      { name: 'block_id', type: 'text' },
      { name: 'status', type: 'text' }
    ]
  }
};

/**
 * Generate SQL for creating a view as a table with accurate types
 */
function generateAccurateViewSQL(viewName) {
  const viewDef = viewDefinitions[viewName];
  
  if (!viewDef || !viewDef.columns || viewDef.columns.length === 0) {
    return `-- No accurate definition available for view: ${viewName}\n` +
           `-- Please update this manually\n` +
           `CREATE TABLE IF NOT EXISTS "${viewName}" (\n` +
           `  -- Add columns here\n` +
           `);\n`;
  }
  
  let sql = `-- Creating table to replace view: ${viewName}\n`;
  sql += `CREATE TABLE IF NOT EXISTS "${viewName}" (\n`;
  
  const columnDefs = viewDef.columns.map(col => {
    return `  "${col.name}" ${col.type}`;
  });
  
  sql += columnDefs.join(',\n');
  sql += '\n);\n';
  
  return sql;
}

/**
 * Generate SQL scripts for all views
 */
function generateViewSQLScripts() {
  console.log('Generating accurate SQL scripts for views...');
  
  // Views to create as tables
  let viewsSQL = '-- SQL script to create tables from views with accurate types\n\n';
  
  for (const viewName in viewDefinitions) {
    const sql = generateAccurateViewSQL(viewName);
    viewsSQL += `${sql}\n`;
  }
  
  fs.writeFileSync('create_views_accurate.sql', viewsSQL);
  console.log('SQL script for creating views as tables with accurate types saved to create_views_accurate.sql');
}

// Run the script
try {
  generateViewSQLScripts();
  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} 