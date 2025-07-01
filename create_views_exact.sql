-- SQL script to create tables from views with exact PostgreSQL types

-- View -> Table: view_order_list_content
DROP TABLE IF EXISTS "view_order_list_content";

CREATE TABLE IF NOT EXISTS "view_order_list_content" (
  "ref" uuid,
  "Grade" text,
  "packagesize" float8,
  "packagetype" text,
  "quantity" int8,
  "order_list_ref" uuid,
  "crop_id" text,
  "farm_id" text,
  "totalkg" float8,
  "created_time" timestamptz
);

-- View -> Table: farm_block_comp
DROP TABLE IF EXISTS "farm_block_comp";

CREATE TABLE IF NOT EXISTS "farm_block_comp" (
  "type" text,
  "Name" text,
  "standard_planning_ref" uuid,
  "plannedseason" int8,
  "drips" int8,
  "state" text,
  "time_start" timestamptz,
  "time_finish" timestamptz,
  "NetYieldPerDripkg" float8,
  "HarvestDurationday" int8,
  "PollinationLosspercent" int8,
  "SowingDurationday" int8,
  "seedsPerDrip" int8,
  "ProductsPerDripkg" float8,
  "Area" int8,
  "ref" uuid,
  "block_id" text,
  "Item" text,
  "isModified" boolean,
  "block_standard_ref" uuid,
  "InventoryData" jsonb,
  "input_data" jsonb,
  "PlanningFertilizer" jsonb
);

-- View -> Table: block_history_comp
DROP TABLE IF EXISTS "block_history_comp";

CREATE TABLE IF NOT EXISTS "block_history_comp" (
  "ref" uuid,
  "plannedseason" int8,
  "area" int8,
  "drips" int8,
  "farm_id" text,
  "block_id" text,
  "crop_id" text,
  "farm_type" text,
  "time_start" timestamptz,
  "time_finish" timestamptz,
  "state" text,
  "farm_block_ref" uuid,
  "kpi" float8,
  "harvest_data" float8,
  "predicted_yield" float8,
  "block_standard_ref" uuid,
  "HarvestDurationday" int8,
  "NetYieldPerDripkg" float8,
  "SowingDurationday" int8,
  "seedsPerDrip" int8,
  "yieldperseed" float8,
  "PlanningFertilizer" jsonb
);

-- View -> Table: harvest_reports_view
DROP TABLE IF EXISTS "harvest_reports_view";

CREATE TABLE IF NOT EXISTS "harvest_reports_view" (
  "ref" uuid,
  "block_id" text,
  "farm" text,
  "crop" text,
  "Quantity" float8,
  "harvestSeason" int8,
  "time" timestamptz,
  "farm_block_ref" uuid,
  "reporter_user" text
);

-- View -> Table: block_standard_list
DROP TABLE IF EXISTS "block_standard_list";

CREATE TABLE IF NOT EXISTS "block_standard_list" (
  "BlockID" text,
  "type" text,
  "Name" text
);

-- View -> Table: sp_listitem
DROP TABLE IF EXISTS "sp_listitem";

CREATE TABLE IF NOT EXISTS "sp_listitem" (
  "Item" text
);

-- View -> Table: block_change_pending
DROP TABLE IF EXISTS "block_change_pending";

CREATE TABLE IF NOT EXISTS "block_change_pending" (
  "reference" uuid,
  "block_id" text,
  "status" text
);

