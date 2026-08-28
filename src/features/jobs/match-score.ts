// features/jobs/match-score.ts
//
// V1 match score: transparent weighted logic, no ML. Weights per the
// locked spec: certifications 35%, required skills 25%, experience 20%,
// location 10%, salary alignment 5%, career interest 5%. A pure function
// over plain data so the scoring itself is easy to read and test —
// fetching the inputs from the DB is a separate concern (queries.ts).

const EXPERIENCE_ORDER = ["no_experience", "entry_level", "one_to_two", "three_to_five", "five_to_ten", "ten_plus"];

export interface MatchInput {
  userCertificationIds: Set<string>;
  userSkillIds: Set<string>;
  userExperienceLevel: string | null;
  userCity: string | null;
  userState: string | null;
  userDesiredSalaryMin: number | null;
  userDesiredSalaryMax: number | null;
  userCareerInterestCategoryIds: Set<string>;
  jobCertifications: { certificationId: string; name: string; requirementType: "required" | "preferred" }[];
  jobSkills: { skillId: string; name: string; requirementType: "required" | "preferred" }[];
  jobExperienceLevel: string | null;
  jobCity: string | null;
  jobState: string | null;
  jobSalaryMin: number | null;
  jobSalaryMax: number | null;
  jobCareerCategoryId: string | null;
}

export interface MatchResult {
  score: number; // 0-100
  hasMissingRequiredCertification: boolean;
  certifications: { name: string; met: boolean; requirementType: "required" | "preferred" }[];
  skills: { name: string; met: boolean; requirementType: "required" | "preferred" }[];
  experience: { met: boolean; applicable: boolean };
  location: { met: boolean; applicable: boolean };
  salary: { met: boolean; applicable: boolean };
  careerInterest: { met: boolean; applicable: boolean };
}

export function computeMatchScore(input: MatchInput): MatchResult {
  let points = 0;

  // Certifications — 35%. Every required cert not held drags this
  // category toward zero; this is the one category where "missing" gets
  // flagged prominently in the UI regardless of the overall score.
  const certifications = input.jobCertifications.map((c) => ({
    name: c.name,
    requirementType: c.requirementType,
    met: input.userCertificationIds.has(c.certificationId),
  }));
  const hasMissingRequiredCertification = certifications.some((c) => c.requirementType === "required" && !c.met);
  if (certifications.length === 0) {
    points += 35;
  } else {
    const metCount = certifications.filter((c) => c.met).length;
    points += 35 * (metCount / certifications.length);
  }

  // Required skills — 25%. Preferred-only skills are shown in the
  // checklist but don't count against the score.
  const requiredSkills = input.jobSkills.filter((s) => s.requirementType === "required");
  const skills = input.jobSkills.map((s) => ({
    name: s.name,
    requirementType: s.requirementType,
    met: input.userSkillIds.has(s.skillId),
  }));
  if (requiredSkills.length === 0) {
    points += 25;
  } else {
    const metCount = requiredSkills.filter((s) => input.userSkillIds.has(s.skillId)).length;
    points += 25 * (metCount / requiredSkills.length);
  }

  // Experience — 20%. Meeting or exceeding the job's level is full
  // credit; one level short is half credit; further short is zero.
  // No job-side requirement, or no user-side data, means nothing to
  // evaluate — full credit by default rather than penalizing missing data.
  let experienceMet = true;
  const experienceApplicable = !!input.jobExperienceLevel && !!input.userExperienceLevel;
  if (experienceApplicable) {
    const userIdx = EXPERIENCE_ORDER.indexOf(input.userExperienceLevel!);
    const jobIdx = EXPERIENCE_ORDER.indexOf(input.jobExperienceLevel!);
    const gap = jobIdx - userIdx;
    experienceMet = gap <= 0;
    points += gap <= 0 ? 20 : gap === 1 ? 10 : 0;
  } else {
    points += 20;
  }

  // Location — 10%. Exact city+state match only; no penalty when either
  // side lacks location data to compare.
  const locationApplicable = !!input.jobCity && !!input.userCity;
  const locationMet = !locationApplicable || (input.jobCity === input.userCity && input.jobState === input.userState);
  points += locationApplicable ? (locationMet ? 10 : 0) : 10;

  // Salary alignment — 5%. Full credit if the ranges overlap at all, or
  // if either side hasn't specified a range.
  const salaryApplicable =
    (input.jobSalaryMin != null || input.jobSalaryMax != null) &&
    (input.userDesiredSalaryMin != null || input.userDesiredSalaryMax != null);
  let salaryMet = true;
  if (salaryApplicable) {
    const jobMin = input.jobSalaryMin ?? input.jobSalaryMax!;
    const jobMax = input.jobSalaryMax ?? input.jobSalaryMin!;
    const userMin = input.userDesiredSalaryMin ?? input.userDesiredSalaryMax!;
    const userMax = input.userDesiredSalaryMax ?? input.userDesiredSalaryMin!;
    salaryMet = jobMax >= userMin && jobMin <= userMax;
  }
  points += salaryApplicable ? (salaryMet ? 5 : 0) : 5;

  // Career interest — 5%. Full credit if the job's category is one the
  // user said they're interested in, or if they haven't set any interests.
  const careerInterestApplicable = !!input.jobCareerCategoryId && input.userCareerInterestCategoryIds.size > 0;
  const careerInterestMet =
    !careerInterestApplicable || input.userCareerInterestCategoryIds.has(input.jobCareerCategoryId!);
  points += careerInterestApplicable ? (careerInterestMet ? 5 : 0) : 5;

  return {
    score: Math.round(points),
    hasMissingRequiredCertification,
    certifications,
    skills,
    experience: { met: experienceMet, applicable: experienceApplicable },
    location: { met: locationMet, applicable: locationApplicable },
    salary: { met: salaryMet, applicable: salaryApplicable },
    careerInterest: { met: careerInterestMet, applicable: careerInterestApplicable },
  };
}
