-- =========================================================
-- 028_add_job_outlook_to_career_content.sql
-- Adds BLS 10-year employment growth outlook fields to
-- career_content -- safe/additive nullable columns, same pattern as
-- prior migrations in this series.
-- =========================================================

alter table public.career_content add column if not exists outlook_growth_pct numeric;
alter table public.career_content add column if not exists outlook_period text;
alter table public.career_content add column if not exists outlook_label text;
alter table public.career_content add column if not exists outlook_narrative text;
