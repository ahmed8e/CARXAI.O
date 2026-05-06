-- =====================================================================
-- Car Safety — Maintenance System Migration
-- Run this in your Supabase SQL editor to enable full DB persistence
-- Current implementation uses localStorage; this enables cloud sync
-- =====================================================================

-- MAINTENANCE RECORDS (service history)
create table if not exists maintenance_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  vehicle_id uuid references vehicles on delete cascade,
  service_type text not null,
  date date not null,
  mileage integer not null default 0,
  cost numeric(10, 2) default 0,
  shop_name text,
  notes text,
  parts_replaced text,
  warranty_notes text,
  receipt_url text,
  created_at timestamptz default now()
);
alter table maintenance_records enable row level security;
create policy "Users can CRUD own maintenance records"
  on maintenance_records using (auth.uid() = user_id);

-- MAINTENANCE PREFERENCES (per vehicle)
create table if not exists maintenance_prefs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  vehicle_id uuid references vehicles on delete cascade not null,
  avg_miles_per_month integer default 1000,
  driving_style text default 'mixed',        -- city | highway | mixed
  usage_level text default 'normal',          -- light | normal | heavy
  region text default 'temperate',            -- hot | cold | temperate
  updated_at timestamptz default now(),
  unique(user_id, vehicle_id)
);
alter table maintenance_prefs enable row level security;
create policy "Users can CRUD own maintenance prefs"
  on maintenance_prefs using (auth.uid() = user_id);

-- MAINTENANCE SCHEDULE (last service per item per vehicle)
create table if not exists maintenance_schedule (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  vehicle_id uuid references vehicles on delete cascade not null,
  service_id text not null,                   -- e.g. 'oil_change', 'tire_rotation'
  last_service_mileage integer default 0,
  last_service_date date,
  updated_at timestamptz default now(),
  unique(user_id, vehicle_id, service_id)
);
alter table maintenance_schedule enable row level security;
create policy "Users can CRUD own maintenance schedule"
  on maintenance_schedule using (auth.uid() = user_id);

-- SEASONAL CHECKLIST STATE (per vehicle)
create table if not exists seasonal_checklists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  vehicle_id uuid references vehicles on delete cascade not null,
  checklist_id text not null,                 -- summer | winter | roadtrip
  items_json jsonb not null default '[]',     -- array of ChecklistItem
  updated_at timestamptz default now(),
  unique(user_id, vehicle_id, checklist_id)
);
alter table seasonal_checklists enable row level security;
create policy "Users can CRUD own seasonal checklists"
  on seasonal_checklists using (auth.uid() = user_id);

-- REPAIR DECISIONS (saved advisor results)
create table if not exists repair_decisions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  vehicle_id uuid references vehicles on delete set null,
  repair_type text,
  repair_cost numeric(10, 2),
  car_value numeric(10, 2),
  mileage integer,
  verdict text,                               -- worth_fixing | second_opinion | not_worth | consider_selling
  reasons jsonb,
  created_at timestamptz default now()
);
alter table repair_decisions enable row level security;
create policy "Users can CRUD own repair decisions"
  on repair_decisions using (auth.uid() = user_id);

-- =====================================================================
-- HOW TO CONNECT THESE TO THE FRONTEND
-- (Currently the app uses localStorage for all maintenance data)
-- 
-- Replace localStorage calls in Maintenance.tsx with Supabase calls:
--
-- READ maintenance records:
--   supabase.from('maintenance_records').select('*')
--     .eq('user_id', user.id).eq('vehicle_id', vehicleId)
--
-- INSERT a record:
--   supabase.from('maintenance_records').insert({ user_id, vehicle_id, ... })
--
-- READ/UPSERT schedule:
--   supabase.from('maintenance_schedule').upsert({
--     user_id, vehicle_id, service_id, last_service_mileage, last_service_date
--   }, { onConflict: 'user_id,vehicle_id,service_id' })
--
-- READ/UPSERT prefs:
--   supabase.from('maintenance_prefs').upsert({
--     user_id, vehicle_id, avg_miles_per_month, driving_style, usage_level, region
--   }, { onConflict: 'user_id,vehicle_id' })
-- =====================================================================
