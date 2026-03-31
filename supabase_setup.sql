-- carx.ai Consolidated Supabase Database Schema
-- Run this in your Supabase SQL editor to set up the entire database.

-- 1. PROFILES (Extends Auth.Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  subscription_tier text default 'Basic',
  reports_used int default 0,
  phone_number text,
  preferred_language text default 'en',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. VEHICLES
create table if not exists public.vehicles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    make text not null,
    model text not null,
    year integer not null,
    fuel_type text,
    engine_type text,
    gearbox text,
    mileage integer,
    plate_number text,
    vin text,
    is_default boolean default false,
    created_at timestamp with time zone default now()
);
alter table public.vehicles enable row level security;
create policy "Users can view their own vehicles" on public.vehicles for select using (auth.uid() = user_id);
create policy "Users can insert their own vehicles" on public.vehicles for insert with check (auth.uid() = user_id);
create policy "Users can update their own vehicles" on public.vehicles for update using (auth.uid() = user_id);
create policy "Users can delete their own vehicles" on public.vehicles for delete using (auth.uid() = user_id);
create index if not exists vehicles_user_id_idx on public.vehicles(user_id);

-- 3. AI CHATS
create table if not exists public.ai_chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  vehicle_id uuid references public.vehicles on delete set null,
  user_message text not null,
  ai_response text not null,
  issue_name text,
  likely_cause text,
  urgency_level text,
  created_at timestamptz default now()
);
alter table public.ai_chats enable row level security;
create policy "Users can CRUD own chats" on public.ai_chats using (auth.uid() = user_id);

-- 4. STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('car-photos', 'car-photos', true) on conflict (id) do nothing;

-- 5. STORAGE POLICIES
create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' );
create policy "Anyone can update their own avatar." on storage.objects for update using ( bucket_id = 'avatars' AND auth.uid()::text = owner::text );

create policy "Car photos are public" on storage.objects for select using (bucket_id = 'car-photos');
create policy "Users can upload own car photos" on storage.objects for insert with check (bucket_id = 'car-photos');
