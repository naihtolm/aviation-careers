import { Briefcase } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { JobsResults } from "@/components/jobs/JobsResults";
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

  const toOptions = (values: string[], key: string, labelFor: (v: string) => string) =>
    values.map((v) => ({ value: v, label: labelFor(v), href: filterHref(key, v), active: params[key as keyof typeof params] === v }));

  return (
    <div>
      <PageHero title="Browse Aviation Jobs" description={`${total} open role${total === 1 ? "" : "s"} across the industry right now`} icon={Briefcase}>
        <SearchBar dark defaultKeyword={params.keyword} defaultLocation={params.location} />
      </PageHero>

      <JobsResults
        employmentTypes={toOptions(EMPLOYMENT_TYPES, "employment_type", label)}
        experienceLevels={toOptions(EXPERIENCE_LEVELS, "experience_level", (v) => EXPERIENCE_LABELS[v])}
        workArrangements={toOptions(WORK_ARRANGEMENTS, "work_arrangement", label)}
        sortOptions={[
          { value: "newest", label: "Newest", href: filterHref("sort", "newest"), active: !params.sort || params.sort === "newest" },
          { value: "salary_desc", label: "Highest salary", href: filterHref("sort", "salary_desc"), active: params.sort === "salary_desc" },
        ]}
        jobs={jobs}
        total={total}
        savedJobIds={[...savedJobIds]}
      />
    </div>
  );
}
