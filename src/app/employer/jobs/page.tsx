import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/features/profile/queries";
import { getEmployerContext, getCompanyJobs } from "@/features/employers/queries";
import { ManageJobsList } from "@/components/employers/ManageJobsList";

export default async function EmployerJobsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const context = await getEmployerContext(user.id);
  if (!context) redirect("/employers/sign-up");
  if (context.company.status !== "active") redirect("/employer/verification");

  const jobs = await getCompanyJobs(context.company.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Your Jobs</h1>
        <Link href="/employer/jobs/new" className="bg-accent-200 text-board hover:bg-accent-100 transition-colors px-4 py-2 rounded-md text-sm font-medium">
          Post a Job
        </Link>
      </div>
      <ManageJobsList jobs={jobs as any} />
    </div>
  );
}
