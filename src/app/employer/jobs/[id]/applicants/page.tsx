import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/features/profile/queries";
import { getEmployerContext, getJobForEmployer, getJobApplicants } from "@/features/employers/queries";
import { getResumeDownloadUrl } from "@/features/resumes/queries";
import { ApplicantList } from "@/components/employers/ApplicantList";

export default async function JobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const context = await getEmployerContext(user.id);
  if (!context) redirect("/employers/sign-up");
  if (context.company.status !== "active") redirect("/employer/verification");

  const job = await getJobForEmployer(id, context.company.id);
  if (!job) notFound();

  const applicants = await getJobApplicants(id);
  const withResumeUrls = await Promise.all(
    applicants.map(async (a: any) => ({
      ...a,
      resumeUrl: a.resume ? await getResumeDownloadUrl(a.resume.storage_path) : null,
      resumeFileName: a.resume?.file_name ?? null,
    }))
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/employer/jobs" className="text-sm text-slate-500 hover:underline">
        ← Your Jobs
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-6">Applicants — {job.title}</h1>
      <ApplicantList jobId={id} applicants={withResumeUrls} />
    </div>
  );
}
