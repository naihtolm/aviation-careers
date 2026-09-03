// lib/ingestion/run-ingestion.ts
//
// Entry point called by a scheduled job (Vercel Cron route handler, or a
// Supabase Edge Function on pg_cron — either works at V1 scale). Loops
// over every active row in job_ingestion_sources and dispatches to the
// right connector based on source_type.

import { getServiceClient } from "@/lib/supabase/service";
import { ingestGreenhouseBoard } from "./greenhouse-connector";
import { ingestLeverBoard } from "./lever-connector";
import { ingestUsaJobsSearch } from "./usajobs-connector";
import type { IngestionResult, IngestionSourceConfig } from "./types";

export async function runAllIngestion(): Promise<IngestionResult[]> {
  const supabase = getServiceClient();

  const { data: sources, error } = await supabase
    .from("job_ingestion_sources")
    .select("id, source_type, configuration")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to load ingestion sources: ${error.message}`);
  }

  const results: IngestionResult[] = [];

  for (const source of sources ?? []) {
    const config = source.configuration as IngestionSourceConfig;

    switch (source.source_type) {
      case "greenhouse": {
        if (!config?.board_token) {
          results.push({
            sourceId: source.id,
            fetched: 0,
            inserted: 0,
            skippedDuplicates: 0,
            errors: [`Source ${source.id} is missing configuration.board_token`],
          });
          break;
        }
        results.push(await ingestGreenhouseBoard(source.id, config.board_token));
        break;
      }

      case "lever": {
        // Reuses config.board_token for Lever's company slug -- both are
        // just "the identifier in the API's URL path for this employer,"
        // and giving them the same config field means one less thing to
        // keep in sync between the two connectors' setup.
        if (!config?.board_token) {
          results.push({
            sourceId: source.id,
            fetched: 0,
            inserted: 0,
            skippedDuplicates: 0,
            errors: [`Source ${source.id} is missing configuration.board_token`],
          });
          break;
        }
        results.push(await ingestLeverBoard(source.id, config.board_token));
        break;
      }

      case "usajobs": {
        if (!config?.keyword) {
          results.push({
            sourceId: source.id,
            fetched: 0,
            inserted: 0,
            skippedDuplicates: 0,
            errors: [`Source ${source.id} is missing configuration.keyword`],
          });
          break;
        }
        results.push(await ingestUsaJobsSearch(source.id, config.keyword));
        break;
      }

      default:
        results.push({
          sourceId: source.id,
          fetched: 0,
          inserted: 0,
          skippedDuplicates: 0,
          errors: [`Unknown source_type "${source.source_type}" — no connector implemented`],
        });
    }
  }

  return results;
}

// Example route handler — app/api/cron/ingest-jobs/route.ts
//
// import { runAllIngestion } from "@/lib/ingestion/run-ingestion";
//
// export async function GET(request: Request) {
//   const authHeader = request.headers.get("authorization");
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return new Response("Unauthorized", { status: 401 });
//   }
//   const results = await runAllIngestion();
//   return Response.json({ results });
// }
//
// Configure in vercel.json:
// { "crons": [{ "path": "/api/cron/ingest-jobs", "schedule": "0 */6 * * *" }] }
