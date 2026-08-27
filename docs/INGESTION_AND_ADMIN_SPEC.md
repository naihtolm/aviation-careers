# Ingestion Connector + Minimal Admin Screen — Spec v1

Covers the two pieces that need to exist before Step 4 (public website) can be built against real data, per the revised launch roadmap: a working job ingestion connector, and a bare-bones admin screen to review/approve what it pulls in.

## 1. Scope decisions

- **First connector: Greenhouse.** Its Job Board API is public per company (no auth, no partnership negotiation needed) — you just need each employer's board token. This makes it the fastest legitimate way to get real aviation job postings flowing before you have direct employer relationships. USAJOBS (federal aviation roles — FAA, TSA, DoD aviation maintenance) is the natural second connector once this pattern is proven, since it follows the same "fetch → normalize → land in raw_job_records" shape.
- **Ingestion writes to `raw_job_records` only.** It never writes directly to `jobs`. This preserves the architecture decision from the schema: raw data is never lost even if normalization logic is wrong or changes later.
- **Normalization into `jobs` happens through the admin screen, not automatically, in this minimal version.** Automatic AI classification (career category, certifications, salary extraction) is real but is Phase 1.5+ work per the roadmap. Right now, a human clicks approve and picks the career category from a dropdown. This is intentionally low-tech — the roadmap explicitly says this tool "can be ugly."
- **Dedup is hash-based, not fuzzy, at this stage.** `raw_job_records` already has a unique constraint on `(source_id, raw_hash)`, so re-running ingestion on a schedule naturally skips jobs it's already seen from the same source. Cross-source duplicate detection (the same job appearing via two different sources) is explicitly out of scope for this minimal version — flagged in the admin UI as a manual judgment call for now, not solved algorithmically yet.
- **Auth model:** ingestion runs as a scheduled server-side job using the Supabase service role (bypasses RLS by design — it's not a user action). The admin screen runs as an authenticated request that checks `has_role('platform_admin')` — the same helper function already defined in migration 009 — before allowing any read/write.

## 2. Ingestion flow

```
job_ingestion_sources (config: { board_token })
        │
        ▼
  fetchGreenhouseJobs(boardToken)
        │
        ▼
  for each job: compute raw_hash = sha256(JSON.stringify(job))
        │
        ▼
  upsert into raw_job_records
    ON CONFLICT (source_id, raw_hash) DO NOTHING
        │
        ▼
  status = 'received', waiting for admin review
```

Run on a schedule (Supabase Edge Function + `pg_cron`, or a simple Vercel Cron hitting a route handler — either works at this scale; Vercel Cron is the lower-effort option to stand up first).

## 3. Admin review flow

```
Admin opens /admin/jobs/review
        │
        ▼
  sees raw_job_records where status = 'received'
  (title/company/location pulled out of raw_data for display)
        │
        ├── Reject → status = 'rejected', done
        │
        └── Approve →
              admin confirms/picks:
                - career_id (dropdown, searchable)
                - company (match existing by name, or create new)
                - location (city/state — free text for now)
                - salary min/max (optional, pulled from raw data if present)
              │
              ▼
        server action creates:
          companies row (if new)
          jobs row (status = 'active')
          job_locations row
          job_compensation row (if salary provided)
        │
        ▼
        raw_job_records.status = 'processed'
```

## 4. Files in this spec

| File | Purpose |
|---|---|
| `lib/ingestion/types.ts` | Shared types for the connector |
| `lib/ingestion/greenhouse-connector.ts` | Fetches + hashes + upserts Greenhouse jobs into `raw_job_records` |
| `lib/ingestion/run-ingestion.ts` | Entry point a cron route handler calls — loops over active Greenhouse sources |
| `app/admin/jobs/review/page.tsx` | Server component — lists pending raw records, role-gated |
| `app/admin/jobs/review/RawJobCard.tsx` | Client component — one job's review card with approve/reject form |
| `app/admin/jobs/review/actions.ts` | Server actions: `approveRawJob`, `rejectRawJob` |

## 5. What's deliberately not built yet

- No AI-assisted career/salary classification — admin picks manually
- No fuzzy cross-source duplicate detection
- No USAJOBS connector yet (same pattern, add once Greenhouse is proven)
- No employer-facing "claim this listing" flow
- No pagination/search on the admin review list (fine at low volume; add when the queue grows past ~50 pending items)
