// lib/ingestion/lever-connector.ts
//
// Fetches all postings from a single company's public Lever board and
// upserts them into raw_job_records. Never writes to `jobs` directly --
// normalization happens through the admin review screen.
//
// Lever's Postings API (docs.lever.co/postings) is fully open, no auth,
// per-company by slug -- same shape as Greenhouse's Job Board API, which
// is why this connector mirrors greenhouse-connector.ts line for line
// rather than introducing a different pattern. The one real difference:
// Lever returns a bare array, not { jobs: [...] }.

import { createHash } from "crypto";
import { getServiceClient } from "@/lib/supabase/service";
import type { IngestionResult, LeverPosting } from "./types";

function hashJob(job: unknown): string {
  return createHash("sha256").update(JSON.stringify(job)).digest("hex");
}

export async function ingestLeverBoard(
  sourceId: string,
  companySlug: string
): Promise<IngestionResult> {
  const supabase = getServiceClient();
  const result: IngestionResult = {
    sourceId,
    fetched: 0,
    inserted: 0,
    skippedDuplicates: 0,
    errors: [],
  };

  const url = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;

  let postings: LeverPosting[];
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Lever API returned ${res.status} for company "${companySlug}"`);
    }
    postings = await res.json();
  } catch (err) {
    result.errors.push(String(err));
    return result;
  }

  result.fetched = postings.length;

  for (const posting of postings) {
    const rawHash = hashJob(posting);

    const { error, data: inserted } = await supabase
      .from("raw_job_records")
      .insert({
        source_id: sourceId,
        external_id: posting.id,
        raw_data: posting,
        raw_hash: rawHash,
        status: "received",
      })
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        result.skippedDuplicates += 1;
      } else {
        result.errors.push(`Posting ${posting.id}: ${error.message}`);
      }
      continue;
    }

    if (inserted) {
      result.inserted += 1;
    }
  }

  return result;
}
