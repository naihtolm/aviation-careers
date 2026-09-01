"use server";

import { redirect } from "next/navigation";
import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";

// companies/employer_organizations/employer_members/company_verifications
// have no client-facing INSERT policy (010/015_rls_policies.sql) --
// employer registration is exactly the kind of privileged write the
// schema's own design note calls for routing through the service
// client after an app-level auth check, not a broader RLS carve-out.
export async function registerEmployer(formData: FormData) {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "sign_in_required" as const };

  const companyName = String(formData.get("companyName") ?? "").trim();
  const companyType = String(formData.get("companyType") ?? "other");
  const website = String(formData.get("website") ?? "").trim();
  const verificationMethod = String(formData.get("verificationMethod") ?? "").trim();
  const veteranFriendly = formData.get("veteranFriendly") === "on";

  if (!companyName) return { error: "Company name is required." };

  // A user already belonging to an employer org shouldn't create a
  // second one via this form.
  const { data: existingMembership } = await supabase
    .from("employer_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingMembership) return { error: "You're already part of an employer account." };

  const db = getServiceClient();
  const slug = companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data: company, error: companyError } = await db
    .from("companies")
    .insert({
      name: companyName,
      slug,
      company_type: companyType,
      website: website || null,
      status: "pending",
      verification_status: "pending",
      veteran_friendly: veteranFriendly,
    })
    .select("id")
    .single();
  if (companyError) return { error: companyError.message };

  const { data: org, error: orgError } = await db
    .from("employer_organizations")
    .insert({ company_id: company.id })
    .select("id")
    .single();
  if (orgError) return { error: orgError.message };

  await db.from("employer_members").insert({
    organization_id: org.id,
    user_id: user.id,
    role: "owner",
    status: "active",
  });

  await db.from("company_verifications").insert({
    company_id: company.id,
    verification_method: verificationMethod || null,
    submitted_by: user.id,
    status: "pending",
  });

  redirect("/employer/verification");
}
