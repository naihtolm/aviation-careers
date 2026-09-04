// features/companies/reviewQueries.ts
import { createServerActionClient } from "@/lib/supabase/server";

export async function getCompanyReviews(companyId: string) {
  const supabase = await createServerActionClient();

  const [{ data: reviews }, { data: userData }] = await Promise.all([
    // RLS (company_reviews_public_read_approved OR company_reviews_owner_read_own)
    // means this can come back with more than just approved rows when the
    // caller is signed in and owns one of them -- filtered back apart below.
    supabase
      .from("company_reviews")
      .select("id, rating, title, body, pros, cons, employment_status, status, created_at, user_id, profiles ( display_name )")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const currentUserId = userData?.user?.id ?? null;
  const approved = (reviews ?? []).filter((r) => r.status === "approved");
  const ownReview = currentUserId ? (reviews ?? []).find((r) => r.user_id === currentUserId) ?? null : null;

  const count = approved.length;
  const averageRating = count > 0 ? approved.reduce((sum, r) => sum + r.rating, 0) / count : null;

  return { reviews: approved, ownReview, averageRating, count };
}
