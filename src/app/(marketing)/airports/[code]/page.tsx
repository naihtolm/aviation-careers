import { notFound } from "next/navigation";
import Link from "next/link";
import { getAirportByCode } from "@/features/airports/queries";
import { JobCard } from "@/components/jobs/JobCard";
import { Tabs } from "@/components/ui/Tabs";

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
        <Link href="/airports" className="hover:underline">Airports</Link>
      </p>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1">
        {airport.name} <span className="text-slate-400 font-normal">({airport.iata_code})</span>
      </h1>
      <p className="text-slate-500 mt-1">
        {airport.city}, {airport.state}
      </p>

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
                        className="border rounded-lg p-3 bg-white hover:border-slate-400"
                      >
                        <p className="font-medium text-slate-900 text-sm">{c.companies?.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 capitalize">{c.relationship_type.replace("_", " ")}</p>
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
                  <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    {careerNames.map((name) => (
                      <li key={name as string}>{name as string}</li>
                    ))}
                  </ul>
                ),
            },
            {
              label: "Salaries",
              content: (
                <p className="text-sm text-slate-500">
                  Airport-level salary breakdowns aren't available yet — visit the{" "}
                  <Link href="/salaries" className="text-blue-600 hover:underline">
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
