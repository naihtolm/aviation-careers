-- =========================================================
-- 011_public_reference_rls.sql
-- Extends the public-read RLS pattern from 010_rls_policies.sql to a
-- few more reference/browse tables that Sprint 2's public pages need.
--
-- These tables were left uncovered in 010 (which only covered
-- V1-critical tables), but Supabase enables RLS by default on new
-- tables even without an explicit ALTER TABLE -- so instead of being
-- open, they were silently returning zero rows to anon/authenticated
-- clients (e.g. the airport detail page's "Employers" tab). Same
-- three-pattern approach as 010: public reference data gets a single
-- "anyone can read" policy, writes stay service-role/admin only.
-- =========================================================

alter table public.company_airports enable row level security;
create policy "company_airports_public_read" on public.company_airports
  for select using (active = true);

alter table public.career_certification_requirements enable row level security;
create policy "career_certification_requirements_public_read" on public.career_certification_requirements
  for select using (true);

alter table public.career_progression enable row level security;
create policy "career_progression_public_read" on public.career_progression
  for select using (true);

alter table public.certifications enable row level security;
create policy "certifications_public_read" on public.certifications
  for select using (true);
