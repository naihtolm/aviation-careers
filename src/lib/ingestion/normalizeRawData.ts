// lib/ingestion/normalizeRawData.ts
//
// The admin review UI (RawJobCard.tsx) was written against Greenhouse's
// raw_data shape specifically (title / location.name / content /
// absolute_url / company_name) before any other connector existed.
// Rather than teach that already-large component to branch on
// source_type at every field access, this maps every source's raw
// payload into that same shape once, here, server-side, right before
// it reaches the client. The row actually stored in raw_job_records is
// untouched -- this only reshapes what the review screen renders from,
// so "raw data is never lost" (the architecture decision from the
// original ingestion spec) still holds.

import type { GreenhouseJob, LeverPosting, UsaJobsSearchResult } from "./types";

type UsaJobsItem = UsaJobsSearchResult["SearchResult"]["SearchResultItems"][number];

export interface NormalizedRawData {
  title?: string;
  location?: { name?: string } | null;
  content?: string;
  absolute_url?: string;
  company_name?: string;
}

export function normalizeRawData(sourceType: string, rawData: unknown): NormalizedRawData {
  switch (sourceType) {
    case "lever": {
      const posting = rawData as LeverPosting;
      return {
        title: posting.text,
        location: { name: posting.categories?.location },
        content: posting.description ?? posting.descriptionPlain,
        absolute_url: posting.hostedUrl,
        company_name: undefined, // Lever postings don't carry the company name -- resolved via the ingestion source -> company mapping instead, same as every other source.
      };
    }

    case "usajobs": {
      // Each posting carries its own agency -- see usajobs-connector.ts's
      // header comment on why company_name is per-item here rather than
      // resolved once for the whole source, unlike greenhouse/lever.
      const item = rawData as UsaJobsItem;
      const d = item.MatchedObjectDescriptor;
      return {
        title: d.PositionTitle,
        location: { name: d.PositionLocationDisplay },
        content: d.UserArea?.Details?.JobSummary,
        absolute_url: d.PositionURI,
        company_name: d.OrganizationName,
      };
    }

    case "greenhouse":
    default: {
      // Greenhouse's own shape, already what RawJobCard expects -- also
      // the fallback for any source_type this hasn't been taught yet,
      // so an unrecognized source degrades to "fields are blank" rather
      // than throwing and taking the whole review queue down.
      const job = rawData as GreenhouseJob & { company_name?: string };
      return {
        title: job.title,
        location: job.location,
        content: job.content,
        absolute_url: job.absolute_url,
        company_name: job.company_name,
      };
    }
  }
}
