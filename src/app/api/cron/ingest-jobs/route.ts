// app/api/cron/ingest-jobs/route.ts
//
// Vercel Cron hits this URL on a schedule (configured in vercel.json).
// CRON_SECRET gates it so it can't be triggered by anyone who finds the URL.

import { runAllIngestion } from "@/lib/ingestion/run-ingestion";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await runAllIngestion();
  return Response.json({ results });
}
