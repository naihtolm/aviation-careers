# Getting Started: Sprint 0 + Your Role as Product Owner/QA

This is written for exactly the arrangement you described: Claude Code does the heavy lifting on code, you own the product and quality decisions. Nothing here assumes you'll write code yourself — it assumes you'll learn to read outcomes, ask good questions, and test like a real user.

---

## Part 1 — Accounts to create (all free to start)

Do these before opening Claude Code:

1. **GitHub** — github.com — where your code lives and its history is tracked
2. **Supabase** — supabase.com — your database, auth, and file storage
3. **Vercel** — vercel.com — where the live website will be hosted
4. **Stripe** — stripe.com — not needed until Sprint 6, but fine to create now
5. **Resend** — resend.com — email sending, needed by Sprint 5

You don't need to configure anything inside these yet — just have the accounts ready so Claude Code can walk you through connecting them when the time comes.

## Part 2 — Install Claude Code

Install it on your machine per Anthropic's setup instructions for your operating system. When you open it, you're in a terminal-like interface where you type in plain English what you want, and it writes/edits actual files on your computer.

---

## Part 3 — Sprint 0: A throwaway practice round

**Purpose:** learn to recognize what "working" looks like, and practice being the QA person, before any of it matters for the real business. If something goes wrong here, nothing is lost.

### Step 1 — Have Claude Code build something trivial

Open Claude Code in a new empty folder and give it a prompt like:

> "I'm brand new to coding. Set up a simple Next.js website with one page that says 'Hello, this is my test project.' Explain each step in plain English as you go, including what commands you're running and why."

### Step 2 — Your QA job: actually look at it

- Ask it: *"How do I see this running on my own computer?"*
- It'll tell you to run something and open a browser to `localhost:3000` or similar. **Do that. Look at the actual page.** This is the habit that matters most: never take "it should work now" at face value — open the browser and check.

### Step 3 — Push it to GitHub

> "Now help me push this to a new GitHub repository, explaining what git is and what each command does as we go."

**QA check:** go to github.com yourself afterward and confirm you can see the files there. Don't just trust that it happened.

### Step 4 — Deploy it live

> "Now deploy this to Vercel so it's live on the internet, and walk me through connecting my Vercel account to this GitHub repo."

**QA check:** open the live URL it gives you, on your phone even, and confirm the same page loads publicly.

### Step 5 — Break something on purpose

This is the most important step and the one people skip. Ask Claude Code:

> "Change the page to say something different, and show me how that change goes from my computer to the live site."

Watch the whole cycle happen once, end to end, so it's not mysterious anymore.

**You're done with Sprint 0 when:** you've personally seen a change go from an instruction you typed, to a file changing, to a live website updating — and you didn't just take Claude Code's word for any of those steps, you checked each one yourself.

---

## Part 4 — Moving to the real project (actual Sprint 1)

Once Sprint 0 feels familiar (give it a few days if needed, not one sitting), start the real build. Have all the documents we've produced together (the SQL migrations, the scope lock, the UI spec, the repo architecture, the sprint plan) saved somewhere you can paste from — a folder on your computer is fine.

Your first real prompt to Claude Code, roughly:

> "I'm building a real project called Aviation Careers. I have a complete database schema (10 SQL migration files), a locked feature scope, a repo architecture spec, and a sprint plan. I'm the product owner, not a developer — I need you to do the technical implementation and explain what you're doing in plain English, especially anywhere a wrong decision could affect real users' data. Let's start with Sprint 1: setting up the Supabase project and applying the migrations I have."

Then paste in the migration files and the repo architecture doc.

### Your QA checklist specifically for Sprint 1

This is the sprint with the highest "looks fine but isn't" risk, because it's about data access rules (RLS) that don't show up as a visible bug — they show up as a privacy problem nobody notices until it's bad. Concretely:

- **Ask Claude Code to create two test user accounts** in your dev Supabase project.
- **Ask it to show you, step by step, how to try to read User A's resume while logged in as User B.** It should fail. If it doesn't fail, that's a real problem, not a nitpick — say so and don't move on until it's fixed.
- Do the same check for saved jobs and applications — User B should never see User A's data.
- Confirm the ingestion pipeline actually pulls in real jobs (check the raw data in Supabase's table view yourself, don't just trust "it ran successfully").
- Confirm the admin review screen actually lets you approve a real job into the live `jobs` table, and that it then shows up when you query for it.

---

## Part 5 — Habits for working with Claude Code as PO/QA (ongoing, not just Sprint 0/1)

- **Ask it to explain, always, especially for anything touching money, auth, or user data.** "Explain what this does and why, like I'm new to this" is a completely reasonable thing to say every time.
- **Never accept "it works" as a QA report from itself.** Open the actual page, click the actual button, try the actual thing a real user would try — including trying to break it (wrong file type on upload, empty form submission, etc.).
- **Ask it to write tests for the risky logic**, specifically the match-score algorithm and anything RLS-related, per the sprint plan's testing section — then ask it to explain what the test actually checks, so you understand what "passing" means.
- **Keep a running list of things that confused you.** If a term or step didn't make sense, ask right then — don't let confusion stack up silently across sprints.
- **You decide what "done" means for each sprint**, using the Definition of Done we already wrote into the sprint plan — Claude Code can tell you it's finished, but you're the one checking it against that list before calling it done.

You're not learning to code. You're learning to be a demanding, hands-on product owner for a codebase you didn't write yourself — which is a completely normal and very buildable skill, and it's the actual job here.
