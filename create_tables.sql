-- SQL script to create missing tables in destination database

-- Table: block_data_change
CREATE TABLE "block_data_change" (
  "__id__" text,
  "areaafter" integer,
  "areabefore" integer,
  "changedate" timestamp with time zone,
  "dripafter" integer,
  "dripbefore" integer,
  "plantdateafter" timestamp with time zone,
  "plantdatebefore" timestamp with time zone,
  "season" integer,
  "stateafter" text,
  "statebefore" text,
  "status" text,
  "ref" text,
  "block_before_ref" text,
  "block_after_ref" text,
  "crop_before_ref" text,
  "crop_after_ref" text,
  "farm_block_ref" text,
  "type_before_ref" text,
  "type_after_ref" text,
  "users_ref" text
);

-- Table: block_data_changeRe
CREATE TABLE "block_data_changeRe" (
  "areaafter" integer,
  "areabefore" integer,
  "changedate" timestamp with time zone,
  "dripafter" integer,
  "dripbefore" integer,
  "plantdateafter" timestamp with time zone,
  "plantdatebefore" timestamp with time zone,
  "season" integer,
  "stateafter" text,
  "statebefore" text,
  "status" text,
  "ref" text,
  "farm_block_ref" text,
  "user_email" text,
  "type_before" text,
  "type_after" text,
  "crop_before" text,
  "crop_after" text,
  "block_id" text,
  "season_after" integer
);

-- Table: block_history
CREATE TABLE "block_history" (
  "area" integer,
  "drips" integer,
  "plannedseason" integer,
  "time_finish" timestamp with time zone,
  "time_start" timestamp with time zone,
  "ref" text,
  "block_id" text,
  "farm_id" text,
  "crop_id" text,
  "time_cleaned" timestamp with time zone,
  "harvest_duration" integer,
  "farm_block_ref" text,
  "state" text,
  "farm_type" text,
  "predicted_yield" integer,
  "harvest_data" integer,
  "kpi" integer,
  "net_yield" float,
  "block_standard_ref" text,
  "yieldperseed" integer
);

-- Table: block_standard
CREATE TABLE "block_standard" (
  "__id__" text,
  "Area" integer,
  "BlockID" text,
  "TotalDrips" integer,
  "ref" text,
  "farm_details_ref" text,
  "farm_types_ref" text,
  "farm" text,
  "type" text
);

-- Table: client_details
CREATE TABLE "client_details" (
  "__id__" text,
  "clientname" text,
  "ref" text
);

-- Table: farm_block
CREATE TABLE "farm_block" (
  "__id__" text,
  "InventoryData" jsonb,
  "drips" integer,
  "plannedseason" integer,
  "state" text,
  "time_finish" timestamp with time zone,
  "time_start" timestamp with time zone,
  "ref" text,
  "farm_details_ref" text,
  "block_standard_ref" text,
  "standard_planning_ref" text,
  "block_id" text,
  "farm_name" text,
  "Item" text,
  "isModified" boolean,
  "input_data" text,
  "year_count" text
);

-- Table: farm_details
CREATE TABLE "farm_details" (
  "Name" text,
  "ref" text
);

-- Table: farm_types
CREATE TABLE "farm_types" (
  "__id__" text,
  "type" text,
  "ref" text
);

-- Table: harvest_reports
CREATE TABLE "harvest_reports" (
  "__id__" text,
  "Quantity" integer,
  "harvestSeason" integer,
  "time" timestamp with time zone,
  "ref" text,
  "farm_block_ref" text,
  "block_id" text,
  "crop" text,
  "farm" text,
  "reporter_user" text
);

-- Table: input_data
CREATE TABLE "input_data" (
  "ref" text,
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
CREATE TABLE "input_data2" (
  "ref" text,
  "chemname" text,
  "unit" text
);

-- Table: inventory_planning
CREATE TABLE "inventory_planning" (
  "__id__" text,
  "Item" text,
  "Note" text,
  "Quantity" float,
  "Unit" text,
  "Year" integer,
  "ref" text,
  "farm_details_ref" text,
  "farm" text
);

-- Table: inventory_stock
CREATE TABLE "inventory_stock" (
  "id" text PRIMARY KEY,
  "farm" text,
  "crop" text,
  "stock" integer,
  "last_updated" text,
  "total_harvest" text,
  "totaldelivery" text,
  "harvest_debt" integer
);

-- Table: logs
CREATE TABLE "logs" (
  "__id__" text,
  "action" text,
  "time" timestamp with time zone,
  "ref" text,
  "user_email" text
);

-- Table: order_list_content
CREATE TABLE "order_list_content" (
  "Grade" text,
  "packagesize" integer,
  "packagetype" text,
  "quantity" integer,
  "created_time" timestamp with time zone,
  "updated_time" timestamp with time zone,
  "order_list_ref" text,
  "crop_id" text,
  "ref" text,
  "farm_id" text,
  "totalkg" integer,
  "client_id" text
);

-- Table: orderlist_re
CREATE TABLE "orderlist_re" (
  "__id__" text,
  "DateFinished" text,
  "DatePacked" timestamp with time zone,
  "RNumber" text,
  "Reciever" text,
  "Signature" text,
  "StartDate" timestamp with time zone,
  "assigned.__ref__" text,
  "note" text,
  "orderDriver" text,
  "status" text,
  "vehicle_id" text,
  "client_id" text,
  "farm_id" text,
  "packager_email" text,
  "ref" text
);

-- Table: standard_planning
CREATE TABLE "standard_planning" (
  "__id__" text,
  "Cleaningday" text,
  "DaysOfFertilize" integer,
  "HarvestDurationday" integer,
  "Item" text,
  "NetYieldPerDripkg" float,
  "PlanningFertilizer" jsonb,
  "PollinationLosspercent" integer,
  "ProcessedFertilizerData" text,
  "ProductsPerDripkg" integer,
  "SeedingType" text,
  "SowingDurationday" integer,
  "TotalDurationday" integer,
  "harvestInterval" integer,
  "img" text,
  "seedsPerDrip" integer,
  "ref" text
);

-- Table: users
CREATE TABLE "users" (
  "__id__" text,
  "created_time" timestamp with time zone,
  "display_name" text,
  "email" text,
  "is_jedi" boolean,
  "is_viewer" boolean,
  "permissions" text,
  "uid" text,
  "ref" text
);

-- Table: vehicle_details
CREATE TABLE "vehicle_details" (
  "__id__" text,
  "vehiclename" timestamp with time zone,
  "ref" text
);

-- View -> Table: view_order_list_content
CREATE TABLE "view_order_list_content" (
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

-- View -> Table: farm_block_comp
CREATE TABLE "farm_block_comp" (
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
  "ProductsPerDripkg" float,
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

-- View -> Table: block_history_comp
CREATE TABLE "block_history_comp" (
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
  "kpi" float,
  "harvest_data" integer,
  "predicted_yield" float,
  "block_standard_ref" text,
  "HarvestDurationday" integer,
  "NetYieldPerDripkg" float,
  "SowingDurationday" integer,
  "seedsPerDrip" integer,
  "yieldperseed" text,
  "PlanningFertilizer" jsonb
);

-- View -> Table: harvest_reports_view
CREATE TABLE "harvest_reports_view" (
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

-- View -> Table: block_standard_list
CREATE TABLE "block_standard_list" (
  "BlockID" text,
  "type" text,
  "Name" text
);

-- View -> Table: sp_listitem
CREATE TABLE "sp_listitem" (
  "Item" text
);

