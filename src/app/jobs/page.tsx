import { SearchBar } from "@/components/search/SearchBar";
import { JobCard } from "@/components/jobs/JobCard";
import { searchJobs } from "@/features/jobs/queries";

const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "temporary", "internship"];
const EXPERIENCE_LEVELS = ["entry_level", "one_to_two", "three_to_five", "five_to_ten", "ten_plus"];
const WORK_ARRANGEMENTS = ["on_site", "hybrid", "remote"];

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function JobSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { jobs, total } = await searchJobs({
    keyword: params.keyword,
    careerCategorySlug: params.career_category,
    employmentType: params.employment_type,
    experienceLevel: params.experience_level,
    workArrangement: params.work_arrangement,
    location: params.location,
    radiusMiles: params.radius ? Number(params.radius) : undefined,
    salaryMin: params.salary_min ? Number(params.salary_min) : undefined,
  });

  function filterHref(key: string, value: string) {
    const next = new URLSearchParams(params as Record<string, string>);
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    return `/jobs?${next.toString()}`;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SearchBar defaultKeyword={params.keyword} defaultLocation={params.location} />

      <div className="mt-8 grid md:grid-cols-[220px_1fr] gap-8">
        <aside className="space-y-6">
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">Employment type</p>
            <ul className="space-y-1">
              {EMPLOYMENT_TYPES.map((v) => (
                <li key={v}>
                  <a
                    href={filterHref("employment_type", v)}
                    className={`text-sm block ${params.employment_type === v ? "text-slate-900 font-medium" : "text-slate-500"}`}
                  >
                    {label(v)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">Experience level</p>
            <ul className="space-y-1">
              {EXPERIENCE_LEVELS.map((v) => (
                <li key={v}>
                  <a
                    href={filterHref("experience_level", v)}
                    className={`text-sm block ${params.experience_level === v ? "text-slate-900 font-medium" : "text-slate-500"}`}
                  >
                    {label(v)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">Work arrangement</p>
            <ul className="space-y-1">
              {WORK_ARRANGEMENTS.map((v) => (
                <li key={v}>
                  <a
                    href={filterHref("work_arrangement", v)}
                    className={`text-sm block ${params.work_arrangement === v ? "text-slate-900 font-medium" : "text-slate-500"}`}
                  >
                    {label(v)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div>
          <p className="text-sm text-slate-500 mb-4">
            {total} job{total === 1 ? "" : "s"} found
          </p>

          {jobs.length === 0 ? (
            <div className="border rounded-lg p-8 text-center bg-white">
              <p className="font-medium text-slate-900">We couldn't find any exact matches</p>
              <p className="text-sm text-slate-500 mt-1">
                Try broadening your filters or searching a wider location radius.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
