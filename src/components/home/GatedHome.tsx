import { SearchBar } from "@/components/search/SearchBar";
import { TeaserJobCard } from "@/components/jobs/TeaserJobCard";
import { GateButtons } from "@/components/auth/GateButtons";
import { Reveal } from "@/components/ui/Reveal";

// What a signed-out visitor sees: real hero, real stats, a handful of
// real teaser jobs (title/company/salary shown in full -- that's the
// pitch), and every path deeper into the product opens the sign-up
// modal instead of navigating. See TeaserJobCard/SearchBar(gated)/
// GateButtons for where each of those hooks in.
export function GatedHome({
  featuredJobs,
  stats,
}: {
  featuredJobs: any[];
  stats: { jobCount: number; companyCount: number; airportCount: number };
}) {
  return (
    <div>
      <section className="relative overflow-hidden -mt-16 bg-gradient-to-b from-board via-board-2 to-board-2">
        <div
          className="pointer-events-none absolute -top-24 -left-16 w-96 h-96 rounded-full bg-brand-400/25 blur-3xl animate-float-slow"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-0 -right-24 w-[26rem] h-[26rem] rounded-full bg-brand-500/30 blur-3xl animate-float-slow-reverse"
          aria-hidden
        />

        <div className="relative max-w-4xl mx-auto px-4 pt-36 pb-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight text-balance">
            Find your next job in <span className="text-accent-200">aviation</span>
          </h1>
          <p className="text-slate-300 mt-4 text-lg">
            Mechanics, pilots, engineers, ramp agents, and more — including roles posted nowhere else.
          </p>

          <div className="mt-8 text-left">
            <SearchBar dark gated />
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pb-14 flex items-center justify-center gap-8 sm:gap-16 text-white">
          <div className="text-center">
            <p className="font-mono-data text-2xl sm:text-3xl font-semibold">
              {stats.jobCount}
              <span className="text-accent-200">+</span>
            </p>
            <p className="text-[11px] sm:text-xs uppercase tracking-wide text-slate-400 mt-1">Open roles</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div className="text-center">
            <p className="font-mono-data text-2xl sm:text-3xl font-semibold">{stats.companyCount}</p>
            <p className="text-[11px] sm:text-xs uppercase tracking-wide text-slate-400 mt-1">Employers</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div className="text-center">
            <p className="font-mono-data text-2xl sm:text-3xl font-semibold">{stats.airportCount}</p>
            <p className="text-[11px] sm:text-xs uppercase tracking-wide text-slate-400 mt-1">Airports</p>
          </div>
        </div>
      </section>

      <div className="bg-gradient-to-b from-board-2 to-board-2">
        <Reveal>
          <section className="max-w-6xl mx-auto px-4 py-14">
            <p className="font-mono-data text-xs uppercase tracking-wide text-accent-200">🔥 Hot right now</p>
            <h2 className="font-display text-2xl font-semibold text-white mt-1">Open roles</h2>
            <p className="text-slate-400 text-sm mt-1.5 max-w-xl">
              A preview of what's open. Create a free account to see all {stats.jobCount}+ roles, filter by location and pay, and apply.
            </p>

            {featuredJobs.length === 0 ? (
              <p className="text-slate-400 text-sm mt-8">No jobs posted yet — check back soon.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {featuredJobs.map((job: any, i: number) => (
                  <TeaserJobCard key={job.id} job={job} badge={i === 0 ? "New today" : undefined} />
                ))}
              </div>
            )}

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mt-8 text-center">
              <h3 className="font-display text-lg font-semibold text-white">
                {Math.max(stats.jobCount - featuredJobs.length, 0)} more roles are waiting
              </h3>
              <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                Create a free account to unlock full search, salary filters, and one-click apply.
              </p>
              <div className="mt-6">
                <GateButtons />
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
