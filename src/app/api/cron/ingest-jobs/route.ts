// app/api/cron/ingest-jobs/route.ts
//
// Vercel Cron hits this URL on a schedule (configured in vercel.json).
// CRON_SECRET gates it so it can't be triggered by anyone who finds the URL.

import { Resend } from "resend";
import { runAllIngestion } from "@/lib/ingestion/run-ingestion";
import { autoApproveQualifyingRawJobs } from "@/lib/ingestion/auto-approve";

export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await runAllIngestion();
  // Runs after ingestion, not in parallel with it -- it needs today's
  // freshly-inserted raw_job_records to already be there to evaluate.
  const autoApproved = await autoApproveQualifyingRawJobs();

  const errors = results.flatMap((result) => result.errors.map((message) => ({ sourceId: result.sourceId, message })));
  if (errors.length > 0) {
    await notifyIngestionFailure(errors);
  }

  return Response.json({ results, autoApproved });
}

// Reuses the same Resend setup as features/alerts/delivery.ts — no-ops
// quietly if either env var is unset so a missing config never breaks
// ingestion itself, it just means you won't be emailed about failures.
async function notifyIngestionFailure(errors: { sourceId: string; message: string }[]) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!resendApiKey || !adminEmail) return;

  const resend = new Resend(resendApiKey);
  const rows = errors.map((e) => `<li><strong>${e.sourceId}</strong>: ${e.message}</li>`).join("");

  await resend.emails.send({
    from: "Aviation Careers <alerts@aviationcareers.dev>",
    to: adminEmail,
    subject: `Job ingestion failed for ${errors.length} source${errors.length === 1 ? "" : "s"}`,
    html: `<div style="font-family: sans-serif;"><p>Today's job ingestion run hit ${errors.length} error${errors.length === 1 ? "" : "s"}:</p><ul>${rows}</ul></div>`,
  });
}
