import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/features/profile/queries";
import { getEmployerContext, getJobForEdit } from "@/features/employers/queries";
import { getCareers } from "@/features/careers/queries";
import { JobPostForm, type JobPostFormInitial } from "@/components/employers/JobPostForm";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const context = await getEmployerContext(user.id);
  if (!context) redirect("/employers/sign-up");
  if (context.company.status !== "active") redirect("/employer/verification");

  const [job, careers] = await Promise.all([getJobForEdit(id, context.company.id), getCareers()]);
  if (!job) notFound();

  const primaryLocation = (job.job_locations ?? []).find((l: any) => l.is_primary) ?? job.job_locations?.[0];
  const compensation = job.job_compensation?.[0];

  const initial: JobPostFormInitial = {
    title: job.title,
    careerId: job.career_id ?? "",
    employmentType: job.employment_type ?? "full_time",
    workArrangement: job.work_arrangement ?? "on_site",
    city: primaryLocation?.locations?.city ?? "",
    state: primaryLocation?.locations?.state_code ?? "",
    skillsInput: (job.job_skills ?? []).map((s: any) => s.skills?.name).filter(Boolean).join(", "),
    certsInput: (job.job_certifications ?? []).map((c: any) => c.certifications?.name).filter(Boolean).join(", "),
    salaryMin: compensation?.min_amount != null ? String(compensation.min_amount) : "",
    salaryMax: compensation?.max_amount != null ? String(compensation.max_amount) : "",
    salaryPeriod: compensation?.period === "hour" ? "hour" : "year",
    salaryPublic: compensation?.is_public ?? true,
    applicationType: job.application_type,
    applicationUrl: job.application_url ?? "",
    description: job.description ?? "",
    questions: job.screening_questions ?? [],
    expiresAt: job.expires_at ? new Date(job.expires_at).toISOString().slice(0, 10) : "",
    alreadyLive: job.status !== "draft",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-white mb-1">Edit Job</h1>
      <p className="text-sm text-slate-400 mb-6">
        {initial.alreadyLive ? `Editing as ${context.company.name}` : `Finish this draft for ${context.company.name}`}
      </p>
      <JobPostForm careers={careers.map((c: any) => ({
        id: c.id,
        name: c.name,
        categoryName: c.career_categories?.name ?? null,
      }))} jobId={job.id} initial={initial} />
    </div>
  );
}
