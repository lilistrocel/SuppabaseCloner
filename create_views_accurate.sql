-- SQL script to create tables from views with accurate types

-- Creating table to replace view: view_order_list_content
CREATE TABLE IF NOT EXISTS "view_order_list_content" (
  "ref" uuid,
  "Grade" text,
  "packagesize" float4,
  "packagetype" text,
  "quantity" int4,
  "order_list_ref" uuid,
  "crop_id" text,
  "farm_id" text,
  "totalkg" float4,
  "created_time" timestamptz
);

-- Creating table to replace view: farm_block_comp
CREATE TABLE IF NOT EXISTS "farm_block_comp" (
  "type" text,
  "Name" text,
  "standard_planning_ref" uuid,
  "plannedseason" int4,
  "drips" int4,
  "state" text,
  "time_start" timestamptz,
  "time_finish" timestamptz,
  "NetYieldPerDripkg" float4,
  "HarvestDurationday" int4,
  "PollinationLosspercent" int4,
  "SowingDurationday" int4,
  "seedsPerDrip" int4,
  "ProductsPerDripkg" float4,
  "Area" int4,
  "ref" uuid,
  "block_id" text,
  "Item" text,
  "isModified" bool,
  "block_standard_ref" uuid,
  "InventoryData" json,
  "input_data" json,
  "PlanningFertilizer" json
);

-- Creating table to replace view: block_history_comp
CREATE TABLE IF NOT EXISTS "block_history_comp" (
  "ref" uuid,
  "plannedseason" int4,
  "area" int4,
  "drips" int4,
  "farm_id" text,
  "block_id" text,
  "crop_id" text,
  "farm_type" text,
  "time_start" timestamptz,
  "time_finish" timestamptz,
  "state" text,
  "farm_block_ref" uuid,
  "kpi" float4,
  "harvest_data" float4,
  "predicted_yield" float4,
  "block_standard_ref" uuid,
  "HarvestDurationday" int4,
  "NetYieldPerDripkg" float4,
  "SowingDurationday" int4,
  "seedsPerDrip" int4,
  "yieldperseed" float4,
  "PlanningFertilizer" json
);

-- Creating table to replace view: harvest_reports_view
CREATE TABLE IF NOT EXISTS "harvest_reports_view" (
  "ref" uuid,
  "block_id" text,
  "farm" text,
  "crop" text,
  "Quantity" float4,
  "harvestSeason" int4,
  "time" timestamptz,
  "farm_block_ref" uuid,
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

-- Creating table to replace view: block_change_pending
CREATE TABLE IF NOT EXISTS "block_change_pending" (
  "reference" uuid,
  "block_id" text,
  "status" text
);

