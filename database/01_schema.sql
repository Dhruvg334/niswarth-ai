-- Niswarth AI Stage 3 Database Schema

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('education', 'animal_welfare', 'environment', 'other')),
  location text not null,
  status text not null default 'active' check (status in ('planning', 'active', 'completed', 'paused')),
  goal text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  city text,
  availability text default 'available' check (availability in ('available', 'limited', 'unavailable')),
  created_at timestamptz not null default now()
);

create table if not exists campaign_volunteers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  volunteer_id uuid not null references volunteers(id) on delete cascade,
  assignment_role text not null,
  created_at timestamptz not null default now(),
  unique (campaign_id, volunteer_id)
);

create table if not exists field_updates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  update_text text not null,
  location text,
  submitted_by text,
  evidence_type text default 'text' check (evidence_type in ('text', 'image', 'document', 'mixed')),
  created_at timestamptz not null default now()
);

create table if not exists impact_reports (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  draft_text text not null,
  edited_text text,
  status text not null default 'draft' check (status in ('draft', 'under_review', 'approved', 'needs_revision')),
  review_notes text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
