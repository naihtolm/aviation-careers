import { createServerActionClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getFullProfile(userId: string) {
  const supabase = await createServerActionClient();
  const [
    { data: profile },
    { data: seekerProfile },
    { data: experience },
    { data: education },
    { data: skills },
    { data: certifications },
    { data: careerInterests },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("job_seeker_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_experience").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
    supabase.from("user_education").select("*").eq("user_id", userId).order("graduation_date", { ascending: false }),
    supabase.from("user_skills").select("skill_id, proficiency_level, skills ( name )").eq("user_id", userId),
    supabase
      .from("user_certifications")
      .select("id, issued_date, expiration_date, verification_status, certifications ( name )")
      .eq("user_id", userId),
    supabase.from("job_seeker_career_interests").select("category_id").eq("user_id", userId),
  ]);

  return {
    profile,
    seekerProfile,
    experience: experience ?? [],
    education: education ?? [],
    skills: skills ?? [],
    certifications: certifications ?? [],
    careerInterestIds: (careerInterests ?? []).map((c) => c.category_id),
  };
}

// Simple, transparent completion score — not the match-score algorithm
// (that's Sprint 5), just "how filled-in is this profile".
export function profileCompletionPercent(data: Awaited<ReturnType<typeof getFullProfile>>) {
  const checks = [
    !!data.seekerProfile?.city,
    !!data.seekerProfile?.experience_level,
    data.careerInterestIds.length > 0,
    !!data.seekerProfile?.desired_salary_min || !!data.seekerProfile?.desired_salary_max,
    data.experience.length > 0,
    data.education.length > 0,
    data.skills.length > 0,
    data.certifications.length > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
