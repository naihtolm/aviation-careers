import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getFullProfile, profileCompletionPercent } from "@/features/profile/queries";
import { getSavedJobs } from "@/features/jobs/queries";
import { getApplicationsByStatus } from "@/features/applications/queries";
import { getAlerts } from "@/features/alerts/queries";

function nextStepSuggestion(data: Awaited<ReturnType<typeof getFullProfile>>) {
  if (!data.seekerProfile?.city) return "Add your location so we can find jobs near you.";
  if (data.careerInterestIds.length === 0) return "Tell us which careers you're interested in to see better matches.";
  if (!data.seekerProfile?.experience_level) return "Add your experience level so we can tailor your recommendations.";
  if (data.experience.length === 0) return "Add your work experience to improve your matches.";
  if (data.skills.length === 0) return "Add your skills so employers can find you.";
  if (data.certifications.length === 0) return "Add your certifications — especially if your role requires FAA credentials.";
  return "Your profile is looking good!";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [data, savedJobs, applications, alerts] = await Promise.all([
    getFullProfile(user.id),
    getSavedJobs(user.id),
    getApplicationsByStatus(user.id),
    getAlerts(user.id),
  ]);
  const completion = profileCompletionPercent(data);
  const applicationCount = Object.values(applications).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome{data.profile?.first_name ? `, ${data.profile.first_name}` : ""}
      </h1>

      <div className="border rounded-lg p-4 bg-white mt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-900">Profile completion</p>
          <p className="text-sm text-slate-500">{completion}%</p>
        </div>
        <div className="bg-slate-100 rounded-full h-2">
          <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${completion}%` }} />
        </div>
        <p className="text-sm text-slate-500 mt-3">{nextStepSuggestion(data)}</p>
        <Link href="/dashboard/profile" className="inline-block mt-3 text-sm text-brand-600 hover:underline">
          Edit profile →
        </Link>
      </div>

      <Link
        href="/dashboard/resume"
        className="block border rounded-lg p-4 bg-brand-600 text-white mt-4 hover:bg-brand-700 transition-colors"
      >
        <p className="font-medium">Upload your resume</p>
        <p className="text-sm text-slate-300 mt-1">
          We'll pull out your experience, education, skills, and certifications — you review before anything saves.
        </p>
      </Link>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Link href="/jobs" className="border rounded-lg p-4 bg-white hover:border-slate-400 hover:shadow-md transition-all">
          <p className="font-medium text-slate-900">Browse jobs</p>
          <p className="text-sm text-slate-500 mt-1">Search real aviation openings.</p>
        </Link>
        <Link href="/dashboard/profile" className="border rounded-lg p-4 bg-white hover:border-slate-400 hover:shadow-md transition-all">
          <p className="font-medium text-slate-900">Your profile</p>
          <p className="text-sm text-slate-500 mt-1">
            {data.experience.length} experience · {data.education.length} education · {data.skills.length} skills
          </p>
        </Link>
        <Link href="/dashboard/saved" className="border rounded-lg p-4 bg-white hover:border-slate-400 hover:shadow-md transition-all">
          <p className="font-medium text-slate-900">Saved jobs</p>
          <p className="text-sm text-slate-500 mt-1">{savedJobs.length} saved</p>
        </Link>
        <Link href="/dashboard/applications" className="border rounded-lg p-4 bg-white hover:border-slate-400 hover:shadow-md transition-all">
          <p className="font-medium text-slate-900">Applications</p>
          <p className="text-sm text-slate-500 mt-1">{applicationCount} tracked</p>
        </Link>
        <Link href="/dashboard/alerts" className="border rounded-lg p-4 bg-white hover:border-slate-400 hover:shadow-md transition-all sm:col-span-2">
          <p className="font-medium text-slate-900">Job alerts</p>
          <p className="text-sm text-slate-500 mt-1">
            {alerts.filter((a: any) => a.is_active).length} active alert{alerts.filter((a: any) => a.is_active).length === 1 ? "" : "s"}
          </p>
        </Link>
      </div>
    </div>
  );
}
