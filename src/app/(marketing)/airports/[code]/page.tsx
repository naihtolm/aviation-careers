import { notFound } from "next/navigation";
import Link from "next/link";
import { Plane, MapPin } from "lucide-react";
import { getAirportByCode } from "@/features/airports/queries";
import { JobCard } from "@/components/jobs/JobCard";
import { Tabs } from "@/components/ui/Tabs";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { RelationshipBadge } from "@/components/ui/RelationshipBadge";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { airportTypeLabel } from "@/lib/airport";

export default async function AirportDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = await getAirportByCode(code);
  if (!result) notFound();
  const { airport, companies, jobs } = result;

  const careerNames = Array.from(
    new Set(jobs.map((j: any) => j.careers?.name).filter(Boolean))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <p className="text-sm text-slate-500">
        <Link href="/airports" className="hover:underline hover:text-slate-900 transition-colors">Airports</Link>
      </p>
      <div className="flex items-center gap-3 mt-1">
        <div className="w-11 h-11 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <Plane className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-semibold text-slate-900">
              {airport.name} <span className="text-slate-400 font-normal">({airport.iata_code ?? airport.icao_code})</span>
            </h1>
            {airportTypeLabel(airport.airport_type) && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                {airportTypeLabel(airport.airport_type)}
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {airport.city}, {airport.state}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Tabs
          tabs={[
            {
              label: `Jobs (${jobs.length})`,
              content:
                jobs.length === 0 ? (
                  <p className="text-sm text-slate-500">No open jobs at this airport right now.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {jobs.map((j: any) => (
                      <JobCard key={j.id} job={j} />
                    ))}
                  </div>
                ),
            },
            {
              label: `Employers (${companies.length})`,
              content:
                companies.length === 0 ? (
                  <p className="text-sm text-slate-500">No employers listed at this airport yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {companies.map((c: any, i: number) => (
                      <Link
                        key={i}
                        href={`/companies/${c.companies?.slug}`}
                        className="flex items-center gap-3 border rounded-lg p-3 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        <CompanyLogo name={c.companies?.name ?? "?"} website={c.companies?.website} size={32} />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{c.companies?.name}</p>
                          <RelationshipBadge type={c.relationship_type} className="text-xs text-slate-500 mt-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ),
            },
            {
              label: "Careers",
              content:
                careerNames.length === 0 ? (
                  <p className="text-sm text-slate-500">No career data yet for jobs at this airport.</p>
                ) : (
                  <ul className="space-y-2">
                    {careerNames.map((name) => (
                      <li key={name as string} className="flex items-center gap-2 text-sm text-slate-600">
                        <CategoryIcon name={name as string} className="w-4 h-4 text-brand-600 shrink-0" />
                        {name as string}
                      </li>
                    ))}
                  </ul>
                ),
            },
            {
              label: "Salaries",
              content: (
                <p className="text-sm text-slate-500">
                  Airport-level salary breakdowns aren't available yet — visit the{" "}
                  <Link href="/salaries" className="text-brand-600 hover:underline hover:text-brand-700 transition-colors">
                    Salary Explorer
                  </Link>{" "}
                  for national data by career.
                </p>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
