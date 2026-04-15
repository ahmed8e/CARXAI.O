-- carx.ai Supabase Database Schema
-- Run this in your Supabase SQL editor

-- Enable RLS
alter table if exists profiles enable row level security;

-- PROFILES
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  city text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now()
);
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- VEHICLES
create table if not exists vehicles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  make text not null,
  model text not null,
  year int not null,
  fuel_type text,
  plate_number text,
  vin text,
  created_at timestamptz default now()
);
alter table vehicles enable row level security;
create policy "Users can CRUD own vehicles" on vehicles using (auth.uid() = user_id);

-- AI CHATS
create table if not exists ai_chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  vehicle_id uuid references vehicles on delete set null,
  user_message text not null,
  ai_response text not null,
  issue_name text,
  likely_cause text,
  urgency_level text,
  created_at timestamptz default now()
);
alter table ai_chats enable row level security;
create policy "Users can CRUD own chats" on ai_chats using (auth.uid() = user_id);

-- AI CHAT ATTACHMENTS
create table if not exists ai_chat_attachments (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references ai_chats on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  file_url text not null,
  file_type text not null,
  created_at timestamptz default now()
);
alter table ai_chat_attachments enable row level security;
create policy "Users can CRUD own attachments" on ai_chat_attachments using (auth.uid() = user_id);

-- MECHANIC SEARCHES
create table if not exists mechanic_searches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  vehicle_id uuid references vehicles on delete set null,
  location_text text,
  selected_mechanic_name text,
  selected_mechanic_place_id text,
  created_at timestamptz default now()
);
alter table mechanic_searches enable row level security;
create policy "Users can CRUD own searches" on mechanic_searches using (auth.uid() = user_id);

-- TOWING REQUESTS
create table if not exists towing_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  vehicle_id uuid references vehicles on delete set null,
  location_text text,
  provider_name text,
  provider_place_id text,
  status text default 'requested',
  created_at timestamptz default now()
);
alter table towing_requests enable row level security;
create policy "Users can CRUD own towing requests" on towing_requests using (auth.uid() = user_id);

-- SAVED PLACES
create table if not exists saved_places (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  place_type text not null,
  place_name text not null,
  place_id text,
  address text,
  phone text,
  created_at timestamptz default now()
);
alter table saved_places enable row level security;
create policy "Users can CRUD own saved places" on saved_places using (auth.uid() = user_id);

-- USER SETTINGS
create table if not exists user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade unique not null,
  preferred_language text default 'en',
  notifications_enabled boolean default true,
  created_at timestamptz default now()
);
alter table user_settings enable row level security;
create policy "Users can CRUD own settings" on user_settings using (auth.uid() = user_id);

-- Storage bucket for car photos
insert into storage.buckets (id, name, public) values ('car-photos', 'car-photos', true) on conflict do nothing;
create policy "Users can upload own photos" on storage.objects for insert with check (auth.uid()::text = (storage.foldername(name))[1]);
create policy "Car photos are public" on storage.objects for select using (bucket_id = 'car-photos');
