# Aviation Careers — Launch Roadmap v2
*(Revised build order: job inventory pipeline and minimal admin tooling moved earlier, concrete phase-gating thresholds added, early monetization test added)*

## What changed from v1

| Change | Why |
|---|---|
| Job ingestion pipeline moved from Step 10 to run **in parallel with Step 3–4** | A job board with zero jobs can't be meaningfully tested or demoed. Data needs to be flowing before the frontend is even done. |
| Split "Admin Platform" into **Minimal Admin** (parallel with Step 4) and **Full Admin Platform** (still Step 9) | The moment any job data exists, someone needs to review/fix/kill duplicates — waiting until Step 9 means steps 4–8 happen blind. |
| Added explicit **phase-gating thresholds** to Phase 1.5 → Phase 2 transition | "Study behavior" isn't a decision rule. A real business needs a number that says go/no-go, not a vibe. |
| Added **early informal monetization test** during Step 13 (Employer Beta) | Featured placement is cheap to build. Real willingness-to-pay signal in the first beta round is more valuable than waiting for a dedicated V1.5 milestone. |

Everything else from the original roadmap (overall phase structure V1 → V1.5 → V2 → V3 → V4 → V5, the V1 feature scope, the deliverable order for build documentation) is unchanged — that sequencing was sound.

---

## Revised Build Order

### STEP 1 — Business Foundation
- Finalize name, domain, brand identity
- Set up the business entity
- Define initial revenue model (free for job seekers; employer-paid listings)

### STEP 2 — Product Design
- Finalize sitemap, user flows, V1 feature list
- Create design system, high-fidelity screens

### STEP 3 — Technical Foundation *(now includes ingestion + minimal admin scaffolding)*
- GitHub, Next.js, Supabase, Auth, Database, Migrations, Roles, RLS, Storage
- **NEW: stand up the job ingestion framework now** — `job_ingestion_sources` + `raw_job_records` tables already exist in the schema; wire up at least one real connector (Greenhouse and/or USAJOBS are the easiest legitimate starting points) so raw job data starts landing in the database while the frontend is still being built
- **NEW: build the bare-minimum admin screen now** — just enough to list ingested/raw jobs, approve or reject them into `jobs`, and flag obvious duplicates. This can be ugly. It does not need auth roles beyond "is platform_admin" and does not need the moderation queue UI from Step 9.

### STEP 4 — Build the Public Website *(now runs against real, flowing job data)*
- Homepage, Navigation, Job Search, Job Results, Job Detail
- Career Pages, Airport Pages, Company Pages, Salary Pages
- Because Step 3's ingestion pipeline is already running, these pages are being built and tested against real jobs from day one instead of empty states or fake seed data.

### STEP 5 — Build Job Seeker Accounts
- Registration, Login, Profile, Preferences, Dashboard

### STEP 6 — Build Resume Upload
- Upload, Storage, Processing, Text Extraction, AI Parsing, User Review, Profile Population

### STEP 7 — Build Personalization
- Saved Jobs, Application Tracker, Job Alerts, Basic Job Matching, Recommendations

### STEP 8 — Build Employer Platform
- Employer Registration, Company Profile, Verification, Post Job, Manage Jobs, Analytics
- By this point the minimal admin tool from Step 3 already handles employer-submitted jobs the same way it handles ingested ones — no separate review path needed to be invented late.

### STEP 9 — Build Full Admin Platform *(expands on the Step 3 minimal version, doesn't start from scratch)*
- Full moderation queues, employer verification workflow, careers/airports management, data-quality dashboard, platform analytics
- Everything built here is additive to the bare-bones job review screen that's already been in daily use since Step 3 — so admin tooling has effectively been tested in production for the entire build, not shipped untested at the end.

### STEP 10 — Continue Populating the Platform
- No longer "Step 10 starts population from zero" — by this point job inventory, career data, airport data, and salary data have been accumulating since Step 3. This step is now about **breadth**: expanding market coverage, adding remaining career categories, filling in secondary airports/companies.

### STEP 11 — Internal Testing
- Same as before: full job seeker, employer, and admin flow testing — but now testing against a database that already has real jobs and has already caught most data-quality issues along the way, so this step is verifying UX and correctness, not discovering that the ingestion pipeline doesn't work.

### STEP 12 — Private Beta (Job Seekers)
- Same target groups (mechanics, students, pilots, ramp agents, flight attendants, airport employees)
- Same success questions (do they find jobs, upload resumes, save jobs, return, create alerts)

### STEP 13 — Employer Beta *(now includes an informal paid-placement test)*
- Recruit small aviation companies, FBOs, MROs, ground handling, regional carriers, staffing agencies
- **NEW: informally offer paid featured/pinned placement to this beta group** — doesn't need to be a polished self-serve product, can be "pay $99, we'll pin your listing manually." The goal is a real willingness-to-pay signal before the public launch, not just "would they post a free job."
- Original questions still apply: can they post easily, do they see value, do they get traffic

### STEP 14 — V1 Public Launch
- Unchanged: SEO/Google, LinkedIn, aviation Facebook groups, Reddit, forums, aviation/A&P/flight schools, industry partnerships, direct employer outreach

---

## Phase-Gating Thresholds (new)

The original plan said Phase 1.5 should "study" signup rate, resume upload rate, saves, alerts, etc. That's the right list of signals but not a decision rule. Before launch, lock in actual numbers so a phase transition is a data decision, not a feeling. Suggested starting thresholds to lock in and revisit once you have your first real numbers (these are reasonable initial targets, not guarantees — treat them as a first draft to sanity-check against actual traffic once you see it):

| Gate | Metric | Suggested threshold to proceed |
|---|---|---|
| V1 → V1.5 investment | Resume upload rate among registered users | ≥ 30–40% |
| V1 → V1.5 investment | Week-2 return rate | ≥ 20% |
| V1.5 → Phase 2 (personalization build-out) | Job alert creation rate among active users | ≥ 15% |
| V1.5 → Phase 2 | Search-to-save conversion | Meaningfully above your first-month baseline (track the baseline, then set the real target) |
| Phase 2 → Phase 3 (recruiting platform) | Number of employers who've paid for a featured/paid listing at least once | A number you're comfortable justifies recruiter-tool investment (e.g., a double-digit count of repeat-paying employers) |
| Phase 3 → Phase 4 (talent marketplace) | Employers requesting candidate search/database access unprompted | Recurring inbound requests, not just survey interest |

These numbers should be treated as a first draft — revisit them once you have even 30 days of real traffic, since guessing thresholds before you have any usage data is itself a guess worth checking.

---

## Net effect of these changes

The core insight driving all three revisions is the same: **don't let any part of the system go untested until "launch."** Job data, admin tooling, and monetization willingness should all be exercised continuously from early in the build, not bolted on right before going public. That turns Steps 11–14 (internal testing, betas, launch) from "first time everything gets used together" into "confirming what's already been running."
