import { Clock, TrendingUp, Home, Briefcase } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { JobCard } from "@/components/jobs/JobCard";
import { PageHero } from "@/components/layout/PageHero";
import { searchJobs, getSavedJobIds } from "@/features/jobs/queries";
import { getCurrentUser } from "@/features/profile/queries";

const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "temporary", "internship"];
const EXPERIENCE_LEVELS = ["entry_level", "one_to_two", "three_to_five", "five_to_ten", "ten_plus"];
const WORK_ARRANGEMENTS = ["on_site", "hybrid", "remote"];

// Matches the labeling already used on the profile page's experience
// level dropdown (components/profile/ProfileDetailsForm.tsx).
const EXPERIENCE_LABELS: Record<string, string> = {
  entry_level: "Entry level",
  one_to_two: "1–2 years",
  three_to_five: "3–5 years",
  five_to_ten: "5–10 years",
  ten_plus: "10+ years",
};

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function JobSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [{ jobs, total }, user] = await Promise.all([
    searchJobs({
      keyword: params.keyword,
      careerCategorySlug: params.career_category,
      employmentType: params.employment_type,
      experienceLevel: params.experience_level,
      workArrangement: params.work_arrangement,
      location: params.location,
      radiusMiles: params.radius ? Number(params.radius) : undefined,
      salaryMin: params.salary_min ? Number(params.salary_min) : undefined,
      sort: params.sort === "salary_desc" ? "salary_desc" : "newest",
    }),
    getCurrentUser(),
  ]);
  const savedJobIds = await getSavedJobIds(user?.id ?? null);

  function filterHref(key: string, value: string) {
    const next = new URLSearchParams(params as Record<string, string>);
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    return `/jobs?${next.toString()}`;
  }

  return (
    <div>
      <PageHero title="Browse Aviation Jobs" description={`${total} open role${total === 1 ? "" : "s"} across the industry right now`} icon={Briefcase}>
        <SearchBar dark defaultKeyword={params.keyword} defaultLocation={params.location} />
      </PageHero>

      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-[220px_1fr] gap-8">
        <aside className="space-y-6 md:sticky md:top-24 md:self-start">
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-600" />
              Employment type
            </p>
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
            <p className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              Experience level
            </p>
            <ul className="space-y-1">
              {EXPERIENCE_LEVELS.map((v) => (
                <li key={v}>
                  <a
                    href={filterHref("experience_level", v)}
                    className={`text-sm block ${params.experience_level === v ? "text-slate-900 font-medium" : "text-slate-500"}`}
                  >
                    {EXPERIENCE_LABELS[v]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-brand-600" />
              Work arrangement
            </p>
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
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm text-slate-500">
              {total} job{total === 1 ? "" : "s"} found
            </p>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-slate-400">Sort:</span>
              <a
                href={filterHref("sort", "newest")}
                className={`px-2 py-1 rounded-md ${!params.sort || params.sort === "newest" ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-500 hover:bg-slate-100"}`}
              >
                Newest
              </a>
              <a
                href={filterHref("sort", "salary_desc")}
                className={`px-2 py-1 rounded-md ${params.sort === "salary_desc" ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-500 hover:bg-slate-100"}`}
              >
                Highest salary
              </a>
            </div>
          </div>

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
                <JobCard key={job.id} job={job} initialSaved={savedJobIds.has(job.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
