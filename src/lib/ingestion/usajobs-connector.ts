// lib/ingestion/usajobs-connector.ts
//
// Fetches federal aviation postings (FAA, TSA, DoD aviation maintenance,
// etc.) from the USAJOBS Search API and upserts them into
// raw_job_records, same "never write to jobs directly" rule as every
// other connector.
//
// Two real differences from Greenhouse/Lever:
//
// 1. Auth. USAJOBS requires a free, self-service API key registered to
//    a real email at developer.usajobs.gov -- not something this code
//    can obtain on its own. Set USAJOBS_API_KEY and USAJOBS_USER_AGENT
//    (the email you registered with) in the environment before this
//    connector can run; until then it fails clean with an error in the
//    result rather than a stack trace.
//
// 2. Company mapping. Greenhouse/Lever sources map 1:1 to one employer
//    (migration 028's company_id on job_ingestion_sources). A single
//    USAJOBS search can return postings from many different agencies
//    (FAA, TSA, DoD components) in one call, so a USAJOBS source should
//    be set up with company_id = null -- normalizeRawData.ts fills
//    company_name per-posting instead, and the review screen's existing
//    "no defaultCompanyId -> prefill the new-company field from
//    raw_data.company_name" fallback (already there for exactly this
//    case) takes it from there.

import { createHash } from "crypto";
import { getServiceClient } from "@/lib/supabase/service";
import type { IngestionResult, UsaJobsSearchResult } from "./types";

function hashJob(job: unknown): string {
  return createHash("sha256").update(JSON.stringify(job)).digest("hex");
}

export async function ingestUsaJobsSearch(
  sourceId: string,
  keyword: string
): Promise<IngestionResult> {
  const result: IngestionResult = {
    sourceId,
    fetched: 0,
    inserted: 0,
    skippedDuplicates: 0,
    errors: [],
  };

  const apiKey = process.env.USAJOBS_API_KEY;
  const userAgent = process.env.USAJOBS_USER_AGENT;
  if (!apiKey || !userAgent) {
    result.errors.push(
      "USAJOBS_API_KEY / USAJOBS_USER_AGENT not set -- register a free key at developer.usajobs.gov first."
    );
    return result;
  }

  const supabase = getServiceClient();
  const url = `https://data.usajobs.gov/api/search?Keyword=${encodeURIComponent(keyword)}&ResultsPerPage=250`;

  let data: UsaJobsSearchResult;
  try {
    const res = await fetch(url, {
      headers: {
        Host: "data.usajobs.gov",
        "User-Agent": userAgent,
        "Authorization-Key": apiKey,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`USAJOBS API returned ${res.status} for keyword "${keyword}"`);
    }
    data = await res.json();
  } catch (err) {
    result.errors.push(String(err));
    return result;
  }

  const items = data.SearchResult?.SearchResultItems ?? [];
  result.fetched = items.length;

  for (const item of items) {
    const rawHash = hashJob(item);

    const { error, data: inserted } = await supabase
      .from("raw_job_records")
      .insert({
        source_id: sourceId,
        external_id: item.MatchedObjectId,
        raw_data: item,
        raw_hash: rawHash,
        status: "received",
      })
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        result.skippedDuplicates += 1;
      } else {
        result.errors.push(`Posting ${item.MatchedObjectId}: ${error.message}`);
      }
      continue;
    }

    if (inserted) {
      result.inserted += 1;
    }
  }

  return result;
}
