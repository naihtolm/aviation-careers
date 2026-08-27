// lib/supabase/service.ts
//
// Service-role client — bypasses RLS entirely. Only for:
//   1. Background/scheduled jobs with no user session (ingestion connectors)
//   2. Server actions that have already independently verified the caller's
//      role (e.g. approveRawJob checks has_role('platform_admin') FIRST,
//      then uses this client to write across tables that admin ops touch)
//
// NEVER import this file into anything that runs in the browser, and
// NEVER pass this client's result back to client code un-filtered.
//
// This is the canonical version. lib/ingestion/greenhouse-connector.ts,
// lib/ingestion/run-ingestion.ts, and app/admin/jobs/review/actions.ts
// currently each define their own local getServiceClient() — refactor
// those three to import getServiceClient from here instead of keeping
// three copies of the same twelve lines in sync by hand.

import { createClient } from "@supabase/supabase-js";

export function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
