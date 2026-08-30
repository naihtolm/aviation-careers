"use server";

import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@/lib/supabase/server";
import { getEmployerContext } from "./queries";

// companies has an "employer member of this company can manage" RLS
// policy (010_rls_policies.sql), so the employer's own session can
// write directly.
export async function updateCompanyProfile(input: {
  description: string;
  website: string;
  employeeSizeRange: string;
}) {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const context = await getEmployerContext(user.id);
  if (!context) return { error: "Not an employer." };

  const { error } = await supabase
    .from("companies")
    .update({
      description: input.description || null,
      website: input.website || null,
      employee_size_range: input.employeeSizeRange || null,
    })
    .eq("id", context.company.id);

  if (error) return { error: error.message };
  revalidatePath("/employer/company");
  return { success: true };
}
