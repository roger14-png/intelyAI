create table roles (
  id uuid primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key,
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null references roles(name),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table permissions (
  id uuid primary key,
  role_name text not null references roles(name),
  action text not null,
  resource text not null,
  created_at timestamptz not null default now()
);

create table candidate_profiles (
  id uuid primary key,
  user_id uuid not null unique references users(id) on delete cascade,
  headline text,
  location text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table skills (
  id uuid primary key,
  candidate_profile_id uuid not null references candidate_profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table education (
  id uuid primary key,
  candidate_profile_id uuid not null references candidate_profiles(id) on delete cascade,
  school text not null,
  degree text not null,
  year text,
  created_at timestamptz not null default now()
);

create table experience (
  id uuid primary key,
  candidate_profile_id uuid not null references candidate_profiles(id) on delete cascade,
  title text not null,
  company text not null,
  start_date text,
  end_date text,
  description text,
  created_at timestamptz not null default now()
);

create table certificates (
  id uuid primary key,
  candidate_profile_id uuid not null references candidate_profiles(id) on delete cascade,
  name text not null,
  issuer text,
  file_url text,
  created_at timestamptz not null default now()
);

create table job_categories (
  id uuid primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table jobs (
  id uuid primary key,
  title text not null,
  company text not null,
  location text not null,
  employment_type text not null,
  description text not null,
  status text not null default 'open',
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table job_skills (
  id uuid primary key,
  job_id uuid not null references jobs(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table applications (
  id uuid primary key,
  job_id uuid not null references jobs(id) on delete cascade,
  candidate_id uuid not null references users(id) on delete cascade,
  status text not null default 'applied',
  cover_letter text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create table application_history (
  id uuid primary key,
  application_id uuid not null references applications(id) on delete cascade,
  status text not null,
  changed_by uuid not null references users(id),
  notes text,
  created_at timestamptz not null default now()
);

create table email_accounts (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  provider text not null,
  email_address text not null,
  access_token text,
  refresh_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table email_logs (
  id uuid primary key,
  application_id uuid references applications(id) on delete set null,
  recipient_user_id uuid references users(id) on delete set null,
  recipient_email text not null,
  provider text not null,
  direction text not null,
  status text not null default 'queued',
  subject text not null,
  body text not null,
  sent_at timestamptz not null default now()
);