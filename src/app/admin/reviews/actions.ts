// app/admin/reviews/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";

async function assertIsAdmin() {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: isAdmin } = await supabase.rpc("has_role", { target_role: "platform_admin" });
  if (!isAdmin) throw new Error("Not authorized");

  return user.id;
}

export async function approveReview(reviewId: string) {
  const adminUserId = await assertIsAdmin();
  const db = getServiceClient();

  await db
    .from("company_reviews")
    .update({ status: "approved", moderated_at: new Date().toISOString(), moderated_by: adminUserId })
    .eq("id", reviewId);

  await db.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "approve_company_review",
    entity_type: "company_reviews",
    entity_id: reviewId,
  });

  revalidatePath("/admin/reviews");
}

export async function rejectReview(reviewId: string, reason: string) {
  const adminUserId = await assertIsAdmin();
  const db = getServiceClient();

  await db
    .from("company_reviews")
    .update({ status: "rejected", moderated_at: new Date().toISOString(), moderated_by: adminUserId })
    .eq("id", reviewId);

  await db.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "reject_company_review",
    entity_type: "company_reviews",
    entity_id: reviewId,
    new_data: { reason },
  });

  revalidatePath("/admin/reviews");
}
