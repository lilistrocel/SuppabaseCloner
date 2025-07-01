-- SQL script to create tables with exact PostgreSQL types

-- Table: block_data_change
DROP TABLE IF EXISTS "block_data_change";

CREATE TABLE IF NOT EXISTS "block_data_change" (
  "__id__" text,
  "areaafter" int8,
  "areabefore" int8,
  "changedate" timestamptz,
  "dripafter" int8,
  "dripbefore" int8,
  "plantdateafter" timestamptz,
  "plantdatebefore" timestamptz,
  "season" int8,
  "stateafter" text,
  "statebefore" text,
  "status" text,
  "ref" uuid,
  "block_before_ref" uuid,
  "block_after_ref" uuid,
  "crop_before_ref" uuid,
  "crop_after_ref" uuid,
  "farm_block_ref" uuid,
  "type_before_ref" uuid,
  "type_after_ref" uuid,
  "users_ref" uuid
);

-- Table: block_data_changeRe
DROP TABLE IF EXISTS "block_data_changeRe";

CREATE TABLE IF NOT EXISTS "block_data_changeRe" (
  "areaafter" int8,
  "areabefore" int8,
  "changedate" timestamptz,
  "dripafter" int8,
  "dripbefore" int8,
  "plantdateafter" timestamptz,
  "plantdatebefore" timestamptz,
  "season" int8,
  "stateafter" text,
  "statebefore" text,
  "status" text,
  "ref" uuid,
  "farm_block_ref" uuid,
  "user_email" text,
  "type_before" text,
  "type_after" text,
  "crop_before" text,
  "crop_after" text,
  "block_id" text,
  "season_after" int8
);

-- Table: block_history
DROP TABLE IF EXISTS "block_history";

CREATE TABLE IF NOT EXISTS "block_history" (
  "area" int8,
  "drips" int8,
  "plannedseason" int8,
  "time_finish" timestamptz,
  "time_start" timestamptz,
  "ref" uuid,
  "block_id" text,
  "farm_id" text,
  "crop_id" text,
  "time_cleaned" timestamptz,
  "harvest_duration" int8,
  "farm_block_ref" uuid,
  "state" text,
  "farm_type" text,
  "predicted_yield" float8,
  "harvest_data" float8,
  "kpi" float8,
  "net_yield" float8,
  "block_standard_ref" uuid,
  "yieldperseed" float8
);

-- Table: block_standard
DROP TABLE IF EXISTS "block_standard";

CREATE TABLE IF NOT EXISTS "block_standard" (
  "__id__" text,
  "Area" int8,
  "BlockID" text,
  "TotalDrips" int8,
  "ref" uuid,
  "farm_details_ref" uuid,
  "farm_types_ref" uuid,
  "farm" text,
  "type" text
);

-- Table: client_details
DROP TABLE IF EXISTS "client_details";

CREATE TABLE IF NOT EXISTS "client_details" (
  "__id__" text,
  "clientname" text,
  "ref" uuid
);

-- Table: employee_list
-- No schema information available for employee_list

-- Table: farm_block
DROP TABLE IF EXISTS "farm_block";

CREATE TABLE IF NOT EXISTS "farm_block" (
  "__id__" text,
  "InventoryData" jsonb,
  "drips" int8,
  "plannedseason" int8,
  "state" text,
  "time_finish" timestamptz,
  "time_start" timestamptz,
  "ref" uuid,
  "farm_details_ref" uuid,
  "block_standard_ref" uuid,
  "standard_planning_ref" uuid,
  "block_id" text,
  "farm_name" text,
  "Item" text,
  "isModified" boolean,
  "input_data" text,
  "year_count" text
);

-- Table: farm_details
DROP TABLE IF EXISTS "farm_details";

CREATE TABLE IF NOT EXISTS "farm_details" (
  "Name" text,
  "ref" uuid
);

-- Table: farm_types
DROP TABLE IF EXISTS "farm_types";

CREATE TABLE IF NOT EXISTS "farm_types" (
  "__id__" text,
  "type" text,
  "ref" uuid
);

-- Table: harvest_reports
DROP TABLE IF EXISTS "harvest_reports";

CREATE TABLE IF NOT EXISTS "harvest_reports" (
  "__id__" text,
  "Quantity" float8,
  "harvestSeason" int8,
  "time" timestamptz,
  "ref" uuid,
  "farm_block_ref" uuid,
  "block_id" text,
  "crop" text,
  "farm" text,
  "reporter_user" text
);

-- Table: input_data
DROP TABLE IF EXISTS "input_data";

CREATE TABLE IF NOT EXISTS "input_data" (
  "ref" uuid,
  "crop" text,
  "0.0.60" text,
  "Ferro" text,
  "28.14.14" jsonb,
  "Urea" jsonb,
  "20.20.20" jsonb,
  "Tarvit" text,
  "Amcoton" text,
  "MKP" text,
  "Calmin Bor" jsonb,
  "MG+Zn" text,
  "Potassium Nitrate" text,
  "12.61.0" jsonb,
  "Mg Sulfate" jsonb,
  "7 Rocks" jsonb,
  "Humic" text,
  "Phosphoric Acid" jsonb,
  "Potassium Sulfate" jsonb,
  "Chelated Micro" jsonb,
  "Cal Nitrate" jsonb,
  "MAP" text,
  "Amino Acids" text
);

-- Table: input_data2
DROP TABLE IF EXISTS "input_data2";

CREATE TABLE IF NOT EXISTS "input_data2" (
  "ref" uuid,
  "chemname" text,
  "unit" text
);

-- Table: inventory_planning
DROP TABLE IF EXISTS "inventory_planning";

CREATE TABLE IF NOT EXISTS "inventory_planning" (
  "__id__" text,
  "Item" text,
  "Note" text,
  "Quantity" float8,
  "Unit" text,
  "Year" int8,
  "ref" uuid,
  "farm_details_ref" uuid,
  "farm" text
);

-- Table: inventory_stock
DROP TABLE IF EXISTS "inventory_stock";

CREATE TABLE IF NOT EXISTS "inventory_stock" (
  "id" uuid,
  "farm" text,
  "crop" text,
  "stock" float8,
  "last_updated" text,
  "total_harvest" text,
  "totaldelivery" text,
  "harvest_debt" float8
);

-- Table: logs
DROP TABLE IF EXISTS "logs";

CREATE TABLE IF NOT EXISTS "logs" (
  "__id__" text,
  "action" text,
  "time" timestamptz,
  "ref" uuid,
  "user_email" text
);

-- Table: order_list_content
DROP TABLE IF EXISTS "order_list_content";

CREATE TABLE IF NOT EXISTS "order_list_content" (
  "Grade" text,
  "packagesize" float8,
  "packagetype" text,
  "quantity" int8,
  "created_time" timestamptz,
  "updated_time" timestamptz,
  "order_list_ref" uuid,
  "crop_id" text,
  "ref" uuid,
  "farm_id" text,
  "totalkg" float8,
  "client_id" text
);

-- Table: orderlist_re
DROP TABLE IF EXISTS "orderlist_re";

CREATE TABLE IF NOT EXISTS "orderlist_re" (
  "__id__" text,
  "DateFinished" text,
  "DatePacked" timestamptz,
  "RNumber" text,
  "Reciever" text,
  "Signature" text,
  "StartDate" timestamptz,
  "assigned.__ref__" text,
  "note" text,
  "orderDriver" text,
  "status" text,
  "vehicle_id" text,
  "client_id" text,
  "farm_id" text,
  "packager_email" text,
  "ref" uuid
);

-- Table: season_planning
-- No schema information available for season_planning

-- Table: standard_planning
DROP TABLE IF EXISTS "standard_planning";

CREATE TABLE IF NOT EXISTS "standard_planning" (
  "__id__" text,
  "Cleaningday" int8,
  "DaysOfFertilize" int8,
  "HarvestDurationday" int8,
  "Item" text,
  "NetYieldPerDripkg" float8,
  "PlanningFertilizer" jsonb,
  "PollinationLosspercent" int8,
  "ProcessedFertilizerData" text,
  "ProductsPerDripkg" float8,
  "SeedingType" text,
  "SowingDurationday" int8,
  "TotalDurationday" int8,
  "harvestInterval" int8,
  "img" text,
  "seedsPerDrip" int8,
  "ref" uuid
);

-- Table: users
DROP TABLE IF EXISTS "users";

CREATE TABLE IF NOT EXISTS "users" (
  "__id__" text,
  "created_time" timestamptz,
  "display_name" text,
  "email" text,
  "is_jedi" boolean,
  "is_viewer" boolean,
  "permissions" text,
  "uid" text,
  "ref" uuid
);

-- Table: vehicle_details
DROP TABLE IF EXISTS "vehicle_details";

CREATE TABLE IF NOT EXISTS "vehicle_details" (
  "__id__" text,
  "vehiclename" text,
  "ref" uuid
);

