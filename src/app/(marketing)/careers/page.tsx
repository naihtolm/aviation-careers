import Link from "next/link";
import { GraduationCap, ShieldCheck, Compass, ArrowUpDown } from "lucide-react";
import { getCareerCategories, getCareers } from "@/features/careers/queries";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { categoryColorClasses } from "@/lib/categoryColor";
import { PageHero } from "@/components/layout/PageHero";

interface FilterOption {
  value: string;
  label: string;
  href: string;
  active: boolean;
}

// Checkbox-style row shared by the category, "show only," and sort
// groups so the sidebar reads as one filter panel instead of three
// differently-styled widgets bolted together.
function FilterGroup({
  icon: Icon,
  title,
  options,
  checkbox = false,
}: {
  icon: typeof Compass;
  title: string;
  options: FilterOption[];
  checkbox?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-brand-600" />
        {title}
      </p>
      <ul className="space-y-1.5">
        {options.map((opt) => (
          <li key={opt.value}>
            <Link
              href={opt.href}
              className={`text-sm flex items-center gap-2 text-left w-full ${opt.active ? "text-slate-900 font-medium" : "text-slate-500 hover:text-slate-700"}`}
            >
              {checkbox && (
                <span
                  className={`w-3.5 h-3.5 rounded-[4px] border shrink-0 flex items-center justify-center ${
                    opt.active ? "bg-brand-600 border-brand-600" : "border-slate-300"
                  }`}
                >
                  {opt.active && (
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
                      <path d="M2.5 6.2 5 8.7l4.5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              )}
              {opt.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function CareerDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const entryLevelOnly = params.entry_level === "1";
  const regulatedOnly = params.regulated === "1";
  const sort = params.sort === "entry_level" ? "entry_level" : "name";

  const [categories, careers] = await Promise.all([
    getCareerCategories(),
    getCareers({ categorySlug: params.category, entryLevelOnly, regulatedOnly, sort }),
  ]);

  // Single-select: setting `value` replaces the key entirely; `null`
  // clears it. Used for category and sort, where exactly one choice (or
  // none) makes sense.
  function radioHref(key: string, value: string | null) {
    const next = new URLSearchParams(params as Record<string, string>);
    if (value === null) next.delete(key);
    else next.set(key, value);
    return `/careers?${next.toString()}`;
  }

  // Independent on/off toggle, for the "show only" checkboxes -- each
  // one can be on regardless of the other.
  function toggleHref(key: string) {
    const next = new URLSearchParams(params as Record<string, string>);
    if (next.get(key) === "1") next.delete(key);
    else next.set(key, "1");
    return `/careers?${next.toString()}`;
  }

  const categoryOptions: FilterOption[] = [
    { value: "", label: "All categories", href: radioHref("category", null), active: !params.category },
    ...categories.map((cat) => ({
      value: cat.slug,
      label: cat.name,
      href: radioHref("category", cat.slug),
      active: params.category === cat.slug,
    })),
  ];

  const showOnlyOptions: FilterOption[] = [
    { value: "entry_level", label: "Entry-level friendly", href: toggleHref("entry_level"), active: entryLevelOnly },
    { value: "regulated", label: "FAA regulated", href: toggleHref("regulated"), active: regulatedOnly },
  ];

  const sortOptions: FilterOption[] = [
    { value: "name", label: "Name A–Z", href: radioHref("sort", null), active: sort === "name" },
    { value: "entry_level", label: "Entry-level first", href: radioHref("sort", "entry_level"), active: sort === "entry_level" },
  ];

  return (
    <div>
      <PageHero
        title="Aviation Career Guides"
        description="Explore roles across the industry — what they pay, what they require, and how to get started."
      />

      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-[220px_1fr] gap-8">
        <aside className="space-y-6 md:sticky md:top-24 md:self-start">
          <FilterGroup icon={Compass} title="Category" options={categoryOptions} />
          <FilterGroup icon={GraduationCap} title="Show only" options={showOnlyOptions} checkbox />
        </aside>

        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm text-slate-500">
              {careers.length} career guide{careers.length === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              {sortOptions.map((opt) => (
                <Link
                  key={opt.value}
                  href={opt.href}
                  className={`px-2 py-1 rounded-md ${opt.active ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          {careers.length === 0 ? (
            <div className="border rounded-lg p-8 text-center bg-white">
              <p className="font-medium text-slate-900">No career guides match these filters</p>
              <p className="text-sm text-slate-500 mt-1">Try clearing a filter to see more roles.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {careers.map((career: any) => {
                const colors = categoryColorClasses(career.career_categories?.name ?? career.name);
                return (
                  <Link
                    key={career.id}
                    href={`/careers/${career.slug}`}
                    className={`border border-t-4 ${colors.border} rounded-lg p-4 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${colors.iconBg} ${colors.iconText} flex items-center justify-center`}>
                      <CategoryIcon name={career.career_categories?.name ?? career.name} className="w-5 h-5" />
                    </div>
                    <p className="font-medium text-slate-900 mt-3">{career.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{career.short_description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {career.entry_level && (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                          <GraduationCap className="w-3.5 h-3.5" />
                          Entry-level friendly
                        </span>
                      )}
                      {career.regulated && (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          FAA regulated
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
