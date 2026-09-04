import Link from "next/link";
import { DollarSign } from "lucide-react";
import { getCareersForSalaryPicker } from "@/features/salaries/queries";
import { PageHero } from "@/components/layout/PageHero";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { categoryColorClasses } from "@/lib/categoryColor";

function fmtSalary(n: number | null) {
  return n != null ? `$${Math.round(n).toLocaleString()}` : null;
}

export default async function SalaryExplorerPage() {
  const careers = await getCareersForSalaryPicker();

  return (
    <div>
      <PageHero
        title="Salary Explorer"
        description="Pick a career to see pay ranges sourced from official labor data."
        icon={DollarSign}
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {careers.length === 0 ? (
          <p className="text-slate-400 mt-8">No salary data published yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {careers.map((career: any) => {
              const colors = categoryColorClasses(career.career_categories?.name ?? career.name);
              const median = fmtSalary(career.medianSalary);
              return (
                <Link
                  key={career.id}
                  href={`/salaries/${career.slug}/national`}
                  className={`border border-t-4 ${colors.border} border-x border-b border-white/10 rounded-lg p-4 bg-white/[0.04] hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all`}
                >
                  <div className={`w-9 h-9 rounded-lg ${colors.iconBg} ${colors.iconText} flex items-center justify-center`}>
                    <CategoryIcon name={career.career_categories?.name ?? career.name} className="w-5 h-5" />
                  </div>
                  <p className="font-medium text-white mt-3">{career.name}</p>
                  {median ? (
                    <p className="mt-1">
                      <span className="text-lg font-semibold text-accent-200 font-mono-data">{median}</span>
                      <span className="text-xs text-slate-400">/yr median</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">Salary data coming soon</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
