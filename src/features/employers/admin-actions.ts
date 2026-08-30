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

export async function reviewEmployerVerification(
  verificationId: string,
  companyId: string,
  decision: "approved" | "rejected" | "needs_information",
  reviewNotes: string
) {
  const adminUserId = await assertIsAdmin();
  const db = getServiceClient();

  await db
    .from("company_verifications")
    .update({ status: decision, review_notes: reviewNotes || null, reviewed_by: adminUserId, reviewed_at: new Date().toISOString() })
    .eq("id", verificationId);

  await db
    .from("companies")
    .update({
      verification_status: decision,
      status: decision === "approved" ? "active" : decision === "rejected" ? "rejected" : "pending",
    })
    .eq("id", companyId);

  await db.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: `employer_verification_${decision}`,
    entity_type: "companies",
    entity_id: companyId,
    new_data: { verification_id: verificationId, review_notes: reviewNotes },
  });

  revalidatePath("/admin/employers");
}
