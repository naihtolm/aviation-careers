import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, Users, ListChecks, Plus, Settings, Building2, BarChart3 } from "lucide-react";
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
        <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-semibold text-slate-900">{activeCount}</p>
            <Briefcase className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-sm text-slate-500 mt-1">Active jobs</p>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-semibold text-slate-900">{totalApplicants}</p>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-sm text-slate-500 mt-1">Native applicants</p>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-semibold text-slate-900">{jobs.length}</p>
            <ListChecks className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-sm text-slate-500 mt-1">Total jobs posted</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Link href="/employer/jobs/new" className="flex items-center gap-3 border rounded-lg p-4 bg-accent-200 text-board hover:bg-accent-100 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium">Post a Job</p>
            <p className="text-sm text-brand-100 mt-0.5">Create a new listing.</p>
          </div>
        </Link>
        <Link href="/employer/jobs" className="flex items-center gap-3 border rounded-lg p-4 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Manage Jobs</p>
            <p className="text-sm text-slate-500 mt-0.5">{jobs.length} total</p>
          </div>
        </Link>
        <Link href="/employer/company" className="flex items-center gap-3 border rounded-lg p-4 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Company Profile</p>
            <p className="text-sm text-slate-500 mt-0.5">Edit your company info.</p>
          </div>
        </Link>
        <Link href="/employer/analytics" className="flex items-center gap-3 border rounded-lg p-4 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Analytics</p>
            <p className="text-sm text-slate-500 mt-0.5">Views and applies over time.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
