import { createServerActionClient } from "@/lib/supabase/server";
import { STATUSES } from "@/features/applications/constants";

export async function getApplicationsByStatus(userId: string) {
  const supabase = await createServerActionClient();
  const { data } = await supabase
    .from("job_applications")
    .select(
      "id, status, notes, applied_at, created_at, external_application_url, jobs ( id, title, slug, companies ( name, slug ) )"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const grouped: Record<(typeof STATUSES)[number], any[]> = {
    interested: [],
    applied: [],
    interviewing: [],
    offer: [],
    rejected: [],
    withdrawn: [],
  };
  for (const row of data ?? []) {
    grouped[row.status as (typeof STATUSES)[number]]?.push(row);
  }
  return grouped;
}
