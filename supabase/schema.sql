-- Run this in Supabase → SQL Editor

-- Profiles table (stores full user profile as JSON)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can manage their own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
