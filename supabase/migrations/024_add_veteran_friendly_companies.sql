-- =========================================================
-- 024_add_veteran_friendly_companies.sql
-- Lets employers self-identify as actively welcoming veteran
-- applicants -- powers the /veterans page's employer list.
-- Safe/additive: nullable-equivalent boolean with a default,
-- existing rows just get `false`.
-- =========================================================

alter table public.companies add column if not exists veteran_friendly boolean not null default false;
