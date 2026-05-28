-- Run this SQL in your Supabase project's SQL Editor

-- User profiles table
create table if not exists public.user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  age integer not null,
  height_cm integer not null,
  weight_kg decimal(5,2) not null,
  goal text not null check (goal in ('maintain', 'cut', 'gain')),
  timeframe text not null check (timeframe in ('week', 'month', 'forever')),
  daily_calorie_goal integer not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Food entries table
create table if not exists public.food_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  food_name text not null,
  calories integer not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  notes text,
  image_url text,
  created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.user_profiles enable row level security;
alter table public.food_entries enable row level security;

-- Policies for user_profiles
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

-- Policies for food_entries
create policy "Users can view own entries"
  on public.food_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.food_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.food_entries for delete
  using (auth.uid() = user_id);
