import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getFullProfile, profileCompletionPercent } from "@/features/profile/queries";

function nextStepSuggestion(data: Awaited<ReturnType<typeof getFullProfile>>) {
  if (!data.seekerProfile?.city) return "Add your location so we can find jobs near you.";
  if (data.experience.length === 0) return "Add your work experience to improve your matches.";
  if (data.skills.length === 0) return "Add your skills so employers can find you.";
  if (data.certifications.length === 0) return "Add your certifications — especially if your role requires FAA credentials.";
  return "Your profile is looking good!";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const data = await getFullProfile(user.id);
  const completion = profileCompletionPercent(data);

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
          <div className="bg-slate-900 h-2 rounded-full" style={{ width: `${completion}%` }} />
        </div>
        <p className="text-sm text-slate-500 mt-3">{nextStepSuggestion(data)}</p>
        <Link href="/dashboard/profile" className="inline-block mt-3 text-sm text-blue-600 hover:underline">
          Edit profile →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Link href="/jobs" className="border rounded-lg p-4 bg-white hover:border-slate-400">
          <p className="font-medium text-slate-900">Browse jobs</p>
          <p className="text-sm text-slate-500 mt-1">Search real aviation openings.</p>
        </Link>
        <Link href="/dashboard/profile" className="border rounded-lg p-4 bg-white hover:border-slate-400">
          <p className="font-medium text-slate-900">Your profile</p>
          <p className="text-sm text-slate-500 mt-1">
            {data.experience.length} experience · {data.education.length} education · {data.skills.length} skills
          </p>
        </Link>
      </div>

      <p className="text-xs text-slate-400 mt-8">
        Saved jobs, application tracking, and job alerts are coming in a future update.
      </p>
    </div>
  );
}
