import Link from "next/link";
import { Flame, Bell, UserRound, Building2 } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { JobCard } from "@/components/jobs/JobCard";
import { AirportMap } from "@/components/map/AirportMap";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { Reveal } from "@/components/ui/Reveal";
import { getFeaturedJobs, getHomepageStats } from "@/features/jobs/queries";
import { getCareerCategories } from "@/features/careers/queries";
import { getFeaturedCompanies } from "@/features/companies/queries";
import { getAirports } from "@/features/airports/queries";
import { categoryColorClasses } from "@/lib/categoryColor";

export default async function HomePage() {
  const [featuredJobs, categories, companies, airports, stats] = await Promise.all([
    getFeaturedJobs(6),
    getCareerCategories(),
    getFeaturedCompanies(6),
    getAirports(),
    getHomepageStats(),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900">
        {/* Ambient glow -- pure CSS, no images, subtle drift via the
            animate-float-slow keyframes in globals.css. Positioned to
            match the two radial highlights in the approved design comp. */}
        <div
          className="pointer-events-none absolute -top-24 -left-16 w-96 h-96 rounded-full bg-brand-400/25 blur-3xl animate-float-slow"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-0 -right-24 w-[26rem] h-[26rem] rounded-full bg-brand-500/30 blur-3xl animate-float-slow-reverse"
          aria-hidden
        />

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight text-balance">
            Find your next job in <span className="text-brand-300">aviation</span>
          </h1>
          <p className="text-slate-300 mt-4 text-lg">
            Mechanics, pilots, engineers, ramp agents, and more — search real openings across the industry.
          </p>

          <div className="mt-8 text-left">
            <SearchBar dark />
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pb-14 flex items-center justify-center gap-8 sm:gap-16 text-white">
          <div className="text-center">
            <p className="font-mono-data text-2xl sm:text-3xl font-semibold">
              {stats.jobCount}
              <span className="text-brand-300">+</span>
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

      {categories.length > 0 && (
        <Reveal>
          <section className="max-w-6xl mx-auto px-4 py-14">
            <h2 className="font-display text-xl font-semibold text-slate-900 mb-5">Browse by career category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const colors = categoryColorClasses(cat.name);
                return (
                  <Link
                    key={cat.id}
                    href={`/jobs?career_category=${cat.slug}`}
                    className={`border border-t-4 ${colors.border} rounded-xl p-5 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all`}
                  >
                    <div className={`w-11 h-11 rounded-lg ${colors.iconBg} ${colors.iconText} flex items-center justify-center`}>
                      <CategoryIcon name={cat.name} />
                    </div>
                    <p className="font-medium text-slate-900 mt-3">{cat.name}</p>
                    {cat.description && <p className="text-xs text-slate-500 mt-1">{cat.description}</p>}
                  </Link>
                );
              })}
            </div>
          </section>
        </Reveal>
      )}

      <Reveal>
        <section className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl font-semibold text-slate-900">Featured jobs</h2>
              {stats.newJobsThisWeek > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-600 px-2 py-1 rounded-full">
                  <Flame className="w-3.5 h-3.5" />
                  {stats.newJobsThisWeek} new this week
                </span>
              )}
            </div>
            <Link href="/jobs" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
              View all jobs →
            </Link>
          </div>
          {featuredJobs.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No jobs posted yet — check back soon as new listings come in.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredJobs.map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </Reveal>

      {airports.length > 0 && (
        <Reveal>
          <section className="bg-gradient-to-b from-slate-50 to-white py-14">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-semibold text-slate-900">Explore by airport</h2>
                <Link href="/airports" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                  View all airports →
                </Link>
              </div>
              <AirportMap
                markers={airports.map((a: any) => {
                  const code = a.iata_code ?? a.icao_code;
                  return {
                    id: a.id,
                    latitude: a.latitude,
                    longitude: a.longitude,
                    name: a.name,
                    code,
                    jobCount: a.jobCount,
                    airportType: a.airport_type,
                    topCareer: a.topCareer,
                    companies: a.companies,
                    href: `/airports/${code}`,
                  };
                })}
              />
            </div>
          </section>
        </Reveal>
      )}

      {companies.length > 0 && (
        <Reveal>
          <section className="max-w-6xl mx-auto px-4 py-14">
            <h2 className="font-display text-xl font-semibold text-slate-900 mb-5">Featured employers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {companies.map((c) => (
                <Link
                  key={c.id}
                  href={`/companies/${c.slug}`}
                  className="flex items-center gap-3 border rounded-xl p-4 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <CompanyLogo name={c.name} website={(c as any).website} size={36} />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.jobCount} open job{c.jobCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      <section className="bg-gradient-to-b from-navy-950 to-navy-900 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-xl font-semibold text-white mb-6">Connect with us</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 text-brand-300 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-white font-medium mt-3">Get job alerts</h3>
              <p className="text-slate-300 text-sm mt-1">Be the first to know when new aviation jobs matching your search are posted.</p>
              <Link
                href="/dashboard/alerts"
                className="inline-block mt-4 border border-white/40 text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
              >
                Create an alert
              </Link>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 text-brand-300 flex items-center justify-center">
                <UserRound className="w-5 h-5" />
              </div>
              <h3 className="text-white font-medium mt-3">Build your profile</h3>
              <p className="text-slate-300 text-sm mt-1">Upload your resume and add your experience so employers can find and match with you.</p>
              <Link
                href="/dashboard/profile"
                className="inline-block mt-4 border border-white/40 text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
              >
                Build my profile
              </Link>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 text-brand-300 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-white font-medium mt-3">For employers</h3>
              <p className="text-slate-300 text-sm mt-1">Post open roles and reach qualified mechanics, pilots, engineers, and more.</p>
              <Link
                href="/employers"
                className="inline-block mt-4 border border-white/40 text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
              >
                Post a job
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
