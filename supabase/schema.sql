-- ===========================================================
-- lock in — Supabase database schema
-- -----------------------------------------------------------
-- Run this in the Supabase SQL editor (or via the CLI) to set
-- up the full backend: tables, foreign keys, row level
-- security policies, and indexes.
--
-- Notes
--   * `public.users` mirrors `auth.users` (Supabase Auth owns
--     authentication). The `id` is the same uuid as the auth
--     user, so all other tables reference `public.users(id)`.
--   * RLS is enabled on every table; by default a user can only
--     read and write their own rows. Rooms and room membership
--     have slightly broader read rules so collaborators can see
--     shared rooms.
-- ===========================================================

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------
-- users
-- -----------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text unique not null,
  name        text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------
-- sessions  (a completed focus / break session)
-- -----------------------------------------------------------
create table if not exists public.sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,
  duration_minutes integer not null check (duration_minutes >= 0),
  space_id         text,
  completed_at     timestamptz not null default now(),
  session_type     text not null default 'focus'
                     check (session_type in ('focus', 'shortBreak', 'longBreak'))
);

-- -----------------------------------------------------------
-- tasks
-- -----------------------------------------------------------
create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  text          text not null,
  completed     boolean not null default false,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

-- -----------------------------------------------------------
-- goals  (one row of preferences per user)
-- -----------------------------------------------------------
create table if not exists public.goals (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references public.users (id) on delete cascade,
  daily_goal_minutes    integer not null default 120 check (daily_goal_minutes >= 0),
  weekly_goal_minutes   integer not null default 600 check (weekly_goal_minutes >= 0),
  focus_duration        integer not null default 25  check (focus_duration > 0),
  short_break_duration  integer not null default 5   check (short_break_duration > 0),
  long_break_duration   integer not null default 15  check (long_break_duration > 0)
);

-- -----------------------------------------------------------
-- rooms  (shared study rooms)
-- -----------------------------------------------------------
create table if not exists public.rooms (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  host_user_id  uuid not null references public.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  is_active     boolean not null default true
);

-- -----------------------------------------------------------
-- room_members  (membership join table)
-- -----------------------------------------------------------
create table if not exists public.room_members (
  room_id    uuid not null references public.rooms (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- -----------------------------------------------------------
-- favorites  (favorited study spaces)
-- -----------------------------------------------------------
create table if not exists public.favorites (
  user_id   uuid not null references public.users (id) on delete cascade,
  space_id  text not null,
  primary key (user_id, space_id)
);

-- ===========================================================
-- Indexes
-- ===========================================================
create index if not exists idx_sessions_user_id        on public.sessions (user_id);
create index if not exists idx_sessions_completed_at    on public.sessions (completed_at);
create index if not exists idx_sessions_user_completed  on public.sessions (user_id, completed_at);

create index if not exists idx_tasks_user_id            on public.tasks (user_id);
create index if not exists idx_tasks_user_completed     on public.tasks (user_id, completed);

create index if not exists idx_goals_user_id            on public.goals (user_id);

create index if not exists idx_rooms_host_user_id       on public.rooms (host_user_id);
create index if not exists idx_rooms_is_active          on public.rooms (is_active);

create index if not exists idx_room_members_user_id     on public.room_members (user_id);
create index if not exists idx_room_members_room_id     on public.room_members (room_id);

create index if not exists idx_favorites_user_id        on public.favorites (user_id);

-- ===========================================================
-- Row Level Security
-- ===========================================================
alter table public.users        enable row level security;
alter table public.sessions     enable row level security;
alter table public.tasks        enable row level security;
alter table public.goals        enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_members enable row level security;
alter table public.favorites    enable row level security;

-- ---------- users ----------
drop policy if exists "users select own" on public.users;
create policy "users select own"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "users insert own" on public.users;
create policy "users insert own"
  on public.users for insert
  with check (auth.uid() = id);

drop policy if exists "users update own" on public.users;
create policy "users update own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users delete own" on public.users;
create policy "users delete own"
  on public.users for delete
  using (auth.uid() = id);

-- ---------- sessions ----------
drop policy if exists "sessions own all" on public.sessions;
create policy "sessions own all"
  on public.sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- tasks ----------
drop policy if exists "tasks own all" on public.tasks;
create policy "tasks own all"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- goals ----------
drop policy if exists "goals own all" on public.goals;
create policy "goals own all"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- favorites ----------
drop policy if exists "favorites own all" on public.favorites;
create policy "favorites own all"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- rooms ----------
-- Anyone authenticated can read active rooms (so invitees can find them).
drop policy if exists "rooms select" on public.rooms;
create policy "rooms select"
  on public.rooms for select
  using (auth.role() = 'authenticated');

drop policy if exists "rooms insert host" on public.rooms;
create policy "rooms insert host"
  on public.rooms for insert
  with check (auth.uid() = host_user_id);

drop policy if exists "rooms update host" on public.rooms;
create policy "rooms update host"
  on public.rooms for update
  using (auth.uid() = host_user_id)
  with check (auth.uid() = host_user_id);

drop policy if exists "rooms delete host" on public.rooms;
create policy "rooms delete host"
  on public.rooms for delete
  using (auth.uid() = host_user_id);

-- ---------- room_members ----------
-- Members can see the membership rows of rooms they belong to.
drop policy if exists "room_members select" on public.room_members;
create policy "room_members select"
  on public.room_members for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.room_members m
      where m.room_id = room_members.room_id
        and m.user_id = auth.uid()
    )
  );

-- A user may add (join) only themselves to a room.
drop policy if exists "room_members insert self" on public.room_members;
create policy "room_members insert self"
  on public.room_members for insert
  with check (auth.uid() = user_id);

-- A user may remove (leave) only their own membership.
drop policy if exists "room_members delete self" on public.room_members;
create policy "room_members delete self"
  on public.room_members for delete
  using (auth.uid() = user_id);

-- ===========================================================
-- Auth trigger: create a public.users row for every new auth user
-- ===========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
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
