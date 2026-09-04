-- =========================================================
-- 035_articles.sql
-- Resources/guides section (cert prep guides, "how to become a...").
-- Editorial content, not user-generated -- unlike company_reviews,
-- there's no owner-insert policy here at all. Writes go through the
-- service role only, same as every other "public reference data"
-- table (jobs, careers, etc. all follow this same read-only-for-public
-- shape per 010_rls_policies.sql's documented house style).
-- =========================================================

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  category text not null,
  author_name text not null default 'Aviation Careers Team',
  status verification_status not null default 'pending',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_articles_published on public.articles(published_at desc) where status = 'approved';

alter table public.articles enable row level security;

-- 'approved' + a published_at in the past -- lets an article be queued
-- with a future published_at without a second "scheduled" concept.
create policy "articles_public_read_published" on public.articles
  for select using (status = 'approved' and published_at is not null and published_at <= now());
