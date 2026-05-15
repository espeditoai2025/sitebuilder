create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  website_url text not null,
  business_name text,
  industry text,
  goal text,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  raw_content text,
  summary text not null,
  detected_style jsonb not null default '{}'::jsonb,
  detected_colors jsonb not null default '[]'::jsonb,
  detected_structure jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  variant text not null check (variant in ('A', 'B')),
  title text not null,
  description text not null,
  homepage_structure jsonb not null default '[]'::jsonb,
  visual_style jsonb not null default '{}'::jsonb,
  palette jsonb not null default '[]'::jsonb,
  copy jsonb not null default '{}'::jsonb,
  preview_data jsonb not null default '{}'::jsonb,
  is_selected boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  price integer not null,
  currency text not null default 'EUR',
  scope jsonb not null default '[]'::jsonb,
  timeline text not null,
  status text not null default 'generated' check (status in ('generated', 'confirmed', 'cancelled')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists proposals_project_id_idx on public.proposals(project_id);
create index if not exists quotes_project_id_idx on public.quotes(project_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.site_analyses enable row level security;
alter table public.proposals enable row level security;
alter table public.quotes enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);

create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id);

create policy "analyses_select_own" on public.site_analyses
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = site_analyses.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "analyses_insert_own" on public.site_analyses
  for insert with check (
    exists (
      select 1 from public.projects
      where projects.id = site_analyses.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "proposals_select_own" on public.proposals
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = proposals.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "proposals_insert_own" on public.proposals
  for insert with check (
    exists (
      select 1 from public.projects
      where projects.id = proposals.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "proposals_update_own" on public.proposals
  for update using (
    exists (
      select 1 from public.projects
      where projects.id = proposals.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "quotes_select_own" on public.quotes
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = quotes.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "quotes_insert_own" on public.quotes
  for insert with check (
    exists (
      select 1 from public.projects
      where projects.id = quotes.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "quotes_update_own" on public.quotes
  for update using (
    exists (
      select 1 from public.projects
      where projects.id = quotes.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "notifications_select_own" on public.notifications
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = notifications.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "notifications_insert_own" on public.notifications
  for insert with check (
    exists (
      select 1 from public.projects
      where projects.id = notifications.project_id
      and projects.user_id = auth.uid()
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
