create extension if not exists "pgcrypto";

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  website_url text not null,
  business_name text,
  industry text,
  goal text,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  raw_content text,
  summary text not null,
  detected_style jsonb not null default '{}'::jsonb,
  detected_colors jsonb not null default '[]'::jsonb,
  detected_structure jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
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

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  proposal_id uuid not null references proposals(id) on delete cascade,
  price integer not null,
  currency text not null default 'EUR',
  scope jsonb not null default '[]'::jsonb,
  timeline text not null,
  status text not null default 'generated' check (status in ('generated', 'confirmed', 'cancelled')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_sessions_token_hash_idx on app_sessions(token_hash);
create index if not exists app_sessions_user_id_idx on app_sessions(user_id);
create index if not exists projects_user_id_idx on projects(user_id);
create index if not exists proposals_project_id_idx on proposals(project_id);
create index if not exists quotes_project_id_idx on quotes(project_id);
