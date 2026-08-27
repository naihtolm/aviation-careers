-- =========================================================
-- 001_extensions_and_enums.sql
-- Aviation Careers Platform — V1 Database Migration
-- Extensions + shared enum types
-- =========================================================

-- Extensions -------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";      -- fuzzy text matching (career aliases, company search)
create extension if not exists "postgis";      -- geographic queries (radius search)
-- pgvector is added later once semantic matching is actually built (Phase 3+)
-- create extension if not exists "vector";

-- =========================================================
-- ENUM TYPES
-- =========================================================

create type account_status as enum ('active', 'suspended', 'deleted');

create type app_role as enum (
  'job_seeker',
  'employer_owner',
  'employer_admin',
  'employer_recruiter',
  'platform_admin',
  'platform_moderator',
  'platform_editor'
);

create type profile_visibility as enum ('private', 'employers', 'public');

create type resume_upload_status as enum ('uploaded', 'processing', 'processed', 'failed');
create type resume_processing_status as enum ('queued', 'processing', 'completed', 'failed');
create type data_source as enum ('resume', 'manual', 'ai');

create type requirement_type as enum ('required', 'preferred', 'optional');

create type company_type as enum (
  'airline', 'airport', 'airport_authority', 'mro', 'ground_handling',
  'cargo', 'fbo', 'manufacturer', 'aerospace', 'government',
  'staffing', 'training', 'other'
);

create type company_status as enum ('pending', 'active', 'suspended', 'rejected');
create type verification_status as enum ('pending', 'approved', 'rejected', 'needs_information');

create type employer_member_role as enum ('owner', 'admin', 'recruiter', 'viewer');

create type airport_relationship_type as enum (
  'hub', 'base', 'maintenance_base', 'operations', 'cargo_hub', 'headquarters', 'other'
);

create type job_status as enum (
  'draft', 'pending_review', 'active', 'paused', 'expired', 'archived', 'rejected'
);

create type job_source_type as enum ('employer_direct', 'api', 'feed', 'manual', 'partner');
create type job_application_type as enum ('external_url', 'platform_application', 'email');

create type employment_type as enum (
  'full_time', 'part_time', 'contract', 'temporary', 'internship'
);

create type experience_level as enum (
  'no_experience', 'entry_level', 'one_to_two', 'three_to_five', 'five_to_ten', 'ten_plus'
);

create type education_level as enum (
  'no_degree', 'high_school', 'certificate', 'associate', 'bachelor', 'master', 'doctorate'
);

create type work_arrangement as enum ('on_site', 'hybrid', 'remote');

create type requirement_category as enum (
  'skill', 'certification', 'education', 'experience', 'license', 'physical', 'security_clearance', 'other'
);

create type importance_level as enum ('high', 'medium', 'low');

create type pay_type as enum ('base', 'total_compensation', 'hourly', 'salary', 'bonus', 'commission');
create type pay_period as enum ('hour', 'week', 'month', 'year');

create type application_status as enum (
  'interested', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'
);

create type alert_frequency as enum ('daily', 'weekly');

create type training_format as enum ('in_person', 'online', 'hybrid');

create type job_event_type as enum ('view', 'save', 'apply_click', 'share', 'report');

create type notification_type as enum (
  'job_alert', 'saved_job_expiring', 'application_reminder',
  'employer_verification', 'billing', 'system'
);

create type notification_channel as enum ('in_app', 'email', 'sms_future', 'push_future');
create type notification_delivery_status as enum ('pending', 'sent', 'failed');
