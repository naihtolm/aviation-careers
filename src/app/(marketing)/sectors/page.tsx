import Link from "next/link";
import { LayoutGrid, Briefcase } from "lucide-react";
import { getSectorStats } from "@/features/sectors/queries";
import { sectorColorClasses } from "@/lib/sectors";
import { PageHero } from "@/components/layout/PageHero";

export default async function SectorsPage() {
  const sectors = await getSectorStats();

  return (
    <div>
      <PageHero
        title="Browse by Sector"
        description="Aviation isn't just airlines -- explore who's hiring across every corner of the industry."
        icon={LayoutGrid}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map((sector) => {
            const colors = sectorColorClasses(sector.colorKey);
            return (
              <Link
                key={sector.slug}
                href={`/sectors/${sector.slug}`}
                className={`border border-t-4 ${colors.border} border-x border-b border-white/10 rounded-lg p-4 bg-white/[0.04] hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all`}
              >
                <div className={`w-9 h-9 rounded-lg ${colors.iconBg} ${colors.iconText} flex items-center justify-center`}>
                  <sector.icon className="w-5 h-5" />
                </div>
                <p className="font-medium text-white mt-3">{sector.name}</p>
                <p className="text-sm text-slate-400 mt-1">{sector.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                  <span>{sector.companyCount} employer{sector.companyCount === 1 ? "" : "s"}</span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {sector.jobCount} open job{sector.jobCount === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
