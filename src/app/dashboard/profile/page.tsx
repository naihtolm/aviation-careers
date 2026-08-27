import { redirect } from "next/navigation";
import { getCurrentUser, getFullProfile } from "@/features/profile/queries";
import { ProfileDetailsForm } from "@/components/profile/ProfileDetailsForm";
import { ListSection } from "@/components/profile/ListSection";
import {
  addExperience,
  deleteExperience,
  addEducation,
  deleteEducation,
  addSkill,
  deleteSkill,
  addCertification,
  deleteCertification,
} from "@/features/profile/actions";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const data = await getFullProfile(user.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Your Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manual entry for now — uploading a resume to auto-fill this is coming in a future update.
        </p>
      </div>

      <ProfileDetailsForm seekerProfile={data.seekerProfile} profile={data.profile} />

      <ListSection
        title="Experience"
        emptyLabel="No experience added yet."
        items={data.experience.map((e: any) => ({
          id: e.id,
          label: (
            <span>
              <span className="font-medium">{e.job_title}</span> at {e.company_name}
              {e.start_date && <span className="text-slate-400"> · {e.start_date}{e.is_current ? " – Present" : e.end_date ? ` – ${e.end_date}` : ""}</span>}
            </span>
          ),
        }))}
        onAdd={addExperience}
        onDelete={deleteExperience}
        formFields={
          <>
            <input name="job_title" placeholder="Job title" required className="border rounded-md px-2 py-1.5 text-sm flex-1 min-w-[140px]" />
            <input name="company_name" placeholder="Company" required className="border rounded-md px-2 py-1.5 text-sm flex-1 min-w-[140px]" />
            <input name="start_date" type="date" className="border rounded-md px-2 py-1.5 text-sm" />
            <input name="end_date" type="date" className="border rounded-md px-2 py-1.5 text-sm" />
            <label className="flex items-center gap-1 text-xs text-slate-500">
              <input type="checkbox" name="is_current" /> Current
            </label>
          </>
        }
      />

      <ListSection
        title="Education"
        emptyLabel="No education added yet."
        items={data.education.map((e: any) => ({
          id: e.id,
          label: (
            <span>
              <span className="font-medium">{e.school_name}</span>
              {e.degree && <span> — {e.degree}</span>}
              {e.field_of_study && <span className="text-slate-400"> · {e.field_of_study}</span>}
            </span>
          ),
        }))}
        onAdd={addEducation}
        onDelete={deleteEducation}
        formFields={
          <>
            <input name="school_name" placeholder="School" required className="border rounded-md px-2 py-1.5 text-sm flex-1 min-w-[140px]" />
            <input name="degree" placeholder="Degree" className="border rounded-md px-2 py-1.5 text-sm" />
            <input name="field_of_study" placeholder="Field of study" className="border rounded-md px-2 py-1.5 text-sm" />
            <input name="graduation_date" type="date" className="border rounded-md px-2 py-1.5 text-sm" />
          </>
        }
      />

      <ListSection
        title="Skills"
        emptyLabel="No skills added yet."
        items={data.skills.map((s: any) => ({ id: s.skill_id, label: s.skills?.name }))}
        onAdd={addSkill}
        onDelete={deleteSkill}
        formFields={<input name="name" placeholder="e.g. Sheet Metal Repair" required className="border rounded-md px-2 py-1.5 text-sm flex-1 min-w-[160px]" />}
      />

      <ListSection
        title="Certifications"
        emptyLabel="No certifications added yet."
        items={data.certifications.map((c: any) => ({
          id: c.id,
          label: (
            <span>
              {c.certifications?.name}
              {c.verification_status && <span className="text-xs text-slate-400 ml-1">({c.verification_status})</span>}
            </span>
          ),
        }))}
        onAdd={addCertification}
        onDelete={deleteCertification}
        formFields={<input name="name" placeholder="e.g. A&P Certificate" required className="border rounded-md px-2 py-1.5 text-sm flex-1 min-w-[160px]" />}
      />
    </div>
  );
}
