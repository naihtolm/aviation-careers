// app/api/cron/expire-jobs/route.ts
//
// Vercel Cron hits this daily. Flips any 'active' job whose expires_at
// has passed to 'expired' -- see features/employers/job-expiry.ts for
// why this exists alongside the RLS-level expiry gate.

import { expireOverdueJobs } from "@/features/employers/job-expiry";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await expireOverdueJobs();
  return Response.json(result);
}
