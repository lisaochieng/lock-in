-- Performance indexes for common query patterns.
-- Safe to run multiple times in the Supabase SQL editor.

create index if not exists idx_sessions_user_created
  on public.sessions (user_id, created_at desc);

create index if not exists idx_sessions_user_date
  on public.sessions (user_id, created_at);

create index if not exists idx_tasks_user
  on public.tasks (user_id);

create index if not exists idx_room_members_room
  on public.room_members (room_id);
