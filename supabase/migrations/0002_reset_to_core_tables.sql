-- ===========================================================
-- lock in — RESET to the canonical core-tables schema
-- -----------------------------------------------------------
-- DESTRUCTIVE: drops the old tables (and their data), then recreates
-- the current schema the app expects. Run the whole file at once in
-- the Supabase SQL editor.
--
-- Only run this if you do NOT need the existing rows (e.g. early
-- development / test data). For production data use an ALTER-based
-- migration instead.
-- ===========================================================

-- ---------- 1. drop old objects ----------
drop table if exists public.room_members cascade;
drop table if exists public.rooms        cascade;
drop table if exists public.favorites    cascade;
drop table if exists public.sessions     cascade;
drop table if exists public.tasks        cascade;
drop table if exists public.goals        cascade;

-- old first-version schema also created these; remove them too:
drop table if exists public.users cascade;
drop function if exists public.handle_new_user cascade;

-- ---------- 2. recreate the schema ----------
create extension if not exists "pgcrypto";

-- sessions
create table public.sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  duration_minutes  integer not null default 0,
  space_id          text,
  session_type      text not null default 'focus',
  created_at        timestamptz not null default now()
);

-- goals (one row of preferences per user)
create table public.goals (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  daily_goal_minutes   integer not null default 120,
  weekly_goal_minutes  integer not null default 600,
  updated_at           timestamptz not null default now()
);
create unique index goals_user_id_key on public.goals (user_id);

-- tasks
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- rooms
create table public.rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  is_active   boolean not null default true
);

-- room_members
create table public.room_members (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  joined_at     timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  unique (room_id, user_id)
);

-- favorites
create table public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  space_id    text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, space_id)
);

-- ---------- 3. indexes ----------
create index idx_sessions_user_id     on public.sessions (user_id);
create index idx_tasks_user_id         on public.tasks (user_id);
create index idx_rooms_created_by       on public.rooms (created_by);
create index idx_room_members_user_id   on public.room_members (user_id);
create index idx_room_members_room_id   on public.room_members (room_id);
create index idx_favorites_user_id      on public.favorites (user_id);

-- ---------- 4. row level security ----------
alter table public.sessions     enable row level security;
alter table public.goals        enable row level security;
alter table public.tasks        enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_members enable row level security;
alter table public.favorites    enable row level security;

-- helper so the room_members policy can reference room_members
-- without recursing (SECURITY DEFINER bypasses RLS).
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

-- sessions / goals / tasks / favorites: own rows only
create policy "sessions own rows" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals own rows" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks own rows" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "favorites own rows" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- rooms: owner can do anything; members may read rooms they belong to
create policy "rooms select member or owner" on public.rooms
  for select using (auth.uid() = created_by or public.is_room_member(id, auth.uid()));
create policy "rooms insert owner" on public.rooms
  for insert with check (auth.uid() = created_by);
create policy "rooms update owner" on public.rooms
  for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "rooms delete owner" on public.rooms
  for delete using (auth.uid() = created_by);

-- room_members: read all members of rooms you belong to; write only your row
create policy "room_members read shared" on public.room_members
  for select using (public.is_room_member(room_id, auth.uid()));
create policy "room_members insert self" on public.room_members
  for insert with check (auth.uid() = user_id);
create policy "room_members update self" on public.room_members
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "room_members delete self" on public.room_members
  for delete using (auth.uid() = user_id);

-- ---------- 5. verify ----------
select
  c.relname        as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.polname) as policy_count
from pg_class c
left join pg_policy p on p.polrelid = c.oid
where c.relnamespace = 'public'::regnamespace
  and c.relname in ('sessions', 'goals', 'tasks', 'rooms', 'room_members', 'favorites')
group by c.relname, c.relrowsecurity
order by c.relname;
