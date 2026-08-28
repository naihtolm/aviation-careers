"use server";

import { createServerActionClient } from "@/lib/supabase/server";
import { computeMatchScore, type MatchResult } from "@/features/jobs/match-score";

export async function getMatchScoreForJob(jobId: string): Promise<
  { signedIn: false } | { signedIn: true; result: MatchResult }
> {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { signedIn: false };

  const [
    { data: seekerProfile },
    { data: userCerts },
    { data: userSkills },
    { data: careerInterests },
    { data: job },
  ] = await Promise.all([
    supabase
      .from("job_seeker_profiles")
      .select("city, state, experience_level, desired_salary_min, desired_salary_max")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("user_certifications").select("certification_id").eq("user_id", user.id),
    supabase.from("user_skills").select("skill_id").eq("user_id", user.id),
    supabase.from("job_seeker_career_interests").select("category_id").eq("user_id", user.id),
    supabase
      .from("jobs")
      .select(
        `experience_level,
         career_id,
         careers ( category_id ),
         job_locations ( is_primary, locations ( city, state_code ), airports ( city, state ) ),
         job_compensation ( min_amount, max_amount, is_public ),
         job_certifications ( certification_id, requirement_type, certifications ( name ) ),
         job_skills ( skill_id, requirement_type, skills ( name ) )`
      )
      .eq("id", jobId)
      .maybeSingle(),
  ]);

  if (!job) return { signedIn: true, result: computeMatchScore(emptyMatchInput()) };

  const primaryLocation: any = (job.job_locations ?? []).find((l: any) => l.is_primary) ?? (job.job_locations ?? [])[0];
  const jobCity = primaryLocation?.locations?.city ?? primaryLocation?.airports?.city ?? null;
  const jobState = primaryLocation?.locations?.state_code ?? primaryLocation?.airports?.state ?? null;
  const publicComp = (job.job_compensation ?? []).find((c: any) => c.is_public);

  const result = computeMatchScore({
    userCertificationIds: new Set((userCerts ?? []).map((c) => c.certification_id)),
    userSkillIds: new Set((userSkills ?? []).map((s) => s.skill_id)),
    userExperienceLevel: seekerProfile?.experience_level ?? null,
    userCity: seekerProfile?.city ?? null,
    userState: seekerProfile?.state ?? null,
    userDesiredSalaryMin: seekerProfile?.desired_salary_min ?? null,
    userDesiredSalaryMax: seekerProfile?.desired_salary_max ?? null,
    userCareerInterestCategoryIds: new Set((careerInterests ?? []).map((c) => c.category_id)),
    jobCertifications: (job.job_certifications ?? []).map((c: any) => ({
      certificationId: c.certification_id,
      name: c.certifications?.name ?? "Certification",
      requirementType: c.requirement_type,
    })),
    jobSkills: (job.job_skills ?? []).map((s: any) => ({
      skillId: s.skill_id,
      name: s.skills?.name ?? "Skill",
      requirementType: s.requirement_type,
    })),
    jobExperienceLevel: job.experience_level,
    jobCity,
    jobState,
    jobSalaryMin: publicComp?.min_amount ?? null,
    jobSalaryMax: publicComp?.max_amount ?? null,
    jobCareerCategoryId: (job.careers as any)?.category_id ?? null,
  });

  return { signedIn: true, result };
}

function emptyMatchInput() {
  return {
    userCertificationIds: new Set<string>(),
    userSkillIds: new Set<string>(),
    userExperienceLevel: null,
    userCity: null,
    userState: null,
    userDesiredSalaryMin: null,
    userDesiredSalaryMax: null,
    userCareerInterestCategoryIds: new Set<string>(),
    jobCertifications: [],
    jobSkills: [],
    jobExperienceLevel: null,
    jobCity: null,
    jobState: null,
    jobSalaryMin: null,
    jobSalaryMax: null,
    jobCareerCategoryId: null,
  };
}

export async function saveJob(jobId: string) {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "sign_in_required" as const };

  const { error } = await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: jobId });
  if (error && error.code !== "23505") return { error: error.message };
  return { error: null };
}

export async function unsaveJob(jobId: string) {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "sign_in_required" as const };

  const { error } = await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
  if (error) return { error: error.message };
  return { error: null };
}
