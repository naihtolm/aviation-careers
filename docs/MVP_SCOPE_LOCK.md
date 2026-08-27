# Aviation Careers — V1 Scope Lock

*Consolidates everything decided so far into one reference: what's actually shipping in V1, the tech stack, and the build/launch order. This is Deliverable 1 from the original roadmap — the document that should settle "is this in scope?" questions from here forward.*

---

## 1. MVP Scope

### MUST HAVE FOR LAUNCH

**Job Seeker**
- Account creation (email/password + Google), profile
- Resume upload (PDF/DOCX) → text extraction → AI parsing → user reviews/edits before it saves to profile
- Manual profile editing (experience, education, skills, certifications)
- Job search with aviation-specific filters (career category, location/radius, airport, employment type, experience level, salary, certifications, work arrangement)
- Job detail pages with Apply redirect (tracked, not claimed as a submitted application) and Save Job
- **Quick-apply autofill**: for external-redirect jobs, use the candidate's resume/profile data to pre-fill what we can and show them "here's what we'll be submitting" before they click through — reduces redirect friction without needing native submission or employer-side trust
- Application tracker (Interested → Applied → Interviewing → Offer → Rejected → Withdrawn), including the "did you apply?" follow-up prompt after a redirect
- Job alerts (saved search, daily/weekly email)
- Career pages, airport pages, company pages, salary pages — enough of each to be genuinely useful, not empty
- Basic transparent job-match score (weighted: certification, skills, experience, location) with an explanation, not just a number

**Employer**
- Employer account + company profile
- Employer verification (pending → approved)
- Post a job with a choice of external application URL **or** native apply
- **Native apply for self-posted jobs**: candidates who apply to a job an employer posted directly through the platform submit through us, not a redirect — since these employers already have a dashboard they're checking, there's no "application disappears into a void" risk
- **Minimal applicant inbox**: a table on the employer dashboard next to their jobs — applicant name, resume link, status dropdown. Not an ATS; just enough to see and act on what came in
- Manage jobs (active/paused/expired)
- Basic analytics (views, apply clicks)

**Platform / Data**
- Job ingestion pipeline (Greenhouse connector live; USAJOBS as the next one)
- Minimal admin review screen (approve/reject raw ingested jobs into `jobs`)
- Aviation career taxonomy with aliases (so "AMT," "A&P Mechanic," "Aircraft Mechanic" resolve to the same career)

### SHOULD HAVE (build if time allows, not launch-blocking)
- Featured/sponsored job placement (cheap to build — flag + sort order; also your early monetization test with beta employers)
- Search synonym/typo tolerance beyond career aliases
- Full admin platform (moderation queues, data-quality dashboard, careers/airports management UI) — the minimal version from Step 3 can carry V1 if this slips
- **Native-apply passthrough for ingested (Greenhouse/Lever) jobs, where that employer's board supports application submission via their API** — worth experimenting with in Phase 1.5, not launch-blocking, since support is uneven across employers and you won't always know until you try a given board

### POST-LAUNCH (Phase 1.5–2)
- SEO expansion (many more career/salary/airport/location pages)
- Improved recommendations using resume + search history
- Employer subscriptions, featured employer placement
- Career gap analysis / personalized roadmap
- Full career-matcher quiz flow

### FUTURE (Phase 3+)
- Native applications *for any employer regardless of source* — i.e. full ATS-style acceptance even for employers you haven't built a relationship with (self-posted-employer native apply is now in V1; see above)
- Employer talent search / resume database access
- Recruiter messaging
- Training marketplace
- Mobile apps
- Vector/semantic matching (pgvector)
- Aviation labor-market intelligence product

---

## 2. Tech Stack Recap

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Forms/validation | React Hook Form + Zod |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password + Google at launch) |
| Authorization | PostgreSQL Row Level Security + `has_role()` / `is_employer_member()` helpers |
| File storage | Supabase Storage (private `resumes` bucket, signed URLs) |
| Search (V1) | Postgres full-text search (`tsvector` + GIN) — no OpenSearch/Typesense yet |
| Geo search | PostGIS (added now, since airport/radius search is core to V1) |
| AI (V1) | Resume parsing + basic job classification/matching only — no semantic/vector matching yet |
| Payments | Stripe |
| Email | Resend |
| Error monitoring | Sentry |
| Product analytics | PostHog |
| Hosting | Vercel |
| Scheduled jobs | Vercel Cron (ingestion pipeline) |

Database schema and RLS policies for all of the above are already drafted as ordered SQL migrations (identity/roles, three-layer resume architecture, taxonomy, geography, companies, jobs+search, salary/training, notifications/analytics, functions/triggers, RLS).

---

## 3. Build Order / Launch Plan (revised)

1. **Business Foundation** — name, domain, brand, entity, revenue model
2. **Product Design** — sitemap, user flows, V1 feature list (this document), design system
3. **Technical Foundation** *(+ ingestion pipeline + minimal admin now run in parallel here, not at the end)* — GitHub, Next.js, Supabase, Auth, migrations, RLS, storage; Greenhouse connector wired to `raw_job_records`; bare-bones admin review screen live
4. **Public Website** — homepage, search, job detail, career/airport/company/salary pages — built and tested against real ingested job data from day one
5. **Job Seeker Accounts** — registration, login, profile, dashboard
6. **Resume Upload** — upload, storage, parsing, user review, profile population
7. **Personalization** — saved jobs, application tracker, job alerts, basic matching
8. **Employer Platform** — registration, verification, post job (external URL or native apply), manage jobs, minimal applicant inbox for native applications, analytics
9. **Full Admin Platform** — expands the Step 3 minimal tool into full moderation, verification workflow, data-quality dashboard
10. **Continue Populating** — breadth: more markets, more career categories, more companies (inventory has been accumulating since Step 3, so this is expansion, not a cold start)
11. **Internal Testing** — full job seeker / employer / admin flow testing
12. **Private Beta (job seekers)** — mechanics, students, pilots, ramp agents, flight attendants, airport employees
13. **Employer Beta** — small aviation companies, FBOs, MROs, ground handling, regional carriers, staffing agencies; **informal paid featured-listing test included here**
14. **V1 Public Launch** — SEO, LinkedIn, aviation Facebook groups, Reddit, forums, flight/A&P schools, industry partnerships, direct employer outreach

### Phase-gating thresholds (decide the *next* investment with data, not a vibe)

| Gate | Metric | Target to proceed |
|---|---|---|
| V1 → invest in V1.5 | Resume upload rate | ≥ 30–40% of registered users |
| V1 → invest in V1.5 | Week-2 return rate | ≥ 20% |
| V1.5 → Phase 2 (personalization) | Job alert creation rate | ≥ 15% of active users |
| Phase 2 → Phase 3 (recruiting platform) | Employers who've paid for a listing at least once | Meaningful repeat-paying count, not a one-off |
| Phase 3 → Phase 4 (talent marketplace) | Unprompted employer requests for candidate search | Recurring inbound, not survey interest |

Treat these as a first draft — revisit once you have ~30 days of real traffic.

---

## Where things stand right now

Completed: brand direction, product/feature spec, wireframe spec, V1 resume-uploader decision, full database schema + RLS, tech stack lock, revised launch roadmap, ingestion connector + minimal admin screen spec (code drafted), native-application scoping decision (quick-apply autofill + self-posted-employer native apply pulled into V1; full any-source native apply stays Phase 3+).

Not yet started: actually standing up the repo/Supabase project, picking real Greenhouse board tokens to seed ingestion, and the remaining build-documentation deliverables (screen-by-screen UI spec, full repo/code architecture, sprint plan).
