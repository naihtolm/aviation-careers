import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/features/profile/queries";
import { getEmployerContext, getCompanyJobs } from "@/features/employers/queries";

export default async function EmployerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const context = await getEmployerContext(user.id);
  if (!context) redirect("/employers/sign-up");
  if (context.company.status !== "active") redirect("/employer/verification");

  const jobs = await getCompanyJobs(context.company.id);
  const activeCount = jobs.filter((j) => j.status === "active").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + j.applicantCount, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">{context.company.name}</h1>
      <p className="text-sm text-slate-500 mt-1">Employer dashboard</p>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-2xl font-semibold text-slate-900">{activeCount}</p>
          <p className="text-sm text-slate-500 mt-1">Active jobs</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-2xl font-semibold text-slate-900">{totalApplicants}</p>
          <p className="text-sm text-slate-500 mt-1">Native applicants</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-2xl font-semibold text-slate-900">{jobs.length}</p>
          <p className="text-sm text-slate-500 mt-1">Total jobs posted</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Link href="/employer/jobs/new" className="block border rounded-lg p-4 bg-brand-600 text-white hover:bg-brand-700 transition-colors">
          <p className="font-medium">Post a Job</p>
          <p className="text-sm text-slate-300 mt-1">Create a new listing.</p>
        </Link>
        <Link href="/employer/jobs" className="border rounded-lg p-4 bg-white hover:border-slate-400 hover:shadow-md transition-all">
          <p className="font-medium text-slate-900">Manage Jobs</p>
          <p className="text-sm text-slate-500 mt-1">{jobs.length} total</p>
        </Link>
        <Link href="/employer/company" className="border rounded-lg p-4 bg-white hover:border-slate-400 hover:shadow-md transition-all">
          <p className="font-medium text-slate-900">Company Profile</p>
          <p className="text-sm text-slate-500 mt-1">Edit your company info.</p>
        </Link>
        <Link href="/employer/analytics" className="border rounded-lg p-4 bg-white hover:border-slate-400 hover:shadow-md transition-all">
          <p className="font-medium text-slate-900">Analytics</p>
          <p className="text-sm text-slate-500 mt-1">Views and applies over time.</p>
        </Link>
      </div>
    </div>
  );
}
