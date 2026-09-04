-- =========================================================
-- 034_company_reviews.sql
-- Employer reviews/ratings, gated through moderation the same way
-- ingested job listings are (raw_job_records -> admin review -> live) --
-- a public rating of a real employer carries real reputational/legal
-- weight, so nothing here goes live without an admin approving it.
--
-- Reuses the existing verification_status enum ('pending', 'approved',
-- 'rejected', 'needs_information') for moderation state rather than
-- inventing a near-duplicate type -- same set of states, same meaning.
-- =========================================================

create type review_employment_status as enum ('current_employee', 'former_employee', 'interview_candidate');

create table public.company_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  pros text,
  cons text,
  employment_status review_employment_status not null,
  status verification_status not null default 'pending',
  moderated_at timestamptz,
  moderated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  -- One review per person per employer -- not one per job/visit. Someone
  -- who wants to update their take deletes and resubmits (owner-delete
  -- policy below) rather than accumulating duplicate reviews.
  unique (company_id, user_id)
);

create index idx_company_reviews_company_status on public.company_reviews(company_id, status);

alter table public.company_reviews enable row level security;

-- Public sees only what's cleared moderation.
create policy "company_reviews_public_read_approved" on public.company_reviews
  for select using (status = 'approved');

-- An author can see their own review regardless of status (so they know
-- it's pending, or that it was rejected) -- this is a second, separate
-- permissive select policy; Postgres RLS ORs them together, it doesn't
-- replace the one above.
create policy "company_reviews_owner_read_own" on public.company_reviews
  for select using (user_id = auth.uid());

create policy "company_reviews_owner_insert" on public.company_reviews
  for insert with check (user_id = auth.uid());

-- No owner-update policy: a review that's already been approved
-- shouldn't become editable without re-moderation, and that's more
-- machinery than a V1 review system needs. Withdraw + resubmit instead.
create policy "company_reviews_owner_delete" on public.company_reviews
  for delete using (user_id = auth.uid());

-- No admin RLS carve-out, matching the rest of this schema's house
-- style -- moderation goes through the service-role client from an
-- admin Server Action after an explicit has_role() check, same as
-- raw_job_records.
