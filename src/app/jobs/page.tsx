import { Briefcase } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { JobsResults } from "@/components/jobs/JobsResults";
import { PageHero } from "@/components/layout/PageHero";
import { searchJobs, getSavedJobIds, getAppliedJobIds } from "@/features/jobs/queries";
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

// Multi-select filters (employment type, work arrangement) live in the URL
// as one comma-separated value per key -- e.g. ?employment_type=full_time,contract
// -- rather than repeated params, so the existing Record<string, string>
// searchParams shape and URLSearchParams round-trip cleanly with no special
// casing for "this key might be an array."
function parseMulti(value: string | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export default async function JobSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const employmentTypeValues = parseMulti(params.employment_type);
  const workArrangementValues = parseMulti(params.work_arrangement);

  const [{ jobs, total }, user] = await Promise.all([
    searchJobs({
      keyword: params.keyword,
      careerCategorySlug: params.career_category,
      employmentType: employmentTypeValues,
      experienceLevel: params.experience_level,
      workArrangement: workArrangementValues,
      location: params.location,
      radiusMiles: params.radius ? Number(params.radius) : undefined,
      salaryMin: params.salary_min ? Number(params.salary_min) : undefined,
      sort: params.sort === "salary_desc" ? "salary_desc" : "newest",
    }),
    getCurrentUser(),
  ]);
  const [savedJobIds, appliedJobIds] = await Promise.all([
    getSavedJobIds(user?.id ?? null),
    getAppliedJobIds(user?.id ?? null),
  ]);

  // Single-select toggle: this option becomes the entire value for `key`,
  // or clears it if it's already selected. Used for experience level and
  // sort, where exactly one selection (or none) makes sense.
  function filterHref(key: string, value: string) {
    const next = new URLSearchParams(params as Record<string, string>);
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    return `/jobs?${next.toString()}`;
  }

  // Multi-select toggle: this option is added to or removed from `key`'s
  // comma-separated list, leaving every other selected value alone.
  function multiFilterHref(key: string, currentValues: string[], value: string) {
    const next = new URLSearchParams(params as Record<string, string>);
    const nextValues = currentValues.includes(value) ? currentValues.filter((v) => v !== value) : [...currentValues, value];
    if (nextValues.length === 0) next.delete(key);
    else next.set(key, nextValues.join(","));
    return `/jobs?${next.toString()}`;
  }

  const toOptions = (values: string[], key: string, labelFor: (v: string) => string) =>
    values.map((v) => ({ value: v, label: labelFor(v), href: filterHref(key, v), active: params[key as keyof typeof params] === v }));

  const toMultiOptions = (values: string[], key: string, selected: string[], labelFor: (v: string) => string) =>
    values.map((v) => ({ value: v, label: labelFor(v), href: multiFilterHref(key, selected, v), active: selected.includes(v) }));

  return (
    <div>
      <PageHero title="Browse Aviation Jobs" description={`${total} open role${total === 1 ? "" : "s"} across the industry right now`} icon={Briefcase}>
        <SearchBar dark defaultKeyword={params.keyword} defaultLocation={params.location} />
      </PageHero>

      <JobsResults
        employmentTypes={toMultiOptions(EMPLOYMENT_TYPES, "employment_type", employmentTypeValues, label)}
        experienceLevels={toOptions(EXPERIENCE_LEVELS, "experience_level", (v) => EXPERIENCE_LABELS[v])}
        workArrangements={toMultiOptions(WORK_ARRANGEMENTS, "work_arrangement", workArrangementValues, label)}
        sortOptions={[
          { value: "newest", label: "Newest", href: filterHref("sort", "newest"), active: !params.sort || params.sort === "newest" },
          { value: "salary_desc", label: "Highest salary", href: filterHref("sort", "salary_desc"), active: params.sort === "salary_desc" },
        ]}
        jobs={jobs}
        total={total}
        savedJobIds={[...savedJobIds]}
        appliedJobIds={[...appliedJobIds]}
      />
    </div>
  );
}
