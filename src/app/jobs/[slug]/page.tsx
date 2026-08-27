import { notFound } from "next/navigation";
import Link from "next/link";
import { getJobBySlug, getSimilarJobs } from "@/features/jobs/queries";
import { ApplyPanel } from "@/components/jobs/ApplyPanel";
import { JobCard } from "@/components/jobs/JobCard";
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

  const similarJobs = await getSimilarJobs(job.careers?.id ?? null, job.id);
  const salary = formatSalary(job.job_compensation);
  const location = primaryLocationLabel(job.job_locations);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            {job.careers?.name && <span>{job.careers.name}</span>}
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>
          <p className="text-slate-600 mt-1">
            {job.companies?.slug ? (
              <Link href={`/companies/${job.companies.slug}`} className="hover:underline">
                {job.companies?.name}
              </Link>
            ) : (
              job.companies?.name
            )}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-slate-500">
            {location && <span>{location}</span>}
            {job.employment_type && <span className="capitalize">{job.employment_type.replace("_", " ")}</span>}
            {job.work_arrangement && <span className="capitalize">{job.work_arrangement.replace("_", " ")}</span>}
            {salary && <span className="text-slate-900 font-medium">{salary}</span>}
          </div>

          <div className="md:hidden mt-6">
            <ApplyPanel
              jobId={job.id}
              applicationType={job.application_type}
              applicationUrl={job.application_url}
              companyName={job.companies?.name ?? "the employer"}
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
            <div className="border rounded-lg p-4 bg-slate-50">
              <p className="font-medium text-slate-900 text-sm">Check My Match</p>
              <p className="text-sm text-slate-500 mt-1">
                Sign in and complete your profile to see how well you match this job's requirements.
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="sticky top-24">
            <ApplyPanel
              jobId={job.id}
              applicationType={job.application_type}
              applicationUrl={job.application_url}
              companyName={job.companies?.name ?? "the employer"}
            />
          </div>
        </div>
      </div>

      {similarJobs.length > 0 && (
        <div className="border-t mt-10 pt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Similar jobs</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarJobs.map((j: any) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
