// app/api/cron/send-alerts/route.ts
//
// Vercel Cron hits this daily. Alerts due today (per their own daily/
// weekly frequency) get checked for new matches and emailed.

import { runAlertDeliveries } from "@/features/alerts/delivery";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await runAlertDeliveries();
  return Response.json({ results });
}
