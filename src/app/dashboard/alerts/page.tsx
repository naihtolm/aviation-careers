import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/features/profile/queries";
import { getAlerts } from "@/features/alerts/queries";
import { AlertRow } from "@/components/alerts/AlertRow";
import { CreateAlertForm } from "@/components/alerts/CreateAlertForm";

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const alerts = await getAlerts(user.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-1">Job Alerts</h1>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-slate-500">No alerts yet — create one below to get emailed when matching jobs appear.</p>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert: any) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      <CreateAlertForm />
    </div>
  );
}
