-- ===========================================================
-- lock in — full database schema (current state)
-- -----------------------------------------------------------
-- This mirrors supabase/migrations/0001_core_tables.sql and is the
-- canonical snapshot of the schema the app (src/lib/db.js) expects.
-- Idempotent: safe to run multiple times in the Supabase SQL editor.
--
-- Tables: sessions, goals, tasks, rooms, room_members, favorites
-- RLS   : enabled on every table
-- Policy: a user can only read/write rows where user_id = auth.uid()
--         (rooms are owned via created_by). room_members can be read
--         by any member of the same room.
-- ===========================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------
-- sessions
-- -----------------------------------------------------------
create table if not exists public.sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  duration_minutes  integer not null default 0,
  space_id          text,
  session_type      text not null default 'focus',
  created_at        timestamptz not null default now()
);

-- -----------------------------------------------------------
-- goals  (one row of preferences per user)
-- -----------------------------------------------------------
create table if not exists public.goals (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  daily_goal_minutes   integer not null default 120,
  weekly_goal_minutes  integer not null default 600,
  updated_at           timestamptz not null default now()
);
create unique index if not exists goals_user_id_key on public.goals (user_id);

-- -----------------------------------------------------------
-- tasks
-- -----------------------------------------------------------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------
-- rooms
-- -----------------------------------------------------------
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  is_active   boolean not null default true
);

-- -----------------------------------------------------------
-- room_members
-- -----------------------------------------------------------
create table if not exists public.room_members (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  joined_at     timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  unique (room_id, user_id)
);

-- -----------------------------------------------------------
-- favorites
-- -----------------------------------------------------------
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  space_id    text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, space_id)
);

-- ===========================================================
-- Indexes (lookups by owner)
-- ===========================================================
create index if not exists idx_sessions_user_id     on public.sessions (user_id);
create index if not exists idx_tasks_user_id         on public.tasks (user_id);
create index if not exists idx_rooms_created_by       on public.rooms (created_by);
create index if not exists idx_room_members_user_id   on public.room_members (user_id);
create index if not exists idx_room_members_room_id   on public.room_members (room_id);
create index if not exists idx_favorites_user_id      on public.favorites (user_id);

-- ===========================================================
-- Row Level Security
-- ===========================================================
alter table public.sessions     enable row level security;
alter table public.goals        enable row level security;
alter table public.tasks        enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_members enable row level security;
alter table public.favorites    enable row level security;

-- Helper: is the given user a member of the given room?
-- SECURITY DEFINER bypasses RLS so the room_members policy below
-- can reference room_members without recursing.
create or replace function public.is_room_member(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = p_user_id
  );
$$;

-- ---------- sessions ----------
drop policy if exists "sessions own rows" on public.sessions;
create policy "sessions own rows" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- goals ----------
drop policy if exists "goals own rows" on public.goals;
create policy "goals own rows" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- tasks ----------
drop policy if exists "tasks own rows" on public.tasks;
create policy "tasks own rows" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- favorites ----------
drop policy if exists "favorites own rows" on public.favorites;
create policy "favorites own rows" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- rooms ----------
-- Owner (created_by) can do anything; members may read rooms they belong to.
drop policy if exists "rooms select member or owner" on public.rooms;
create policy "rooms select member or owner" on public.rooms
  for select using (auth.uid() = created_by or public.is_room_member(id, auth.uid()));

drop policy if exists "rooms insert owner" on public.rooms;
create policy "rooms insert owner" on public.rooms
  for insert with check (auth.uid() = created_by);

drop policy if exists "rooms update owner" on public.rooms;
create policy "rooms update owner" on public.rooms
  for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "rooms delete owner" on public.rooms;
create policy "rooms delete owner" on public.rooms
  for delete using (auth.uid() = created_by);

-- ---------- room_members ----------
-- Read: any member of the room can see all of its members.
drop policy if exists "room_members read shared" on public.room_members;
create policy "room_members read shared" on public.room_members
  for select using (public.is_room_member(room_id, auth.uid()));

-- Write: a user may only add / update / remove their own membership row.
drop policy if exists "room_members insert self" on public.room_members;
create policy "room_members insert self" on public.room_members
  for insert with check (auth.uid() = user_id);

drop policy if exists "room_members update self" on public.room_members;
create policy "room_members update self" on public.room_members
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "room_members delete self" on public.room_members;
create policy "room_members delete self" on public.room_members
  for delete using (auth.uid() = user_id);
