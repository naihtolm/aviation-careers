import Link from "next/link";
import { Briefcase, Flame, Building2, Users, FileText, type LucideIcon } from "lucide-react";
import { getAdminOverviewStats } from "@/features/admin/queries";

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: number; sub?: string; icon: LucideIcon }) {
  return (
    <div className="border border-white/10 rounded-lg p-4 bg-white/[0.04] hover:bg-white/[0.07] transition-all">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon className="w-4 h-4 text-brand-300" />
      </div>
      <p className="text-2xl font-semibold text-white mt-1">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const stats = await getAdminOverviewStats();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-medium text-white mb-3">Platform at a glance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Active jobs" value={stats.activeJobs} sub={`${stats.totalJobs} total`} icon={Briefcase} />
          <StatCard label="New jobs (7d)" value={stats.newJobsThisWeek} icon={Flame} />
          <StatCard label="Companies" value={stats.totalCompanies} icon={Building2} />
          <StatCard label="Job seekers" value={stats.totalJobSeekers} sub={`+${stats.newSeekersThisWeek} this week`} icon={Users} />
          <StatCard label="Applications" value={stats.totalApplications} icon={FileText} />
        </div>
      </section>

      {(stats.pendingVerifications > 0 || stats.pendingIngestion > 0) && (
        <section>
          <h2 className="text-lg font-medium text-white mb-3">Needs attention</h2>
          <div className="space-y-2">
            {stats.pendingVerifications > 0 && (
              <Link
                href="/admin/employers"
                className="block border border-amber-400/30 bg-amber-500/10 rounded-lg p-3 text-sm text-amber-200 hover:bg-amber-500/15 transition-colors"
              >
                {stats.pendingVerifications} employer{stats.pendingVerifications === 1 ? "" : "s"} waiting on verification →
              </Link>
            )}
            {stats.pendingIngestion > 0 && (
              <Link
                href="/admin/jobs/review"
                className="block border border-amber-400/30 bg-amber-500/10 rounded-lg p-3 text-sm text-amber-200 hover:bg-amber-500/15 transition-colors"
              >
                {stats.pendingIngestion} ingested job{stats.pendingIngestion === 1 ? "" : "s"} waiting on review →
              </Link>
            )}
          </div>
        </section>
      )}

      {stats.pendingVerifications === 0 && stats.pendingIngestion === 0 && (
        <p className="text-sm text-slate-400">Nothing waiting for review right now.</p>
      )}
    </div>
  );
}
