import Link from "next/link";
import { Building2, Briefcase } from "lucide-react";
import { getAllCompanies } from "@/features/companies/queries";
import { PageHero } from "@/components/layout/PageHero";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { companyTypeLabel } from "@/lib/companyType";
import { SECTORS, getSectorBySlug } from "@/lib/sectors";

export default async function CompanyDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const activeSector = params.sector ? getSectorBySlug(params.sector) : undefined;
  const companies = await getAllCompanies(params.sector);

  return (
    <div>
      <PageHero
        title="Employer Directory"
        description="Every company hiring on Aviation Careers, across every sector of the industry."
        icon={Building2}
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href="/companies"
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              !params.sector
                ? "bg-accent-200 text-board border-accent-200 hover:bg-accent-100"
                : "text-white/80 border-white/25 hover:bg-white/10"
            }`}
          >
            All
          </Link>
          {SECTORS.map((sector) => (
            <Link
              key={sector.slug}
              href={`/companies?sector=${sector.slug}`}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                params.sector === sector.slug
                  ? "bg-accent-200 text-board border-accent-200 hover:bg-accent-100"
                  : "text-white/80 border-white/25 hover:bg-white/10"
              }`}
            >
              {sector.name}
            </Link>
          ))}
        </div>
      </PageHero>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {companies.length === 0 ? (
          <p className="text-slate-500 mt-8">
            {activeSector ? `No employers in ${activeSector.name} yet.` : "No employers listed yet."}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/companies/${c.slug}`}
                className="flex items-start gap-3 border rounded-xl p-4 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <CompanyLogo name={c.name} website={c.website} size={40} />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {c.name}
                    {c.verification_status === "approved" && (
                      <span className="ml-1.5 text-xs text-brand-600 align-middle" title="Verified employer">✓</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{companyTypeLabel(c.company_type)}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Briefcase className="w-3.5 h-3.5" />
                      {c.jobCount} open job{c.jobCount === 1 ? "" : "s"}
                    </p>
                    {c.veteran_friendly && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">
                        Veteran-friendly
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
