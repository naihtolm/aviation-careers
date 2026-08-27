"use client";

import { useTransition } from "react";
import { updateProfile } from "@/features/profile/actions";

const EXPERIENCE_LEVELS = [
  { value: "no_experience", label: "No experience" },
  { value: "entry_level", label: "Entry level" },
  { value: "one_to_two", label: "1–2 years" },
  { value: "three_to_five", label: "3–5 years" },
  { value: "five_to_ten", label: "5–10 years" },
  { value: "ten_plus", label: "10+ years" },
];

export function ProfileDetailsForm({
  seekerProfile,
  profile,
  categories,
  careerInterestIds,
}: {
  seekerProfile: any;
  profile: any;
  categories: { id: string; name: string }[];
  careerInterestIds: string[];
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateProfile(formData);
    });
  }

  return (
    <form action={handleSubmit} className="border rounded-lg p-4 bg-white space-y-3">
      <p className="font-medium text-slate-900">{profile?.email}</p>

      <label className="block text-sm">
        Headline
        <input
          name="headline"
          defaultValue={seekerProfile?.headline ?? ""}
          placeholder="e.g. A&P Mechanic with 5 years experience"
          className="w-full border rounded-md px-3 py-2 mt-1"
        />
      </label>

      <label className="block text-sm">
        Summary
        <textarea
          name="professional_summary"
          defaultValue={seekerProfile?.professional_summary ?? ""}
          rows={3}
          className="w-full border rounded-md px-3 py-2 mt-1"
        />
      </label>

      {categories.length > 0 && (
        <div>
          <p className="text-sm mb-1">Career interests</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-1.5 text-sm border rounded-full px-3 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  name="career_category_ids"
                  value={cat.id}
                  defaultChecked={careerInterestIds.includes(cat.id)}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <label className="block text-sm">
        Experience level
        <select
          name="experience_level"
          defaultValue={seekerProfile?.experience_level ?? ""}
          className="w-full border rounded-md px-3 py-2 mt-1"
        >
          <option value="">Not specified</option>
          {EXPERIENCE_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          City
          <input name="city" defaultValue={seekerProfile?.city ?? ""} className="w-full border rounded-md px-3 py-2 mt-1" />
        </label>
        <label className="block text-sm">
          State
          <input name="state" defaultValue={seekerProfile?.state ?? ""} className="w-full border rounded-md px-3 py-2 mt-1" />
        </label>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="willing_to_relocate" defaultChecked={seekerProfile?.willing_to_relocate} />
          Willing to relocate
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="open_to_remote" defaultChecked={seekerProfile?.open_to_remote} />
          Open to remote
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Desired salary min
          <input
            type="number"
            name="desired_salary_min"
            defaultValue={seekerProfile?.desired_salary_min ?? ""}
            className="w-full border rounded-md px-3 py-2 mt-1"
          />
        </label>
        <label className="block text-sm">
          Desired salary max
          <input
            type="number"
            name="desired_salary_max"
            defaultValue={seekerProfile?.desired_salary_max ?? ""}
            className="w-full border rounded-md px-3 py-2 mt-1"
          />
        </label>
      </div>

      <label className="block text-sm">
        Who can see your profile?
        <select
          name="profile_visibility"
          defaultValue={seekerProfile?.profile_visibility ?? "private"}
          className="w-full border rounded-md px-3 py-2 mt-1"
        >
          <option value="private">Only me</option>
          <option value="employers">Employers I apply to</option>
          <option value="public">Public</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
