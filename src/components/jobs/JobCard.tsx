import Link from "next/link";
import { MapPin, Clock, Home, DollarSign } from "lucide-react";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { timeAgo, isRecent } from "@/lib/time";
import { categoryColorClasses } from "@/lib/categoryColor";

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

export function JobCard({ job, initialSaved = false }: { job: any; initialSaved?: boolean }) {
  const salary = formatSalary(job.job_compensation);
  const posted = job.published_at ? timeAgo(job.published_at) : null;
  const fresh = isRecent(job.published_at);
  const colors = categoryColorClasses(job.careers?.name);

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className={`block border border-l-4 ${colors.border} rounded-lg p-4 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all`}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo name={job.companies?.name ?? "?"} website={job.companies?.website} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-slate-900 leading-snug min-w-0">{job.title}</h3>
            <SaveJobButton jobId={job.id} initialSaved={initialSaved} />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <p className="text-sm text-slate-500">
              {job.companies?.name}
              {job.companies?.verification_status === "approved" && (
                <span className="ml-1 text-brand-600" title="Verified employer">✓</span>
              )}
            </p>
            {fresh && (
              <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded shrink-0">
                New
              </span>
            )}
          </div>
          {job.careers?.name && (
            <span className={`inline-block mt-1.5 text-[11px] font-medium px-1.5 py-0.5 rounded ${colors.tagBg} ${colors.tagText}`}>
              {job.careers.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {primaryLocation(job.job_locations)}
        </span>
        {job.employment_type && (
          <span className="inline-flex items-center gap-1 capitalize">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {job.employment_type.replace("_", " ")}
          </span>
        )}
        {job.work_arrangement && (
          <span className="inline-flex items-center gap-1 capitalize">
            <Home className="w-3.5 h-3.5 shrink-0" />
            {job.work_arrangement.replace("_", " ")}
          </span>
        )}
        {salary && (
          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            {salary}
          </span>
        )}
      </div>
      {posted && <p className="text-xs text-slate-400 mt-2">Posted {posted}</p>}
    </Link>
  );
}
