-- Create users table for video system
-- This stores user data with roles (admin can create users, normal users cannot)

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies
-- Users can read their own data
create policy "users_select_own" on public.users 
  for select using (auth.uid() = id);

-- Only allow insert through trigger (security definer)
create policy "users_insert_own" on public.users 
  for insert with check (auth.uid() = id);

-- Users can update their own data (but not role)
create policy "users_update_own" on public.users 
  for update using (auth.uid() = id);

-- Admin can read all users
create policy "admin_select_all" on public.users 
  for select using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Trigger to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
