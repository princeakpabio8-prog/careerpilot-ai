create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  target_roles text[] not null default '{}',
  preferred_countries text[] not null default '{}',
  remote_allowed boolean not null default true,
  visa_sponsorship_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  title text not null,
  location text,
  remote boolean not null default false,
  visa_sponsorship text not null default 'unknown'
    check (visa_sponsorship in ('confirmed', 'likely', 'unknown', 'not_available')),
  source text not null,
  apply_url text unique not null,
  description text,
  match_score integer not null default 0 check (match_score between 0 and 100),
  status text not null default 'discovered'
    check (status in ('discovered', 'shortlisted', 'approved', 'rejected', 'applied')),
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'ready_for_approval', 'approved', 'submitted', 'interview', 'rejected', 'offer', 'withdrawn')),
  tailored_resume_url text,
  cover_letter text,
  approval_notes text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, job_id)
);

create index if not exists jobs_match_score_idx on jobs(match_score desc);
create index if not exists jobs_visa_sponsorship_idx on jobs(visa_sponsorship);
create index if not exists applications_status_idx on applications(status);
