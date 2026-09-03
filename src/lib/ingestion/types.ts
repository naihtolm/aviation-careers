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
  board_token?: string; // greenhouse, lever -- the company's identifier in the API's URL path
  keyword?: string; // usajobs -- search keyword; results can span many agencies from one source
}

export interface LeverPosting {
  id: string;
  text: string; // title
  categories: {
    location?: string;
    team?: string;
    commitment?: string;
    department?: string;
  };
  descriptionPlain?: string;
  description?: string; // HTML
  lists?: { text: string; content: string }[];
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
  workplaceType?: string; // "on-site" | "remote" | "hybrid"
}

export interface UsaJobsSearchResult {
  SearchResult: {
    SearchResultCount: number;
    SearchResultItems: {
      MatchedObjectId: string;
      MatchedObjectDescriptor: {
        PositionID: string;
        PositionTitle: string;
        PositionURI: string;
        OrganizationName: string;
        DepartmentName: string;
        PositionLocationDisplay: string;
        UserArea: { Details: { JobSummary?: string } };
        PositionRemuneration?: { MinimumRange: string; MaximumRange: string; RateIntervalCode: string }[];
        PublicationStartDate: string;
      };
    }[];
  };
}

export interface IngestionResult {
  sourceId: string;
  fetched: number;
  inserted: number;
  skippedDuplicates: number;
  errors: string[];
}
