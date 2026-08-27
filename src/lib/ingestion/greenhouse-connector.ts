// lib/ingestion/greenhouse-connector.ts
//
// Fetches all jobs from a single company's public Greenhouse board and
// upserts them into raw_job_records. Never writes to `jobs` directly —
// normalization happens through the admin review screen.

import { createHash } from "crypto";
import { getServiceClient } from "@/lib/supabase/service";
import type {
  GreenhouseBoardResponse,
  IngestionResult,
} from "./types";

function hashJob(job: unknown): string {
  return createHash("sha256").update(JSON.stringify(job)).digest("hex");
}

export async function ingestGreenhouseBoard(
  sourceId: string,
  boardToken: string
): Promise<IngestionResult> {
  const supabase = getServiceClient();
  const result: IngestionResult = {
    sourceId,
    fetched: 0,
    inserted: 0,
    skippedDuplicates: 0,
    errors: [],
  };

  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;

  let data: GreenhouseBoardResponse;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Greenhouse API returned ${res.status} for board "${boardToken}"`);
    }
    data = await res.json();
  } catch (err) {
    result.errors.push(String(err));
    return result;
  }

  result.fetched = data.jobs.length;

  // Insert one at a time with ON CONFLICT DO NOTHING so a partial failure
  // part-way through doesn't require re-fetching everything. At V1 volumes
  // (a handful of employer boards) this is simpler to reason about than a
  // bulk upsert; revisit if a single board regularly returns hundreds of jobs.
  for (const job of data.jobs) {
    const rawHash = hashJob(job);

    const { error, data: inserted } = await supabase
      .from("raw_job_records")
      .insert({
        source_id: sourceId,
        external_id: String(job.id),
        raw_data: job,
        raw_hash: rawHash,
        status: "received",
      })
      .select("id")
      .maybeSingle();

    if (error) {
      // Unique violation on (source_id, raw_hash) means we've already
      // ingested this exact job payload — that's expected, not a real error.
      if (error.code === "23505") {
        result.skippedDuplicates += 1;
      } else {
        result.errors.push(`Job ${job.id}: ${error.message}`);
      }
      continue;
    }

    if (inserted) {
      result.inserted += 1;
    }
  }

  return result;
}
