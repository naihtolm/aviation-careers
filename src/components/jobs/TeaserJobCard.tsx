"use client";

import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { useAuthGate } from "@/components/auth/AuthGateContext";

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
  if (!row) return null;
  if (row.locations?.city) return `${row.locations.city}, ${row.locations.state_code ?? ""}`.trim();
  if (row.airports?.city) return `${row.airports.city}, ${row.airports.state ?? ""}`.trim();
  return null;
}

// A real, enticing job card that stops short of the actual job -- clicking
// anywhere opens the sign-up gate instead of navigating to /jobs/[slug].
// Real title/company/salary on purpose (that's the whole pitch: "here's
// what you're missing"), just no way through without an account.
export function TeaserJobCard({ job, badge }: { job: any; badge?: string }) {
  const { openGate } = useAuthGate();
  const salary = formatSalary(job.job_compensation);
  const location = primaryLocation(job.job_locations);

  return (
    <button
      onClick={() => openGate("signup")}
      className="text-left border-l-4 border-accent-200 border-y border-r border-white/10 bg-white/[0.04] rounded-lg p-4 hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all relative"
    >
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wide text-accent-200 bg-accent-200/10 px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
      <div className="flex items-start gap-3">
        <CompanyLogo name={job.companies?.name ?? "?"} website={job.companies?.website} size={36} />
        <div className="min-w-0">
          <p className="font-medium text-white leading-snug pr-14">{job.title}</p>
          <p className="text-sm text-slate-400 mt-0.5">{job.companies?.name}</p>
        </div>
      </div>
      {salary && <p className="font-mono-data text-sm text-accent-200 mt-3">{salary}</p>}
      {location && <p className="text-xs text-slate-500 mt-1">{location}</p>}
    </button>
  );
}
