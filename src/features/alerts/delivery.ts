// features/alerts/delivery.ts
//
// Called by the daily cron route. Runs as a system process with no user
// session, so every read/write here goes through the service client —
// job_alerts and profiles are both owner-scoped RLS (010_rls_policies.sql),
// which is correct for the app's own client-side use but would block a
// cron job from ever seeing anyone's alerts.

import { Resend } from "resend";
import { getServiceClient } from "@/lib/supabase/service";
import { searchJobs } from "@/features/jobs/queries";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

function isDue(alert: { frequency: string; last_sent_at: string | null; created_at: string }): boolean {
  const last = alert.last_sent_at ? new Date(alert.last_sent_at).getTime() : new Date(alert.created_at).getTime();
  const elapsed = Date.now() - last;
  return alert.frequency === "weekly" ? elapsed >= ONE_WEEK_MS : elapsed >= ONE_DAY_MS;
}

export async function runAlertDeliveries() {
  const db = getServiceClient();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  const { data: alerts } = await db.from("job_alerts").select("*").eq("is_active", true);
  const results: { alertId: string; sent: boolean; matchCount: number; error?: string }[] = [];

  for (const alert of alerts ?? []) {
    if (!isDue(alert)) continue;

    const since = alert.last_sent_at ?? alert.created_at;
    const filters = (alert.filters as { keyword?: string; location?: string }) ?? {};

    try {
      const { jobs } = await searchJobs({
        keyword: filters.keyword ?? undefined,
        location: filters.location ?? undefined,
        radiusMiles: filters.location ? 50 : undefined,
        publishedAfter: since,
        pageSize: 10,
      });

      if (jobs.length === 0) {
        results.push({ alertId: alert.id, sent: false, matchCount: 0 });
        continue;
      }

      const { data: profile } = await db.from("profiles").select("email").eq("id", alert.user_id).maybeSingle();

      if (resend && profile?.email) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aviation-careers.vercel.app";
        await resend.emails.send({
          from: "Aviation Careers <alerts@aviationcareers.dev>",
          to: profile.email,
          subject: `${jobs.length} new job${jobs.length === 1 ? "" : "s"} matching "${alert.name}"`,
          html: renderAlertEmail(alert.name, jobs, siteUrl),
        });
      }

      await db.from("job_alerts").update({ last_sent_at: new Date().toISOString() }).eq("id", alert.id);
      results.push({ alertId: alert.id, sent: !!resend, matchCount: jobs.length });
    } catch (err) {
      results.push({ alertId: alert.id, sent: false, matchCount: 0, error: String(err) });
    }
  }

  return results;
}

function renderAlertEmail(alertName: string, jobs: any[], siteUrl: string): string {
  const rows = jobs
    .map(
      (job) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <a href="${siteUrl}/jobs/${job.slug}" style="color: #0f172a; font-weight: 600; text-decoration: none;">${job.title}</a>
            <div style="color: #64748b; font-size: 13px; margin-top: 2px;">${job.companies?.name ?? ""}</div>
          </td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0f172a;">New jobs matching "${alertName}"</h2>
      <table style="width: 100%; border-collapse: collapse;">${rows}</table>
      <p style="margin-top: 24px;">
        <a href="${siteUrl}/dashboard/alerts" style="color: #2563eb;">Manage your alerts</a>
      </p>
    </div>
  `;
}
