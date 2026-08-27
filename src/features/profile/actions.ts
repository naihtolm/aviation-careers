"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";

async function requireUser() {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return { supabase, user };
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// certifications/skills are shared reference tables — RLS only grants
// public read to regular clients (writes go through service role, same
// pattern as companies in the admin review flow). The requireUser() call
// each caller makes first is what stands in for authorization here.
async function findOrCreateCertification(name: string) {
  const db = getServiceClient();
  const { data: existing } = await db.from("certifications").select("id").ilike("name", name).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await db.from("certifications").insert({ name }).select("id").single();
  if (error) return null;
  return created.id;
}

async function findOrCreateSkill(name: string) {
  const db = getServiceClient();
  const { data: existing } = await db.from("skills").select("id").ilike("name", name).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await db.from("skills").insert({ name, slug: slugify(name) }).select("id").single();
  if (error) return null;
  return created.id;
}

export interface OnboardingInput {
  careerCategoryIds: string[];
  experienceLevel: string | null;
  city: string;
  state: string;
  willingToRelocate: boolean;
  openToRemote: boolean;
  certificationNames: string[];
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
}

export async function completeOnboarding(input: OnboardingInput) {
  const { supabase, user } = await requireUser();

  const { error: profileError } = await supabase.from("job_seeker_profiles").upsert(
    {
      user_id: user.id,
      city: input.city || null,
      state: input.state || null,
      willing_to_relocate: input.willingToRelocate,
      open_to_remote: input.openToRemote,
      experience_level: input.experienceLevel || null,
      desired_salary_min: input.desiredSalaryMin,
      desired_salary_max: input.desiredSalaryMax,
    },
    { onConflict: "user_id" }
  );
  if (profileError) return { error: profileError.message };

  if (input.careerCategoryIds.length > 0) {
    await supabase
      .from("job_seeker_career_interests")
      .insert(input.careerCategoryIds.map((categoryId) => ({ user_id: user.id, category_id: categoryId })));
  }

  for (const name of input.certificationNames) {
    if (!name.trim()) continue;
    const certificationId = await findOrCreateCertification(name.trim());
    if (!certificationId) continue;
    await supabase.from("user_certifications").insert({ user_id: user.id, certification_id: certificationId, source: "manual" });
  }

  await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);

  redirect("/dashboard");
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("job_seeker_profiles")
    .update({
      headline: String(formData.get("headline") ?? "") || null,
      professional_summary: String(formData.get("professional_summary") ?? "") || null,
      city: String(formData.get("city") ?? "") || null,
      state: String(formData.get("state") ?? "") || null,
      willing_to_relocate: formData.get("willing_to_relocate") === "on",
      open_to_remote: formData.get("open_to_remote") === "on",
      experience_level: String(formData.get("experience_level") ?? "") || null,
      desired_salary_min: formData.get("desired_salary_min") ? Number(formData.get("desired_salary_min")) : null,
      desired_salary_max: formData.get("desired_salary_max") ? Number(formData.get("desired_salary_max")) : null,
      profile_visibility: String(formData.get("profile_visibility") ?? "private"),
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  const categoryIds = formData.getAll("career_category_ids").map(String);
  await supabase.from("job_seeker_career_interests").delete().eq("user_id", user.id);
  if (categoryIds.length > 0) {
    await supabase
      .from("job_seeker_career_interests")
      .insert(categoryIds.map((categoryId) => ({ user_id: user.id, category_id: categoryId })));
  }

  revalidatePath("/dashboard/profile");
  return { error: null };
}

export async function addExperience(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from("user_experience").insert({
    user_id: user.id,
    company_name: String(formData.get("company_name") ?? ""),
    job_title: String(formData.get("job_title") ?? ""),
    location: String(formData.get("location") ?? "") || null,
    start_date: String(formData.get("start_date") ?? "") || null,
    end_date: String(formData.get("end_date") ?? "") || null,
    is_current: formData.get("is_current") === "on",
    description: String(formData.get("description") ?? "") || null,
    source: "manual",
  });
  revalidatePath("/dashboard/profile");
}

export async function deleteExperience(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("user_experience").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/profile");
}

export async function addEducation(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from("user_education").insert({
    user_id: user.id,
    school_name: String(formData.get("school_name") ?? ""),
    degree: String(formData.get("degree") ?? "") || null,
    field_of_study: String(formData.get("field_of_study") ?? "") || null,
    graduation_date: String(formData.get("graduation_date") ?? "") || null,
  });
  revalidatePath("/dashboard/profile");
}

export async function deleteEducation(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("user_education").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/profile");
}

export async function addSkill(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const skillId = await findOrCreateSkill(name);
  if (!skillId) return;
  await supabase.from("user_skills").upsert(
    { user_id: user.id, skill_id: skillId, source: "manual" },
    { onConflict: "user_id,skill_id" }
  );
  revalidatePath("/dashboard/profile");
}

export async function deleteSkill(skillId: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("user_skills").delete().eq("user_id", user.id).eq("skill_id", skillId);
  revalidatePath("/dashboard/profile");
}

export async function addCertification(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const certificationId = await findOrCreateCertification(name);
  if (!certificationId) return;
  await supabase.from("user_certifications").insert({ user_id: user.id, certification_id: certificationId, source: "manual" });
  revalidatePath("/dashboard/profile");
}

export async function deleteCertification(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("user_certifications").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/profile");
}
