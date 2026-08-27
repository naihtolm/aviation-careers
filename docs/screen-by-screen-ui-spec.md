# Aviation Careers — V1 Screen-by-Screen UI Specification

Implementation-level detail for every screen in the locked V1 scope: route, access level, data sources (tied to the actual schema), components, states, and what each user action actually triggers. This is the document a developer should be able to build directly from, without re-deriving decisions already made.

Legend: **[MUST]** = must-have for launch, **[SHOULD]** = should-have, build if time allows.

---

## PUBLIC

### Homepage
- **Route:** `/`
- **Access:** Guest
- **Data:** Featured jobs (`jobs` where `status = 'active'`, recent, limit ~6), career categories (`career_categories`), featured companies (`companies` where `status = 'active'`, curated/highest job count), popular airports (`airports` + job counts)
- **Components:** Global search bar (career/keyword + location autocomplete), career category cards, featured job cards, airport explorer (static map or list — see note), featured employer cards, career guide teasers
- **States:** No special states beyond normal loading skeletons — this page should never be empty even on day 1 since ingestion runs from Step 3
- **Actions:** Search submit → `/jobs?keyword=...&location=...`; category card click → `/jobs?career_category=<slug>`; airport click → `/airports/<code>`
- **Note:** **Decided:** build the lightweight Mapbox GL integration (static markers only, no routing/navigation) rather than defaulting to a plain list. At V1 traffic levels this sits comfortably inside Mapbox's free tier (50K map loads/month, no card required to start) and is roughly a day of engineering effort for someone who's touched a maps SDK before — cheap enough not to defer. If the specific week this gets built is bandwidth-constrained, the plain top-10-airports list remains an acceptable fallback, but it's no longer the default plan.

### Job Search Results **[MUST]**
- **Route:** `/jobs`
- **Access:** Guest
- **Data:** `jobs` joined to `companies`, `careers`, `job_locations`→`airports`, `job_compensation` — filtered via query params, full-text search via the `search_vector` GIN index for the keyword field
- **Components:** Search bar (sticky on scroll), filter panel (category, location/radius via PostGIS, airport, employment type, experience level, salary range, certifications, work arrangement), sort dropdown, job card list, pagination/infinite scroll
- **States:**
  - Loading: skeleton cards
  - No results: "We couldn't find any exact matches" + suggestions to broaden filters + related jobs
  - Error: generic retry state
- **Actions:** Filter change → re-query (client-side query param update, server component re-render); Save Job icon (if signed in) → `saved_jobs` insert; if not signed in → prompt sign-up modal; job card click → `/jobs/[slug]`
- **Mobile:** filters open in a bottom sheet, not inline panel

### Job Detail **[MUST]**
- **Route:** `/jobs/[slug]`
- **Access:** Guest (Apply/Save require sign-in)
- **Data:** Single `jobs` row + `job_compensation`, `job_requirements`, `job_skills`, `job_certifications`, `job_locations`; similar jobs (same `career_id`, excluding self)
- **Components:** Job header (title, company, location, salary, employment type), sticky apply panel (desktop), description/responsibilities/requirements sections, "Am I Qualified?" match card, similar jobs list
- **States:** Standard loading/error; a job that's expired or paused should 404/redirect rather than render
- **Actions (this is where the native-apply decision lives):**
  - If `jobs.application_type = 'external_url'`: **Apply Now** → confirmation modal ("You'll be redirected to the employer's site") → log `job_events(event_type='apply_click')` → redirect. If the user has a resume/profile, show a **quick-apply preview** first: "Here's what we'll help you submit" (name, contact, resume attached) before the redirect confirmation — this is the quick-apply autofill feature, not a native submission.
  - If `jobs.application_type = 'platform_application'` (native — only possible for self-posted employer jobs per the V1 decision): **Apply Now** opens an in-page application flow (see Native Apply Flow below) instead of redirecting.
  - **Save Job** → `saved_jobs` insert (prompts sign-in if guest)
  - **Check My Match** → opens match score card (see Job Match Card below)

### Native Apply Flow **[MUST — self-posted employer jobs only]**
- **Trigger:** Apply Now on a job with `application_type = 'platform_application'`
- **Screens:** A short in-page flow, not a redirect:
  1. Confirm profile/resume being submitted (same data as quick-apply preview)
  2. **Screening questions (decided format):** up to 3 employer-defined questions, each one of three structured types — Yes/No, short free text, or multiple choice (2–5 employer-defined options). No file upload (resume is already attached) and no long-form/essay fields or branching logic — there's no usage data yet to justify a more complex question builder. Questions and answers store as JSONB on the application (same pattern already used for `job_alerts.filters`), not a new normalized table, until real usage tells us what that schema should look like. These render on the *same screen* as the submission confirmation, not a separate step — the entire point of native apply is less friction than a redirect, so this stays a single scroll, not a wizard.
  3. Submit → creates `job_applications` row with `status = 'applied'`, `source = 'platform'`, and — separately from the applications schema — a record the employer's applicant inbox can see
  4. Confirmation screen: "Your application was sent to [Company]." This is the one case where V1 can honestly claim a submitted application rather than just tracking a click.

### Job Match Card **[MUST]**
- Not a separate route — a modal/panel on the job detail page
- **Data:** Compares the signed-in user's `user_skills`, `user_certifications`, `job_seeker_profiles` (location, experience via `user_experience`) against `job_requirements`/`job_skills`/`job_certifications` for this job
- **Logic (V1, transparent weighting, no ML):** Certification match 35%, required skills 25%, experience 20%, location 10%, salary alignment 5%, career interest 5% — same weights as the original spec
- **Display:** Score 0–100%, then explicit checklist (✓ met / ⚠ missing) distinguishing `requirement_type = 'required'` from `'preferred'` — never imply someone is qualified for a regulated role if a required certification is missing

### Career Directory **[MUST]**
- **Route:** `/careers`
- **Data:** `career_categories` + `careers` (active only), with job counts per career
- **Components:** Category filter chips, search-careers input, career cards (median salary, training time, "$100K potential" badge if applicable)

### Career Detail **[MUST]**
- **Route:** `/careers/[slug]`
- **Data:** `careers` + `career_content` + `salary_aggregates` (for the snapshot) + `career_certification_requirements` + `career_progression` + related `training_programs` + current `jobs` for this career
- **Components:** Career snapshot stat grid, sticky sub-nav (Overview | Salary | Requirements | Training | Career Path | Jobs), "How to Become One" numbered steps, career progression ladder, jobs list at bottom, sources/attribution footer (BLS, FAA, etc.)
- **States:** If `career_content` isn't published yet for a career that has `careers.active = true`, show the snapshot stats only with a lighter-weight "detailed guide coming soon" — never a blank page

### Career Comparison **[SHOULD]**
- **Route:** `/compare?a=<slug>&b=<slug>`
- Side-by-side table pulling the same fields two career pages use; not launch-blocking per scope lock

### Salary Explorer **[MUST]**
- **Route:** `/salaries`
- **Data:** Career + location pickers feeding into `/salaries/[career]/[location]`

### Salary Detail **[MUST]**
- **Route:** `/salaries/[career-slug]/[location-slug]`
- **Data:** `salary_aggregates` (primary read — never compute percentiles live on request) joined to `careers` and `locations`
- **Components:** Range visualization (p10/p25/median/p75/p90), confidence indicator (High/Medium/Limited based on `confidence_score`), salary calculator widget, related jobs
- **States:** Low `sample_size` → show "Limited data" confidence badge explicitly rather than a falsely precise number

### Salary Calculator **[MUST]**
- Embeddable widget on salary pages, not necessarily its own route — hourly rate, hours/week, OT hours/multiplier, bonus → estimated annual, pure client-side math, no DB write

### Airport Directory **[MUST]**
- **Route:** `/airports`
- **Data:** `airports` (active) + job counts + employer counts
- **Note:** Same Mapbox GL map decision as the homepage — static markers, no routing. Reuse the same map component rather than building it twice.

### Airport Detail **[MUST]**
- **Route:** `/airports/[code]`
- **Data:** `airports` + `company_airports`→`companies` + jobs at that airport (`job_locations.airport_id`)
- **Components:** Tabs (Jobs | Employers | Salaries | Careers)

### Company Detail **[MUST]**
- **Route:** `/companies/[slug]`
- **Data:** `companies` + active jobs + `company_airports`
- **Components:** Overview, tabs (Overview | Jobs | Locations), verified badge if `verification_status = 'approved'`
- **Note:** A full company *directory* page is **[SHOULD]** for V1 — company pages are reachable from job/airport pages even without a dedicated browse page.

---

## AUTHENTICATION & ONBOARDING **[MUST]**

### Sign Up / Sign In / Password Reset
- Standard Supabase Auth flows (email/password + Google). No custom spec needed beyond matching the design system.

### Onboarding
- **Route:** `/onboarding`
- **Trigger:** First login after sign-up, gated on `profiles.onboarding_completed = false`
- **Steps:** Career interest (multi-select against `career_categories`) → location → experience level → certifications (optional at this stage) → salary goal → done
- **On completion:** sets `onboarding_completed = true`, creates/updates `job_seeker_profiles`, redirects to `/dashboard`
- **Resume upload is intentionally NOT forced into onboarding** — it's a prominent dashboard CTA instead, since making it a gate before someone sees any value adds friction the roadmap is trying to avoid. (Worth reconsidering post-launch if resume upload rate lags the 30–40% threshold.)

---

## JOB SEEKER DASHBOARD **[MUST]**

### Dashboard Home
- **Route:** `/dashboard`
- **Data:** Recommended jobs (basic matching against profile), saved jobs count, applications summary by status, active alerts, profile completion %
- **Components:** Profile completion bar with a specific next-step suggestion (e.g. "Add your certifications to improve your matches"), recommended job cards, quick links to saved/applications/alerts

### Profile
- **Route:** `/dashboard/profile`
- **Data:** `job_seeker_profiles`, `user_experience`, `user_education`, `user_skills`, `user_certifications`
- **Components:** Editable sections per table above; visibility control for `profile_visibility` (private/employers/public — defaults private)

### Resume
- **Route:** `/dashboard/resume`
- **Flow:** Upload (PDF/DOCX) → `resumes` row created, `upload_status = 'uploaded'` → background processing (`resume_processing_jobs`) → parse result (`resume_parses.structured_data`) → **review screen**: "We found this information from your resume — review before saving" with per-field Approve/Edit/Delete → confirmed data writes into `user_experience`/`user_education`/`user_skills`/`user_certifications` with `source = 'resume'`
- **States:** Processing (spinner + "this usually takes under a minute"), failed (clear retry + manual-entry fallback so a parse failure never blocks profile completion), completed
- **Note:** The original file is never overwritten by AI output — this screen edits the *profile* tables, not the resume file or raw parse.

### Saved Jobs
- **Route:** `/dashboard/saved`
- **Data:** `saved_jobs` joined to `jobs`
- **States:** Empty state — "No saved jobs yet" + CTA to browse jobs, never a blank screen

### Applications
- **Route:** `/dashboard/applications`
- **Data:** `job_applications` grouped by `status`
- **Components:** Status columns/counts, per-application notes field, manual status update
- **Note:** For native-apply submissions, `status` starts at `'applied'` automatically; for redirect-tracked jobs, status only reaches `'applied'` after the user confirms "yes, I applied" to the post-redirect prompt.

### Job Alerts
- **Route:** `/dashboard/alerts`
- **Data:** `job_alerts`
- **Components:** List of saved alerts with edit/pause, "create new alert" form (keyword, location, frequency)

---

## EMPLOYER **[MUST unless noted]**

### Employer Landing
- **Route:** `/employers`
- Marketing page: value props, "Post a Job" CTA → employer sign-up

### Employer Sign Up + Verification
- **Route:** `/employers/sign-up`, status shown at `/employer/verification`
- **Data:** Creates `companies` (status='pending') + `employer_organizations` + `employer_members` (role='owner') + `company_verifications` row
- **States:** Pending / Approved / Rejected / Needs Information — clear messaging at each stage since a pending employer can't post live jobs yet

### Employer Dashboard
- **Route:** `/employer/dashboard`
- **Data:** Active jobs count, total views, apply clicks, (native) applicant count — all from `job_daily_metrics` rollups, not live event queries

### Post a Job
- **Route:** `/employer/jobs/new` (multi-step)
- **Steps:** Basics (title, career, employment type) → Location (city/state/airport, work arrangement) → Compensation (min/max, public toggle) → Requirements (skills/certs/education/experience) → **Application method: External URL or Native Apply** (this choice sets `jobs.application_type`) → *if Native Apply:* optional screening questions (up to 3, Yes/No / short text / multiple choice — see Native Apply Flow) → Description → Preview → Publish
- **Note:** If Native Apply is chosen, a short prompt explains: "Applications will appear in your Applicants tab — make sure someone on your team checks it regularly." Setting expectations here matters more than any UI polish, given the failure mode we're explicitly avoiding (applications going unseen).

### Manage Jobs
- **Route:** `/employer/jobs`
- **Data:** `jobs` filtered to the employer's `company_id`, tabs for Active/Draft/Expired/Archived

### Applicant Inbox **[MUST — new, tied to native apply decision]**
- **Route:** `/employer/jobs/[id]/applicants`
- **Access:** Only exists/is reachable for jobs where `application_type = 'platform_application'`
- **Data:** `job_applications` for this job, joined to the applicant's public-facing profile fields (resume link via signed URL, not raw file access — respects `profile_visibility`)
- **Components:** Simple table — applicant name, applied date, resume link, status dropdown (interested/applied/interviewing/offer/rejected — mirrors the seeker-side `application_status` enum so both sides see consistent stages)
- **Explicitly not built:** messaging, bulk actions, ATS pipeline stages beyond the existing status enum — this is intentionally the "minimal inbox," not a recruiting product

### Employer Analytics
- **Route:** `/employer/analytics`
- **Data:** `job_daily_metrics` aggregated over a date range, top jobs, top locations

### Company Profile
- **Route:** `/employer/company`
- Edit the public-facing `companies` row (logo, description, locations)

---

## ADMIN

### Minimal Job Ingestion Review **[MUST — already specced/built, listed here for completeness]**
- **Route:** `/admin/jobs/review` — see the dedicated ingestion + admin spec for full detail

### Full Admin Dashboard **[SHOULD]**
- **Route:** `/admin`
- Overview stats: active jobs, active users, pending employers, revenue — can be a simple query-driven page, doesn't need to be built before launch if the minimal review screen is holding V1 together

### Admin Job Management **[SHOULD]**
- **Route:** `/admin/jobs`
- Broader version of the review screen: search/filter across all statuses, not just pending ingestion

### Admin Employer Verification **[MUST]**
- **Route:** `/admin/employers`
- **Data:** `company_verifications` where `status = 'pending'`
- This one can't slip to should-have — employers can't post live jobs without it, and it's a small screen (list + approve/reject/request-info, mirrors the raw job review pattern already built)

### Admin Data Quality **[SHOULD]**
- **Route:** `/admin/data-quality`
- Salary/location/certification completeness %, stale job counts — valuable but not launch-blocking; the minimal review screen already prevents most bad data from reaching `jobs` in the first place

### Admin User Management **[Phase 1.5]**
- Not needed for a launch with a small user base; add once support/moderation volume justifies it

---

## Cross-cutting notes

- **Every list screen needs an explicit empty state** (saved jobs, applications, alerts, applicant inbox, admin queues) — never a blank div. This was true in the original spec and remains true here.
- **Every action that writes data should optimistically update the UI** where the write is low-risk (save job, alert pause/resume) and wait for confirmation where it's higher-stakes (job application submission, employer job publish).
- **Signed URLs, not public paths, for any resume access** — this applies to the seeker-facing resume screen and the new employer applicant inbox alike.
- **Mobile bottom nav** (Home / Jobs / Explore / Saved / Profile) applies to the job-seeker experience; employer and admin screens are dashboard-oriented and can assume desktop-first use without a bespoke mobile nav in V1.

## Decisions locked since the first draft

Both open questions from the first draft of this spec are now settled:
1. **Airport map:** build the Mapbox GL integration (static markers, no routing) — cheap enough at V1 traffic (free tier covers it) and roughly a day of engineering effort, so it's the default plan rather than a stretch goal.
2. **Native-apply screening questions:** up to 3 questions per job, each Yes/No, short free text, or multiple choice — no file upload, no branching, stored as JSONB, rendered on the same screen as the application confirmation.
