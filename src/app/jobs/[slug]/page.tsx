import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Home, DollarSign, CalendarDays } from "lucide-react";
import { getJobBySlug, getSimilarJobs, getSavedJobIds, hasAppliedToJob } from "@/features/jobs/queries";
import { getCurrentUser } from "@/features/profile/queries";
import { ApplyPanel } from "@/components/jobs/ApplyPanel";
import { JobCard } from "@/components/jobs/JobCard";
import { MatchCard } from "@/components/jobs/MatchCard";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { timeAgo, isRecent } from "@/lib/time";
import { decodeHtmlEntities } from "@/lib/html";

function formatSalary(comp: any[]) {
  const row = (comp ?? []).find((c: any) => c.is_public);
  if (!row || (!row.min_amount && !row.max_amount)) return null;
  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const range =
    row.min_amount && row.max_amount ? `${fmt(row.min_amount)}–${fmt(row.max_amount)}` : fmt(row.min_amount ?? row.max_amount);
  const per = row.period === "year" ? "/yr" : row.period === "hour" ? "/hr" : `/${row.period}`;
  return `${range} ${row.currency}${per}`;
}

function primaryLocationLabel(jobLocations: any[]) {
  const row = (jobLocations ?? []).find((l: any) => l.is_primary) ?? (jobLocations ?? [])[0];
  if (!row) return null;
  if (row.locations?.city) return `${row.locations.city}, ${row.locations.state_code ?? ""}`.trim();
  if (row.airports?.city) return `${row.airports.city}, ${row.airports.state ?? ""}`.trim();
  return null;
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const user = await getCurrentUser();
  const [similarJobs, savedJobIds, alreadyApplied] = await Promise.all([
    getSimilarJobs(job.careers?.id ?? null, job.id),
    getSavedJobIds(user?.id ?? null),
    hasAppliedToJob(user?.id ?? null, job.id),
  ]);
  const salary = formatSalary(job.job_compensation);
  const location = primaryLocationLabel(job.job_locations);
  const posted = job.published_at ? timeAgo(job.published_at) : null;
  const fresh = isRecent(job.published_at);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            {job.careers?.name && <span>{job.careers.name}</span>}
          </div>
          <div className="flex items-start gap-3">
            <CompanyLogo name={job.companies?.name ?? "?"} website={job.companies?.website} size={48} className="mt-0.5" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-semibold text-slate-900">{job.title}</h1>
                {fresh && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                    New
                  </span>
                )}
              </div>
              <p className="text-slate-600 mt-1">
                {job.companies?.slug ? (
                  <Link href={`/companies/${job.companies.slug}`} className="hover:underline hover:text-slate-900 transition-colors">
                    {job.companies?.name}
                  </Link>
                ) : (
                  job.companies?.name
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-slate-500">
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {location}
              </span>
            )}
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
              <span className="inline-flex items-center gap-1 text-slate-900 font-medium">
                <DollarSign className="w-3.5 h-3.5 shrink-0" />
                {salary}
              </span>
            )}
            {posted && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                Posted {posted}
              </span>
            )}
          </div>

          <div className="md:hidden mt-6">
            <ApplyPanel
              jobId={job.id}
              applicationType={job.application_type}
              applicationUrl={job.application_url}
              companyName={job.companies?.name ?? "the employer"}
              initialSaved={savedJobIds.has(job.id)}
              screeningQuestions={(job as any).screening_questions ?? []}
              alreadyApplied={alreadyApplied}
            />
          </div>

          <div className="border-t mt-6 pt-6 prose prose-sm max-w-none">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Description</h2>
            <div dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(job.description ?? "") }} />
          </div>

          {job.job_requirements?.length > 0 && (
            <div className="border-t mt-6 pt-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Requirements</h2>
              <ul className="space-y-1">
                {job.job_requirements.map((r: any) => (
                  <li key={r.id} className="text-sm text-slate-600">
                    <span className={r.requirement_type === "required" ? "font-medium text-slate-900" : ""}>
                      {r.requirement_type === "required" ? "Required" : "Preferred"}:
                    </span>{" "}
                    {r.description ?? r.value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t mt-6 pt-6">
            <MatchCard jobId={job.id} />
          </div>
        </div>

        <div className="hidden md:block">
          <div className="sticky top-24">
            <ApplyPanel
              jobId={job.id}
              applicationType={job.application_type}
              applicationUrl={job.application_url}
              companyName={job.companies?.name ?? "the employer"}
              initialSaved={savedJobIds.has(job.id)}
              screeningQuestions={(job as any).screening_questions ?? []}
              alreadyApplied={alreadyApplied}
            />
          </div>
        </div>
      </div>

      {similarJobs.length > 0 && (
        <div className="border-t mt-10 pt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Similar jobs</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarJobs.map((j: any) => (
              <JobCard key={j.id} job={j} initialSaved={savedJobIds.has(j.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
