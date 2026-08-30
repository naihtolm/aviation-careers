import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { JobCard } from "@/components/jobs/JobCard";
import { AirportMap } from "@/components/map/AirportMap";
import { getFeaturedJobs } from "@/features/jobs/queries";
import { getCareerCategories } from "@/features/careers/queries";
import { getFeaturedCompanies } from "@/features/companies/queries";
import { getAirports } from "@/features/airports/queries";

export default async function HomePage() {
  const [featuredJobs, categories, companies, airports] = await Promise.all([
    getFeaturedJobs(6),
    getCareerCategories(),
    getFeaturedCompanies(6),
    getAirports(),
  ]);

  return (
    <div>
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">
            Find your next job in aviation
          </h1>
          <p className="text-slate-500 mt-3">
            Mechanics, pilots, engineers, ramp agents, and more — search real openings across the industry.
          </p>
          <div className="mt-6 text-left">
            <SearchBar />
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-lg font-semibold mb-4">Browse by career category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/jobs?career_category=${cat.slug}`}
                className="border rounded-lg p-4 bg-white hover:border-slate-400"
              >
                <p className="font-medium text-slate-900">{cat.name}</p>
                {cat.description && <p className="text-xs text-slate-500 mt-1">{cat.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Featured jobs</h2>
          <Link href="/jobs" className="text-sm text-blue-600 hover:underline">
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

      {airports.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Explore by airport</h2>
            <Link href="/airports" className="text-sm text-blue-600 hover:underline">
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
                label: `${a.name} (${code}) — ${a.jobCount} job${a.jobCount === 1 ? "" : "s"}`,
                href: `/airports/${code}`,
              };
            })}
          />
        </section>
      )}

      {companies.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-lg font-semibold mb-4">Featured employers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/companies/${c.slug}`}
                className="border rounded-lg p-4 bg-white hover:border-slate-400"
              >
                <p className="font-medium text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {c.jobCount} open job{c.jobCount === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
