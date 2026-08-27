# Aviation Careers — Repository + Code Architecture v1

The actual project structure, module boundaries, naming conventions, and client patterns a developer opens on day one. Ties directly to what's already been built (the SQL migrations, the Greenhouse connector, the admin review screen) — this document shows where those pieces live in a real repo, not a fresh restart.

---

## 1. Full repository layout

```
aviation-careers/
│
├── supabase/
│   └── migrations/
│       ├── 001_extensions_and_enums.sql
│       ├── 002_identity_and_roles.sql
│       ├── 003_resume_and_profile.sql
│       ├── 004_taxonomy_and_geography.sql
│       ├── 005_companies_and_employers.sql
│       ├── 006_jobs.sql
│       ├── 007_salary_and_training.sql
│       ├── 008_notifications_analytics_system.sql
│       ├── 009_functions_and_triggers.sql
│       └── 010_rls_policies.sql
│   (this is the exact migrations folder already produced — the Supabase CLI
│    reads directly from supabase/migrations, so nothing about it changes
│    when it moves into the real repo)
│
├── src/
│   ├── app/                          — Next.js App Router; routes only
│   │   ├── (marketing)/
│   │   │   ├── page.tsx                      → /
│   │   │   ├── careers/
│   │   │   │   ├── page.tsx                  → /careers
│   │   │   │   └── [slug]/page.tsx           → /careers/[slug]
│   │   │   ├── salaries/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [career]/[location]/page.tsx
│   │   │   ├── airports/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [code]/page.tsx
│   │   │   └── companies/
│   │   │       └── [slug]/page.tsx
│   │   │
│   │   ├── jobs/
│   │   │   ├── page.tsx                      → /jobs (search results)
│   │   │   └── [slug]/page.tsx                → /jobs/[slug]
│   │   │
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── sign-up/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── onboarding/page.tsx
│   │   │
│   │   ├── dashboard/                — job seeker, requires auth
│   │   │   ├── page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── resume/page.tsx
│   │   │   ├── saved/page.tsx
│   │   │   ├── applications/page.tsx
│   │   │   └── alerts/page.tsx
│   │   │
│   │   ├── employer/                 — requires employer_member role
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── edit/page.tsx
│   │   │   │       └── applicants/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── company/page.tsx
│   │   │
│   │   ├── admin/                    — requires platform_admin role
│   │   │   ├── page.tsx                      — full dashboard [SHOULD]
│   │   │   ├── jobs/
│   │   │   │   └── review/
│   │   │   │       ├── page.tsx              — already built
│   │   │   │       ├── RawJobCard.tsx        — already built
│   │   │   │       └── actions.ts            — already built
│   │   │   ├── employers/page.tsx            — verification queue [MUST]
│   │   │   └── data-quality/page.tsx         — [SHOULD]
│   │   │
│   │   └── api/
│   │       ├── cron/
│   │       │   └── ingest-jobs/route.ts      — calls run-ingestion.ts
│   │       └── webhooks/
│   │           └── stripe/route.ts
│   │
│   ├── components/                   — shared, dumb/presentational UI only
│   │   ├── ui/                       — button, input, card, modal, etc.
│   │   ├── layout/                   — header, footer, mobile nav
│   │   └── search/                   — the reusable global job search bar
│   │
│   ├── features/                     — business logic, organized by domain
│   │   ├── jobs/
│   │   │   ├── queries.ts            — read functions (search, get by slug)
│   │   │   ├── actions.ts            — write server actions (save, apply-click)
│   │   │   └── match-score.ts        — the transparent weighted match logic
│   │   ├── resumes/
│   │   │   ├── upload.ts
│   │   │   ├── parse-review-actions.ts
│   │   │   └── types.ts
│   │   ├── careers/
│   │   │   └── queries.ts
│   │   ├── salaries/
│   │   │   └── queries.ts
│   │   ├── employers/
│   │   │   ├── verification-actions.ts
│   │   │   ├── job-post-actions.ts
│   │   │   └── applicant-actions.ts  — the applicant inbox status updates
│   │   └── alerts/
│   │       ├── actions.ts
│   │       └── delivery.ts           — the scheduled alert email job
│   │
│   ├── lib/                          — cross-cutting infrastructure
│   │   ├── supabase/
│   │   │   ├── client.ts             — browser client (already built above)
│   │   │   ├── server.ts             — server component/action client (built above)
│   │   │   └── service.ts            — service-role client (built above)
│   │   ├── ingestion/
│   │   │   ├── types.ts              — already built
│   │   │   ├── greenhouse-connector.ts — already built
│   │   │   └── run-ingestion.ts      — already built
│   │   ├── stripe.ts
│   │   ├── resend.ts
│   │   ├── posthog.ts
│   │   └── validation/               — shared Zod schemas
│   │       ├── job.ts
│   │       ├── profile.ts
│   │       └── job-post.ts
│   │
│   └── types/
│       └── database.ts               — generated via `supabase gen types typescript`
│
├── .env.example                      — already built above
├── package.json
└── tsconfig.json
```

## 2. Why `features/` and `lib/` are separate

- **`lib/`** — things that would exist regardless of what this specific product does: the Supabase clients, Stripe wrapper, email wrapper, generic validation helpers. If you swapped this for a different job board tomorrow, `lib/` barely changes.
- **`features/`** — things that only make sense because this *is* an aviation career platform: job search logic, resume parsing review, the match-score algorithm, employer verification. This is where the actual business value lives, and it's organized so "everything about resumes" is one folder, not scattered across four.
- **`components/`** stays dumb on purpose — a `<JobCard />` shouldn't know how to fetch a job, only how to render one it's given. Fetching happens in `features/jobs/queries.ts`, called from the `app/` route.

This mirrors the structure the original database architecture conversation specified — it's carried through consistently rather than reinvented here.

## 3. Which Supabase client, when

| Context | Client | Respects RLS? |
|---|---|---|
| Client Component (`"use client"`) | `lib/supabase/client.ts` | Yes — as the signed-in user |
| Server Component / Server Action / Route Handler | `lib/supabase/server.ts` | Yes — as the signed-in user |
| Scheduled job / cron (no user session) | `lib/supabase/service.ts` | No — bypasses RLS by design |
| Server action doing privileged admin work | `lib/supabase/service.ts`, but **only after** independently checking `has_role()` via the server-session client first | No — but gated by an explicit role check in application code |

**Housekeeping note:** the ingestion connector and admin approve/reject actions built earlier each define their own local `getServiceClient()` function inline. Now that `lib/supabase/service.ts` exists as the canonical version, those three files (`greenhouse-connector.ts`, `run-ingestion.ts`, `app/admin/jobs/review/actions.ts`) should import from it instead of keeping three copies of the same function in sync by hand. Small refactor, worth doing before the pattern gets copied a fourth time.

## 4. Server Actions vs. API Routes — decision rule

- **Default to Server Actions** for anything triggered by a form or button inside the Next.js app itself (save job, approve raw job, post a job, update application status). This is most of the app.
- **Use a Route Handler (`app/api/.../route.ts`) only when:**
  - It's a webhook target (Stripe) — external services need a real HTTP endpoint to call.
  - It's a scheduled cron target (`/api/cron/ingest-jobs`) — Vercel Cron hits a URL, not a server action.
  - It needs to return something that isn't a React response (e.g. a future public JSON API for partners — not needed in V1).

## 5. Naming conventions

- Routes: kebab-case folders matching the URL (`reset-password/`, not `resetPassword/`)
- Components: PascalCase files, one component per file (`RawJobCard.tsx`)
- Server actions / queries: camelCase functions, verbs first (`approveRawJob`, `getJobBySlug`, `saveJob`)
- Database-facing types: mirror the actual column names (snake_case) when representing a raw row; convert to camelCase only at the point where it becomes a component prop, so there's never ambiguity about whether a piece of data has been transformed yet.

## 6. Testing approach for V1

Don't over-build this yet — per the roadmap, prove the marketplace works before investing heavily in test infrastructure. Minimum viable coverage:
- Unit tests for `features/jobs/match-score.ts` (the weighted scoring logic) — this is exactly the kind of pure-function logic that's cheap to test and easy to silently break
- Unit tests for the ingestion connector's hashing/dedup logic
- No E2E suite for V1 — manual testing per the Step 11 "Internal Testing" checklist in the launch roadmap covers this at current scale; revisit once the codebase is large enough that manual regression testing becomes the bottleneck

## 7. Environments

```
LOCAL (supabase start, local Postgres via Docker)
      ↓
DEVELOPMENT (shared Supabase dev project, Vercel preview deploys)
      ↓
STAGING (mirrors production config, used for employer/job-seeker beta)
      ↓
PRODUCTION
```

Every schema change is a numbered migration file in `supabase/migrations/` — exactly the pattern already established. Never hand-edit a remote schema; `supabase db push` (or the CLI equivalent at deploy time) is the only path from local migration file to any non-local environment.

## 8. What's genuinely new in this document vs. already-built code

Three files are net-new here and should be added to the repo now: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/service.ts`, and `.env.example`. Everything else in the tree above is either a placement decision for code that already exists (migrations, ingestion, admin review) or an empty folder waiting for Step 4–9 of the build order to fill it in.
