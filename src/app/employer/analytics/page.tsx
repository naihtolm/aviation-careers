import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/profile/queries";
import { getEmployerContext, getCompanyApplicationAnalytics } from "@/features/employers/queries";

export default async function EmployerAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const context = await getEmployerContext(user.id);
  if (!context) redirect("/employers/sign-up");
  if (context.company.status !== "active") redirect("/employer/verification");

  const { byStatus, byJob, last30Days } = await getCompanyApplicationAnalytics(context.company.id);
  const totalApplications = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  const maxDayCount = Math.max(1, ...last30Days.map((d) => d.count));

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Analytics</h1>
      <p className="text-sm text-slate-500 mb-6">Native applications across all your jobs.</p>

      {totalApplications === 0 ? (
        <p className="text-sm text-slate-500">No native applications yet. Analytics will populate once candidates start applying.</p>
      ) : (
        <>
          <div className="border rounded-lg p-4 bg-white mb-4">
            <p className="font-medium text-slate-900 mb-3">Applications by status</p>
            <div className="space-y-2">
              {Object.entries(byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm capitalize w-24 text-slate-600">{status}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-brand-600 h-2 rounded-full"
                      style={{ width: `${(count / totalApplications) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-500 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white mb-4">
            <p className="font-medium text-slate-900 mb-3">Applications by job</p>
            <div className="space-y-2">
              {byJob.map((j) => (
                <div key={j.title} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{j.title}</span>
                  <span className="text-slate-500">{j.count}</span>
                </div>
              ))}
            </div>
          </div>

          {last30Days.length > 0 && (
            <div className="border rounded-lg p-4 bg-white">
              <p className="font-medium text-slate-900 mb-3">Last 30 days</p>
              <div className="flex items-end gap-1 h-24">
                {last30Days.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count}`}
                    className="flex-1 bg-brand-600 rounded-t"
                    style={{ height: `${(d.count / maxDayCount) * 100}%`, minHeight: 2 }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
