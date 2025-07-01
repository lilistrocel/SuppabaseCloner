// Script to generate SQL to fix the block_data_changeRe table schema
const fs = require('fs');

// Create SQL to alter table columns to match the exact PostgreSQL types
const generateFixTableSQL = () => {
  const sql = `-- SQL to fix the block_data_changeRe table schema based on screenshot
DROP TABLE IF EXISTS "block_data_changeRe";

CREATE TABLE IF NOT EXISTS "block_data_changeRe" (
  "areaafter" int8 NOT NULL,
  "areabefore" int8 NOT NULL,
  "changedate" timestamptz NOT NULL,
  "dripafter" int8 NOT NULL,
  "dripbefore" int8 NOT NULL,
  "plantdateafter" timestamptz NOT NULL,
  "plantdatebefore" timestamptz NOT NULL,
  "season" int8 NOT NULL,
  "stateafter" text NOT NULL,
  "statebefore" text NOT NULL,
  "status" text NOT NULL,
  "ref" uuid NOT NULL,
  "farm_block_ref" text NOT NULL, 
  "user_email" text NOT NULL,
  "type_before" text NOT NULL,
  "type_after" text NOT NULL,
  "crop_before" text NOT NULL,
  "crop_after" text NOT NULL,
  "block_id" text NOT NULL,
  "season_after" int8 NOT NULL
);

-- For other tables, you should add similar DROP and CREATE statements
-- based on the actual PostgreSQL types from the screenshots
`;

  fs.writeFileSync('fix_block_data_changeRe.sql', sql);
  console.log('SQL to fix block_data_changeRe schema saved to fix_block_data_changeRe.sql');
}

// Execute the function
generateFixTableSQL(); 