-- ===========================================================
-- lock in — room host controls (space sync + shared timer)
-- -----------------------------------------------------------
-- Adds host_id, current_space_id, timer_state to rooms and
-- updates RLS so members can read and only the host can update.
-- Enables Realtime on rooms for subscribeToRoomState().
--
-- Idempotent: safe to run multiple times.
-- ===========================================================

-- ---------- columns ----------
alter table public.rooms
  add column if not exists host_id uuid references auth.users (id);

alter table public.rooms
  add column if not exists current_space_id text;

alter table public.rooms
  add column if not exists timer_state jsonb default '{
    "isRunning": false,
    "timeLeft": 1500,
    "mode": "focus",
    "startedAt": null
  }'::jsonb;

-- Backfill host for rooms created before this migration.
update public.rooms
set host_id = created_by
where host_id is null;

-- ---------- RLS ----------
drop policy if exists "rooms select member or owner" on public.rooms;
drop policy if exists "rooms update owner" on public.rooms;
drop policy if exists "members can read room" on public.rooms;
drop policy if exists "host can update room" on public.rooms;

create policy "members can read room" on public.rooms
  for select using (
    id in (
      select room_id from public.room_members
      where user_id = auth.uid()
    )
  );

create policy "host can update room" on public.rooms
  for update using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- ---------- realtime ----------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end $$;
