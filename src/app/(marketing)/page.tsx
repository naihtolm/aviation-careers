import Link from "next/link";
import { Flame } from "lucide-react";
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
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600">
        {/* Ambient glow shapes -- pure CSS, no images, subtle drift via
            the animate-float-slow keyframes in globals.css. */}
        <div
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-400/30 blur-3xl animate-float-slow"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-brand-300/20 blur-3xl animate-float-slow-reverse"
          aria-hidden
        />

        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Find your next job in <span className="text-brand-200">aviation</span>
          </h1>
          <p className="text-brand-100 mt-4 text-lg">
            Mechanics, pilots, engineers, ramp agents, and more — search real openings across the industry.
          </p>

          <div className="mt-8 text-left drop-shadow-xl">
            <SearchBar />
          </div>

          <div className="mt-10 flex items-center justify-center gap-8 sm:gap-14 text-white">
            <div>
              <p className="text-2xl sm:text-3xl font-bold">{stats.jobCount}+</p>
              <p className="text-xs sm:text-sm text-brand-100 mt-0.5">Open roles</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-2xl sm:text-3xl font-bold">{stats.companyCount}</p>
              <p className="text-xs sm:text-sm text-brand-100 mt-0.5">Employers</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-2xl sm:text-3xl font-bold">{stats.airportCount}</p>
              <p className="text-xs sm:text-sm text-brand-100 mt-0.5">Airports</p>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <Reveal>
          <section className="max-w-6xl mx-auto px-4 py-14">
            <h2 className="text-xl font-semibold text-slate-900 mb-5">Browse by career category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/jobs?career_category=${cat.slug}`}
                  className="group border rounded-xl p-5 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-11 h-11 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <CategoryIcon name={cat.name} />
                  </div>
                  <p className="font-medium text-slate-900 mt-3">{cat.name}</p>
                  {cat.description && <p className="text-xs text-slate-500 mt-1">{cat.description}</p>}
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      <Reveal>
        <section className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Featured jobs</h2>
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
                <h2 className="text-xl font-semibold text-slate-900">Explore by airport</h2>
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
            <h2 className="text-xl font-semibold text-slate-900 mb-5">Featured employers</h2>
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
    </div>
  );
}
