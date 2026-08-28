import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/features/profile/queries";
import { getSavedJobs } from "@/features/jobs/queries";
import { JobCard } from "@/components/jobs/JobCard";

export default async function SavedJobsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const jobs = await getSavedJobs(user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Saved Jobs</h1>

      {jobs.length === 0 ? (
        <div className="border rounded-lg p-8 text-center bg-white mt-6">
          <p className="text-slate-900 font-medium">No saved jobs yet</p>
          <p className="text-sm text-slate-500 mt-1">Save jobs you're interested in to find them here later.</p>
          <Link href="/jobs" className="inline-block mt-3 text-sm text-blue-600 hover:underline">
            Browse jobs →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {jobs.map((job: any) => (
            <JobCard key={job.id} job={job} initialSaved />
          ))}
        </div>
      )}
    </div>
  );
}
