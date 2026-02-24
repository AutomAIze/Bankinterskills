-- HR 360 schema extension for integrated talent platform
-- Safe to run multiple times using IF NOT EXISTS clauses.

create extension if not exists "uuid-ossp";

create table if not exists public.hr_import_batches (
  id uuid primary key default uuid_generate_v4(),
  source text not null check (source in ('CSOD', 'SOPRA', 'M50')),
  cycle text not null,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.hr_import_errors (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid not null references public.hr_import_batches(id) on delete cascade,
  row_number integer not null,
  error_code text not null,
  error_message text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_employees (
  id text primary key,
  external_id text,
  full_name text not null,
  email text,
  business_unit text,
  department text,
  position text,
  manager_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.performance_evaluations (
  id text primary key,
  employee_id text not null references public.hr_employees(id) on delete cascade,
  source text not null check (source in ('CSOD', 'SOPRA', 'M50')),
  cycle text not null,
  evaluation_type text not null check (evaluation_type in ('annual', 'mid_year', 'quarterly', 'ad_hoc')),
  score numeric(5,2) not null,
  normalized_score numeric(5,2) not null,
  qualitative_notes text,
  evaluator text,
  evaluated_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.potential_assessments (
  id text primary key,
  employee_id text not null references public.hr_employees(id) on delete cascade,
  source text not null check (source in ('CSOD', 'SOPRA', 'M50')),
  cycle text not null,
  potential_level text not null check (potential_level in ('low', 'medium', 'high')),
  potential_score numeric(5,2) not null,
  readiness text not null check (readiness in ('ready_now', 'ready_1y', 'ready_2y', 'not_ready')),
  rationale text,
  assessed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bonus_objectives (
  id text primary key,
  employee_id text not null references public.hr_employees(id) on delete cascade,
  source text not null default 'M50' check (source = 'M50'),
  cycle text not null,
  objective_code text not null,
  objective_name text not null,
  weight numeric(6,2) not null,
  target_value numeric(10,2),
  progress_value numeric(10,2),
  status text not null check (status in ('not_started', 'on_track', 'at_risk', 'completed')),
  due_date date,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.hr_development_actions (
  id text primary key,
  employee_id text not null,
  source text not null check (source in ('automation', 'CSOD', 'SOPRA', 'M50')),
  action_type text not null check (action_type in ('training', 'mentoring', 'rotation', 'succession')),
  title text not null,
  reason text not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null check (status in ('pending', 'in_progress', 'completed')),
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_succession_risk_snapshots (
  id text primary key,
  position_id text not null,
  position_name text not null,
  business_unit text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  readiness_coverage numeric(6,2) not null default 0,
  bench_size integer not null default 0,
  snapshot_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_training_recommendations (
  id uuid primary key default uuid_generate_v4(),
  employee_id text not null,
  title text not null,
  reason text not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  suggested_actions text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.hr_career_paths (
  id uuid primary key default uuid_generate_v4(),
  path_code text not null,
  from_role text not null,
  to_role text not null,
  min_readiness_score numeric(5,2) not null default 0,
  required_skills text[] not null default '{}',
  created_at timestamptz not null default now()
);

create or replace view public.hr_integrated_talent_dashboard_v as
with eval_latest as (
  select
    employee_id,
    max(evaluated_at) as latest_eval_at,
    avg(normalized_score) as sustained_performance_score
  from public.performance_evaluations
  group by employee_id
),
pot_latest as (
  select distinct on (employee_id)
    employee_id,
    potential_level,
    potential_score,
    readiness,
    assessed_at
  from public.potential_assessments
  order by employee_id, assessed_at desc
),
bonus_status as (
  select
    employee_id,
    count(*) as objectives_total,
    count(*) filter (where status in ('on_track', 'completed')) as objectives_on_track
  from public.bonus_objectives
  group by employee_id
),
action_status as (
  select
    employee_id,
    count(*) as actions_total,
    count(*) filter (where status <> 'completed') as actions_pending
  from public.hr_development_actions
  group by employee_id
)
select
  e.id as employee_id,
  e.full_name,
  e.business_unit,
  e.department,
  e.position,
  coalesce(ev.sustained_performance_score, 0) as sustained_performance_score,
  ev.latest_eval_at,
  pot.potential_level,
  pot.potential_score,
  pot.readiness,
  coalesce(b.objectives_total, 0) as objectives_total,
  coalesce(b.objectives_on_track, 0) as objectives_on_track,
  coalesce(a.actions_total, 0) as actions_total,
  coalesce(a.actions_pending, 0) as actions_pending
from public.hr_employees e
left join eval_latest ev on ev.employee_id = e.id
left join pot_latest pot on pot.employee_id = e.id
left join bonus_status b on b.employee_id = e.id
left join action_status a on a.employee_id = e.id;

create or replace view public.hr_succession_dashboard_v as
select
  business_unit,
  count(*) as positions_count,
  count(*) filter (where risk_level = 'high') as high_risk_positions,
  round(avg(readiness_coverage), 2) as avg_readiness_coverage,
  sum(bench_size) as total_bench
from public.hr_succession_risk_snapshots
group by business_unit;

create index if not exists idx_performance_employee_cycle
  on public.performance_evaluations(employee_id, cycle);

create index if not exists idx_potential_employee_cycle
  on public.potential_assessments(employee_id, cycle);

create index if not exists idx_bonus_employee_cycle
  on public.bonus_objectives(employee_id, cycle);
