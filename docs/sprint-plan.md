# Aviation Careers — V1 Development Sprint Plan

Turns everything locked so far (scope, schema, UI spec, repo architecture) into an actual build sequence. Sprint numbers match the original 9-sprint outline from the roadmap, but the *content* of Sprints 1–2 reflects the revised build order — ingestion and minimal admin are no longer end-of-project tasks.

**Assumptions:** sprints are ~2 weeks each, sized for a small team (1–3 developers). Treat the week counts as a starting estimate to sanity-check against your actual team's velocity after Sprint 1, not a fixed commitment — the point of the phase-gating thresholds in the scope-lock doc is that reality, not this plan, decides what happens after Sprint 9.

---

## Sprint overview

| Sprint | Focus | Builds on |
|---|---|---|
| 1 | Foundation + Ingestion + Minimal Admin | Migrations, ingestion connector, admin review screen (already drafted) |
| 2 | Public Website | Real job data flowing from Sprint 1 |
| 3 | Auth + Job Seeker Accounts | Sprint 1 identity/roles tables |
| 4 | Resume Upload + Parsing | Sprint 3 accounts |
| 5 | Personalization | Sprint 2 jobs + Sprint 3/4 profile data |
| 6 | Employer Platform (incl. native apply, applicant inbox, and employer verification queue) | Sprint 1 minimal admin pattern, Sprint 2 job model |
| 7 | Full Admin Platform (should-have only, nothing launch-blocking remains here) | Expands Sprint 1's minimal admin |
| 8 | Populate + Test + Beta | Everything above |
| 9 | Launch | Everything above |

---

## SPRINT 1 — Foundation + Ingestion + Minimal Admin

**Goal:** A working Supabase project with the full schema applied, RLS active, one real job feed flowing into the database, and a human able to review/approve those jobs — before any public-facing page exists.

**Tasks:**
- Stand up GitHub repo using the structure from `REPO_ARCHITECTURE.md`
- Create Supabase project (dev environment); apply migrations `001`–`010` in order
- Verify RLS policies actually block/allow as expected (manual spot-check: can a fresh user read another user's `resumes` row? should fail)
- Wire up `lib/supabase/client.ts`, `server.ts`, `service.ts`
- Configure `.env.local` from `.env.example`
- Get a real Greenhouse board token for at least one aviation-adjacent employer; wire `ingestGreenhouseBoard` end-to-end and confirm rows land in `raw_job_records`
- Set up the Vercel Cron job hitting `/api/cron/ingest-jobs`
- Build the minimal admin review screen (`/admin/jobs/review`) — already drafted, so this sprint is "get it running against a real Supabase project," not "design it from scratch"
- Manually approve a handful of real ingested jobs into `jobs` through that screen

**Definition of done:** at least one real employer's jobs exist in the `jobs` table, having gone through the actual ingestion → review → approve pipeline, not seed data.

**Watch item:** don't let "find good Greenhouse boards" become a research rabbit hole — pick 2–3 plausible aviation-adjacent companies, confirm they publish via Greenhouse, and move on. Breadth of sources is a Sprint 8 concern, not a Sprint 1 one.

---

## SPRINT 2 — Public Website

**Goal:** Homepage, job search, job detail, and the career/airport/company/salary pages — built and tested against the real jobs Sprint 1 produced.

**Tasks:**
- Global layout: header, footer, mobile nav shell (`components/layout/`)
- Reusable global search bar component (`components/search/`)
- Homepage (`app/(marketing)/page.tsx`) — including the Mapbox airport widget (decided: build it, don't defer)
- Job search results (`app/jobs/page.tsx`) — full-text search against `search_vector`, filter panel, PostGIS radius search
- Job detail (`app/jobs/[slug]/page.tsx`) — including the quick-apply preview for external-URL jobs (native-apply branch comes in Sprint 6 once employer accounts exist, but the conditional in the UI should already check `application_type` now so Sprint 6 isn't retrofitting this page)
- Career directory + detail pages, reading from `careers`/`career_content`/`salary_aggregates`
- Salary explorer + detail pages, salary calculator widget
- Airport directory + detail pages (reuses the Sprint 2 Mapbox component)
- Company detail pages

**Definition of done:** someone can land on the homepage, search for a real aviation job, and read a full job detail page — entirely from data that came through the Sprint 1 ingestion pipeline.

---

## SPRINT 3 — Auth + Job Seeker Accounts

**Goal:** Real accounts, not just a schema that supports them.

**Tasks:**
- Supabase Auth wiring: email/password + Google, using `handle_new_user()` trigger already defined in migration 009
- Sign up / sign in / password reset pages
- Onboarding flow (`app/(auth)/onboarding/page.tsx`) — career interest, location, experience, salary goal; writes to `job_seeker_profiles`
- Dashboard shell (`app/dashboard/page.tsx`) with profile completion indicator
- Profile edit page — experience, education, skills, certifications (manual entry only this sprint; resume-driven population is Sprint 4)

**Definition of done:** a new user can sign up, complete onboarding, and manually build out a profile.

---

## SPRINT 4 — Resume Upload + Parsing

**Goal:** The feature explicitly promoted to V1 — upload, processing, and the review-before-save flow.

**Tasks:**
- Resume upload UI (`app/dashboard/resume/page.tsx`) — PDF/DOCX to Supabase Storage private `resumes` bucket
- `resumes` row creation + `resume_processing_jobs` queue entry
- Text extraction + AI parsing pipeline (background job — Edge Function or a queue worker, per the async architecture from the DB spec)
- `resume_parses.structured_data` populated
- Review screen: "we found this — approve/edit/delete per field" — writes confirmed data into `user_experience`/`user_education`/`user_skills`/`user_certifications` with `source = 'resume'`
- Failure-state handling: parse failure falls back cleanly to manual entry, never blocks the user

**Definition of done:** a real resume, uploaded by a test user, results in a reviewable, editable profile — and the original file is never overwritten by the parse.

---

## SPRINT 5 — Personalization

**Goal:** The features that make someone come back.

**Tasks:**
- Save job (button + `saved_jobs` table), saved jobs dashboard page
- Application tracker: status pipeline, the post-redirect "did you apply?" prompt, applications dashboard page
- Job alerts: create/edit/pause, `job_alerts.filters` JSONB, and the scheduled delivery job (query saved filters → find new matches → email via Resend → update `last_sent_at`)
- Basic job match score (`features/jobs/match-score.ts`) — the transparent weighted logic, surfaced as the "Check My Match" card on job detail

**Definition of done:** a returning user sees jobs recommended based on their actual profile, not a static list, and gets an alert email when a new matching job appears.

---

## SPRINT 6 — Employer Platform (including native apply)

**Goal:** Employers can register, get verified, post jobs — via external URL or native apply — and see who applied.

**Tasks:**
- Employer registration + company profile creation (`companies`, `employer_organizations`, `employer_members`)
- Verification submission flow + status page
- **Admin employer verification queue** (`/admin/employers`) — **pulled forward from Sprint 7.** Mirrors the approve/reject pattern already built for raw jobs in Sprint 1. This ships in the same sprint as employer registration so no beta employer sits stuck in "pending" waiting on a screen that hasn't been built yet.
- Post-a-job multi-step flow, including the application-method choice (external URL vs. native apply) and, if native, the up-to-3 screening questions (Yes/No, short text, multiple choice)
- Manage jobs page (active/paused/expired)
- **Applicant inbox** (`/employer/jobs/[id]/applicants`) — only reachable for native-apply jobs; simple table with status dropdown mirroring the seeker-side application status enum
- Native apply flow on the job-seeker side (`app/jobs/[slug]` — the branch stubbed in Sprint 2 gets its real implementation now): confirm profile/resume → screening questions on the same screen → submit → confirmation
- Basic employer analytics (views, apply clicks, from `job_daily_metrics`)

**Definition of done:** an employer can register, get verified through the admin queue (not stuck pending), post a job with native apply enabled, a job seeker can apply without leaving the site, and the employer can see and act on that application.

---

## SPRINT 7 — Full Admin Platform

**Goal:** Expand Sprint 1's minimal admin tool into what launch actually requires — this sprint is additive, not a rewrite.

**Tasks:**
- Broader job management view (`/admin/jobs`) — search/filter across all statuses, not just pending ingestion — **should-have**, can slip if time is tight since the Sprint 1 review screen still covers the core loop
- Data quality dashboard — **should-have**
- Full admin overview stats — **should-have**

**Definition of done:** this entire sprint is now should-have — employer verification (the one launch-blocking piece that used to live here) shipped in Sprint 6 instead. Everything in Sprint 7 is a bonus if time allows; nothing here blocks moving to Sprint 8.

---

## SPRINT 8 — Populate + Test + Beta

**Goal:** Go from "it works" to "real aviation people have used it and told us what's broken."

**Tasks:**
- Expand job inventory breadth: more Greenhouse boards, evaluate adding the USAJOBS connector, more markets beyond the initial DFW focus if ready
- Fill in remaining career/airport/company content pages with real, useful (not placeholder) content
- Full internal testing pass: every flow in the UI spec, job seeker + employer + admin
- Private beta: recruit real aircraft mechanics, students, pilots, ramp agents, flight attendants, airport employees per the roadmap's beta target list
- Employer beta: small aviation companies, FBOs, MROs, ground handling, regional carriers, staffing agencies — **and the informal paid featured-listing test** ("pay $99, we'll pin it manually") for a real willingness-to-pay signal before public launch
- Track the actual phase-gating metrics from day one of beta (resume upload rate, week-2 return, alert creation rate) so there's real data by the time Sprint 9 launch decisions get made

**Definition of done:** documented answers to the beta questions from the roadmap (can users find jobs, do they upload resumes, do they return; can employers post easily, do they see value, would they pay) — not just "beta happened."

---

## SPRINT 9 — Launch

**Goal:** Public availability, with channels ready before the announcement, not scrambled together after.

**Tasks:**
- Fix whatever Sprint 8 beta surfaced as the highest-friction issues
- Production environment cutover, DNS, final Stripe/Resend/Sentry/PostHog production keys
- Launch channel prep: SEO basics confirmed live, LinkedIn presence, aviation Facebook groups/Reddit/forums identified, flight/A&P school outreach drafted, initial direct employer outreach list built
- Go live

**Definition of done:** the site is public, and the Days 1–30 focus areas from the roadmap (bug fixes, search quality, resume upload conversion, onboarding friction) have an owner and a way to measure them from day one — not something figured out after launch day.

---

## Cross-sprint risks worth naming now

- **Resume parsing (Sprint 4) is the single most technically uncertain item in this plan.** Text extraction quality varies a lot across resume formats. If it's taking longer than expected, the fallback is already built into the design — manual profile entry never blocks on it — so slipping this sprint's timeline shouldn't cascade into blocking Sprint 5.
- **~~Employer verification dependency~~ — resolved.** The verification queue now ships in Sprint 6 alongside employer registration, so no beta employer sits stuck in "pending" waiting on a Sprint 7 screen. Sprint 7 is entirely should-have as a result — worth confirming that stays true as Sprint 6 gets built out, since the whole point of this change was removing a hard blocker from the beta timeline.
- **Native apply (Sprint 6) is the feature most likely to get scope-crept.** The spec is intentionally minimal (3 questions, 3 types, no messaging). Resist adding "just one more field" during this sprint — that's exactly the kind of expansion the roadmap's phase-gating is designed to prevent happening by accident. Sprint 6 is now also carrying the verification queue on top of this, so it's worth watching that this sprint doesn't quietly become the biggest one in the plan — if it's overloaded, verification is the one piece safe to hold back to Sprint 7 without reintroducing the stuck-pending problem, since by then at least beta can start with a couple of employers verified manually via direct DB access if truly necessary.
