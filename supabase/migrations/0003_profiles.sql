-- ===========================================================
-- lock in — profiles + realtime for rooms
-- -----------------------------------------------------------
-- Adds a public `profiles` table so the client can read other
-- users' display name/avatar (auth.users is not exposed to the
-- browser). Also enables Realtime on room_members so room
-- presence updates stream to subscribers.
--
-- Idempotent: safe to run multiple times.
-- ===========================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text,
  avatar_url  text,
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any signed-in user can read profiles (so room members see each
-- other's names); a user can only write their own profile row.
drop policy if exists "profiles read authenticated" on public.profiles;
create policy "profiles read authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- keep profiles in sync with auth.users ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that already exist.
insert into public.profiles (id, name, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name'),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

-- ---------- realtime ----------
-- Stream room_members changes to subscribeToRoom(). Guarded so a
-- re-run doesn't error if the table is already in the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'room_members'
  ) then
    alter publication supabase_realtime add table public.room_members;
  end if;
end $$;
