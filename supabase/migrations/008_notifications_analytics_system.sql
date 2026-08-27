-- =========================================================
-- 008_notifications_analytics_system.sql
-- Notifications, analytics events + rollups, ingestion, audit logs
-- =========================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  action_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, is_read);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel notification_channel not null,
  status notification_delivery_status not null default 'pending',
  provider_message_id text,
  sent_at timestamptz,
  error_message text
);

-- Analytics: raw events + daily rollups -----------------------------------
create table public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  event_type job_event_type not null,
  user_id uuid references public.profiles(id),
  session_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_job_events_job_created on public.job_events(job_id, created_at);

create table public.job_daily_metrics (
  job_id uuid not null references public.jobs(id) on delete cascade,
  date date not null,
  views int not null default 0,
  unique_views int not null default 0,
  saves int not null default 0,
  apply_clicks int not null default 0,
  shares int not null default 0,
  primary key (job_id, date)
);

create table public.search_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  session_id text,
  query text,
  filters jsonb,
  result_count int,
  clicked_job_id uuid references public.jobs(id),
  created_at timestamptz not null default now()
);

-- System: audit logs + job ingestion -----------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

create table public.job_ingestion_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null,   -- 'greenhouse' | 'lever' | 'usajobs' | 'employer_feed' | ...
  configuration jsonb,
  is_active boolean not null default true
);

create table public.raw_job_records (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.job_ingestion_sources(id) on delete cascade,
  external_id text,
  raw_data jsonb not null,
  raw_hash text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'received'
);

create unique index uniq_raw_job_records_source_hash on public.raw_job_records(source_id, raw_hash);
