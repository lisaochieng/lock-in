-- Public spaces catalog for search and browsing.

create table if not exists public.spaces (
  id              text primary key,
  name            text not null,
  tags            text,
  thumbnail_url   text,
  background_url  text,
  quote           text
);

alter table public.spaces enable row level security;

drop policy if exists "spaces read all" on public.spaces;
create policy "spaces read all" on public.spaces
  for select using (true);
