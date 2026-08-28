import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/features/profile/queries";
import { getApplicationsByStatus } from "@/features/applications/queries";
import { STATUSES } from "@/features/applications/constants";
import { ApplicationCard } from "@/components/applications/ApplicationCard";

const COLUMN_LABELS: Record<string, string> = {
  interested: "Interested",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const grouped = await getApplicationsByStatus(user.id);
  const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Applications</h1>

      {total === 0 ? (
        <div className="border rounded-lg p-8 text-center bg-white mt-6">
          <p className="text-slate-900 font-medium">No applications tracked yet</p>
          <p className="text-sm text-slate-500 mt-1">
            When you click Apply on a job, we'll track it here so you can follow up.
          </p>
          <Link href="/jobs" className="inline-block mt-3 text-sm text-blue-600 hover:underline">
            Browse jobs →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
          {STATUSES.map((status) => (
            <div key={status}>
              <p className="text-sm font-medium text-slate-900 mb-2">
                {COLUMN_LABELS[status]} <span className="text-slate-400">({grouped[status].length})</span>
              </p>
              <div className="space-y-2">
                {grouped[status].map((app: any) => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
