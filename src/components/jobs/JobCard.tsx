import Link from "next/link";

function formatSalary(comp: any[] | undefined) {
  const row = (comp ?? []).find((c) => c.is_public);
  if (!row) return null;
  const { min_amount, max_amount, period, currency } = row;
  if (!min_amount && !max_amount) return null;
  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const range = min_amount && max_amount ? `${fmt(min_amount)}–${fmt(max_amount)}` : fmt(min_amount ?? max_amount);
  const per = period === "year" ? "/yr" : period === "hour" ? "/hr" : `/${period}`;
  return `${range} ${currency}${per}`;
}

function primaryLocation(jobLocations: any[] | undefined) {
  const row = (jobLocations ?? []).find((l) => l.is_primary) ?? (jobLocations ?? [])[0];
  if (!row) return "Location not specified";
  if (row.locations?.city) return `${row.locations.city}, ${row.locations.state_code ?? ""}`.trim();
  if (row.airports?.city) return `${row.airports.city}, ${row.airports.state ?? ""}`.trim();
  return "Location not specified";
}

export function JobCard({ job }: { job: any }) {
  const salary = formatSalary(job.job_compensation);
  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="block border rounded-lg p-4 bg-white hover:border-slate-400 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-slate-900">{job.title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {job.companies?.name}
            {job.companies?.verification_status === "approved" && (
              <span className="ml-1 text-blue-600" title="Verified employer">✓</span>
            )}
          </p>
        </div>
        {job.careers?.name && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded whitespace-nowrap">
            {job.careers.name}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-slate-500">
        <span>{primaryLocation(job.job_locations)}</span>
        {job.employment_type && <span className="capitalize">{job.employment_type.replace("_", " ")}</span>}
        {job.work_arrangement && <span className="capitalize">{job.work_arrangement.replace("_", " ")}</span>}
        {salary && <span className="text-slate-700 font-medium">{salary}</span>}
      </div>
    </Link>
  );
}
