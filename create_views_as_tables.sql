-- SQL script to create tables from views in destination database

-- Creating table to replace view: view_order_list_content
CREATE TABLE IF NOT EXISTS "view_order_list_content" (
  "ref" text,
  "Grade" text,
  "packagesize" integer,
  "packagetype" text,
  "quantity" integer,
  "order_list_ref" text,
  "crop_id" text,
  "farm_id" text,
  "totalkg" integer,
  "created_time" timestamp with time zone
);

-- Creating table to replace view: farm_block_comp
CREATE TABLE IF NOT EXISTS "farm_block_comp" (
  "type" text,
  "Name" text,
  "standard_planning_ref" text,
  "plannedseason" integer,
  "drips" integer,
  "state" text,
  "time_start" timestamp with time zone,
  "time_finish" timestamp with time zone,
  "NetYieldPerDripkg" integer,
  "HarvestDurationday" integer,
  "PollinationLosspercent" integer,
  "SowingDurationday" integer,
  "seedsPerDrip" integer,
  "ProductsPerDripkg" numeric,
  "Area" integer,
  "ref" text,
  "block_id" text,
  "Item" text,
  "isModified" boolean,
  "block_standard_ref" text,
  "InventoryData" jsonb,
  "input_data" text,
  "PlanningFertilizer" jsonb
);

-- Creating table to replace view: block_history_comp
CREATE TABLE IF NOT EXISTS "block_history_comp" (
  "ref" text,
  "plannedseason" integer,
  "area" integer,
  "drips" integer,
  "farm_id" text,
  "block_id" text,
  "crop_id" text,
  "farm_type" text,
  "time_start" timestamp with time zone,
  "time_finish" timestamp with time zone,
  "state" text,
  "farm_block_ref" text,
  "kpi" numeric,
  "harvest_data" integer,
  "predicted_yield" numeric,
  "block_standard_ref" text,
  "HarvestDurationday" integer,
  "NetYieldPerDripkg" numeric,
  "SowingDurationday" integer,
  "seedsPerDrip" integer,
  "yieldperseed" text,
  "PlanningFertilizer" jsonb
);

-- Creating table to replace view: harvest_reports_view
CREATE TABLE IF NOT EXISTS "harvest_reports_view" (
  "ref" text,
  "block_id" text,
  "farm" text,
  "crop" text,
  "Quantity" integer,
  "harvestSeason" integer,
  "time" timestamp with time zone,
  "farm_block_ref" text,
  "reporter_user" text
);

-- Creating table to replace view: block_standard_list
CREATE TABLE IF NOT EXISTS "block_standard_list" (
  "BlockID" text,
  "type" text,
  "Name" text
);

-- Creating table to replace view: sp_listitem
CREATE TABLE IF NOT EXISTS "sp_listitem" (
  "Item" text
);

