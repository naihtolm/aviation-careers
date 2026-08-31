import Link from "next/link";
import { getCareersForSalaryPicker } from "@/features/salaries/queries";

export default async function SalaryExplorerPage() {
  const careers = await getCareersForSalaryPicker();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Salary Explorer</h1>
      <p className="text-slate-500 mt-1">Pick a career to see pay ranges sourced from official labor data.</p>

      {careers.length === 0 ? (
        <p className="text-slate-500 mt-8">No salary data published yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          {careers.map((career) => (
            <Link
              key={career.id}
              href={`/salaries/${career.slug}/national`}
              className="border rounded-lg p-4 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <p className="font-medium text-slate-900">{career.name}</p>
              <p className="text-xs text-slate-500 mt-1">View national salary data →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
