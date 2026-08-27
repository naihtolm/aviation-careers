// lib/ingestion/types.ts

export interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  location: { name: string } | null;
  content: string; // HTML job description
  absolute_url: string;
  departments: { id: number; name: string }[];
  offices: { id: number; name: string; location?: string }[];
  metadata?: { name: string; value: unknown }[] | null;
}

export interface GreenhouseBoardResponse {
  jobs: GreenhouseJob[];
  meta: { total: number };
}

export interface IngestionSourceConfig {
  board_token: string;
}

export interface IngestionResult {
  sourceId: string;
  fetched: number;
  inserted: number;
  skippedDuplicates: number;
  errors: string[];
}
