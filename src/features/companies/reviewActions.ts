// features/companies/reviewActions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@/lib/supabase/server";

export interface SubmitReviewInput {
  companyId: string;
  companySlug: string;
  rating: number;
  title: string;
  body: string;
  pros: string;
  cons: string;
  employmentStatus: "current_employee" | "former_employee" | "interview_candidate";
}

// Authorization is entirely RLS (company_reviews_owner_insert requires
// user_id = auth.uid()) -- same shape as saveJob in features/jobs/actions.ts.
export async function submitReview(input: SubmitReviewInput) {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "sign_in_required" as const };

  if (input.rating < 1 || input.rating > 5) return { error: "Rating must be between 1 and 5." };
  if (!input.title.trim() || !input.body.trim()) return { error: "A title and review are required." };

  const { error } = await supabase.from("company_reviews").insert({
    company_id: input.companyId,
    user_id: user.id,
    rating: input.rating,
    title: input.title.trim(),
    body: input.body.trim(),
    pros: input.pros.trim() || null,
    cons: input.cons.trim() || null,
    employment_status: input.employmentStatus,
  });

  if (error) {
    // Unique violation on (company_id, user_id) -- they've already
    // reviewed this employer once.
    if (error.code === "23505") return { error: "You've already reviewed this employer." };
    return { error: error.message };
  }

  revalidatePath(`/companies/${input.companySlug}`);
  return { error: null };
}

export async function deleteReview(reviewId: string, companySlug: string) {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "sign_in_required" as const };

  const { error } = await supabase.from("company_reviews").delete().eq("id", reviewId).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/companies/${companySlug}`);
  return { error: null };
}
