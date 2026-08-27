# Aviation Careers — V1 Database Migrations

Run these in order (they're numbered for exactly that reason). Each one is written to be Supabase/Postgres-compatible as-is.

| File | Covers |
|---|---|
| 001_extensions_and_enums.sql | Extensions (uuid-ossp, pgcrypto, pg_trgm, postgis) + every enum type used later |
| 002_identity_and_roles.sql | profiles, roles, user_roles, job_seeker_profiles |
| 003_resume_and_profile.sql | resumes, processing jobs, parses, experience, education, skills, certifications |
| 004_taxonomy_and_geography.sql | career_categories, careers, aliases, progression, career_content, locations, airports |
| 005_companies_and_employers.sql | companies, company_airports, employer_organizations, employer_members, verifications |
| 006_jobs.sql | jobs, job_locations, job_compensation, job_requirements, job_skills, job_certifications, search vector trigger, saved_jobs, job_applications, job_alerts |
| 007_salary_and_training.sql | salary_sources, salary_records, salary_aggregates, training_providers, training_programs |
| 008_notifications_analytics_system.sql | notifications, job_events, job_daily_metrics, search_events, audit_logs, job ingestion tables |
| 009_functions_and_triggers.sql | updated_at trigger, auto-create-profile-on-signup trigger, has_role() / is_employer_member() helpers used by RLS |
| 010_rls_policies.sql | RLS for every V1-critical table (owner-only personal data, public-read reference data, employer-member-managed jobs/companies) |

## Notes on decisions baked into this schema

- **Three-layer resume model** (`resumes` → `resume_parses` → `user_experience`/`user_education`/`user_skills`/`user_certifications`) matches the architecture decision from the spec: the file, the raw AI extraction, and the user-confirmed profile are never the same table, so re-parsing or swapping parsers never destroys user-edited data.
- **`certificate_number_encrypted`** is a placeholder column name to force the app layer to encrypt before insert — nothing in this schema exposes it via a public read policy.
- **PostGIS** is added now (not deferred) since airport/radius search is core to V1 job search, per the spec's "Geographic Search: PostGIS" decision. `pgvector` is deliberately *not* added yet — that's Phase 3+ (semantic resume/job matching), no sense enabling it before there's data to embed.
- **RLS pattern**: every table either has (a) an owner-only policy keyed on `auth.uid()`, (b) a public-read policy for reference/browse data, or (c) an employer-membership check via the `is_employer_member()` helper. `010_rls_policies.sql` covers the V1-critical tables explicitly; as employer and admin features get built out, apply the same three-pattern approach to the remaining tables (training marketplace writes, admin moderation tables, analytics rollups) rather than leaving them RLS-disabled.
- **Search** is plain Postgres full-text (`tsvector` + GIN index) per the spec's decision to not introduce OpenSearch/Typesense until scale requires it.
- **Salary aggregates** are a separate, pre-computed table from raw `salary_records` so public salary pages never run expensive percentile calculations on request — a scheduled job (Phase 2+) recomputes `salary_aggregates` on a cadence.

## What's intentionally not in this migration set

Per the V1 scope, these are Phase 2+ and not yet modeled: employer job-posting billing/Stripe tables, admin-specific moderation queue tables beyond what's needed to store raw ingestion (those can layer on top of `raw_job_records` and `audit_logs` without a schema change), and any pgvector/embedding tables.

## Suggested next step

Repository structure + application build plan (Next.js app router layout, Supabase client setup, the first server actions for job search and resume upload) — this was the deliverable queued up after this one.
