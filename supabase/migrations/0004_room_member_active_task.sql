-- Add optional active-task label to room membership rows so members
-- can see what each other is focusing on.
alter table public.room_members
  add column if not exists active_task text;
