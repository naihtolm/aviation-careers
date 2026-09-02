import { runAlertDeliveries } from "@/features/alerts/delivery";
import { expireOverdueJobs } from "@/features/employers/job-expiry";
import { runAllIngestion } from "@/lib/ingestion/run-ingestion";
import { autoApproveQualifyingRawJobs } from "@/lib/ingestion/auto-approve";

export const maxDuration = 60;

async function capture<T>(task: () => Promise<T>) {
  try {
    return { ok: true as const, result: await task() };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [ingestion, expiration, alerts] = await Promise.all([
    // autoApprove runs after ingestion (needs today's raw_job_records
    // already inserted), so both are wrapped in one capture() rather than
    // run in parallel with each other -- only independent of expiration/alerts.
    capture(async () => ({ results: await runAllIngestion(), autoApproved: await autoApproveQualifyingRawJobs() })),
    capture(expireOverdueJobs),
    capture(runAlertDeliveries),
  ]);

  const ok = ingestion.ok && expiration.ok && alerts.ok;
  return Response.json({ ok, ingestion, expiration, alerts }, { status: ok ? 200 : 500 });
}
