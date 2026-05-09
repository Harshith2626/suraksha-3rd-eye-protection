create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  origin text
);

alter table public.app_state enable row level security;

create policy "anyone can read app_state" on public.app_state for select using (true);
create policy "anyone can insert app_state" on public.app_state for insert with check (true);
create policy "anyone can update app_state" on public.app_state for update using (true) with check (true);

alter publication supabase_realtime add table public.app_state;
alter table public.app_state replica identity full;