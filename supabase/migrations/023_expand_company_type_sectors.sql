-- =========================================================
-- 023_expand_company_type_sectors.sql
-- Adds three sector values to the existing company_type enum so
-- employers can identify as EMS/air ambulance, law enforcement, or
-- military/defense -- the organizational-sector counterpart to the
-- career-category expansion in 022 (which described *type of work*,
-- not *type of employer*).
--
-- Safe/additive: adding enum values never touches existing rows.
-- Postgres does not allow a newly added enum value to be *used* in
-- the same transaction it was added in, so this migration only adds
-- the values -- no inserts/updates using them belong in this file.
-- =========================================================

alter type company_type add value if not exists 'ems_operator';
alter type company_type add value if not exists 'law_enforcement';
alter type company_type add value if not exists 'military_defense';
