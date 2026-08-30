"use client";

import { useState, useTransition } from "react";
import { createJobPosting, updateJobPosting, type ScreeningQuestion } from "@/features/employers/job-post-actions";

const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "temporary", "internship"];
const WORK_ARRANGEMENTS = ["on_site", "hybrid", "remote"];

export interface JobPostFormInitial {
  title: string;
  careerId: string;
  employmentType: string;
  workArrangement: string;
  city: string;
  state: string;
  skillsInput: string;
  certsInput: string;
  salaryMin: string;
  salaryMax: string;
  salaryPublic: boolean;
  applicationType: "external_url" | "platform_application";
  applicationUrl: string;
  description: string;
  questions: ScreeningQuestion[];
  expiresAt: string; // yyyy-mm-dd, or "" for no expiry
  alreadyLive: boolean; // status is no longer 'draft' -- draft/publish choice no longer applies
}

export function JobPostForm({
  careers,
  jobId,
  initial,
}: {
  careers: { id: string; name: string }[];
  jobId?: string;
  initial?: JobPostFormInitial;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [careerId, setCareerId] = useState(initial?.careerId ?? "");
  const [employmentType, setEmploymentType] = useState(initial?.employmentType ?? "full_time");
  const [workArrangement, setWorkArrangement] = useState(initial?.workArrangement ?? "on_site");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [skillsInput, setSkillsInput] = useState(initial?.skillsInput ?? "");
  const [certsInput, setCertsInput] = useState(initial?.certsInput ?? "");
  const [salaryMin, setSalaryMin] = useState(initial?.salaryMin ?? "");
  const [salaryMax, setSalaryMax] = useState(initial?.salaryMax ?? "");
  const [salaryPublic, setSalaryPublic] = useState(initial?.salaryPublic ?? true);
  const [applicationType, setApplicationType] = useState<"external_url" | "platform_application">(
    initial?.applicationType ?? "external_url"
  );
  const [applicationUrl, setApplicationUrl] = useState(initial?.applicationUrl ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [questions, setQuestions] = useState<ScreeningQuestion[]>(initial?.questions ?? []);
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ?? "");

  const alreadyLive = initial?.alreadyLive ?? false;

  function addQuestion() {
    if (questions.length >= 3) return;
    setQuestions((prev) => [...prev, { id: crypto.randomUUID(), type: "yes_no", label: "" }]);
  }

  function updateQuestion(id: string, patch: Partial<ScreeningQuestion>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function handleSubmit(publish: boolean) {
    setError(null);
    startTransition(async () => {
      const payload = {
        title,
        careerId: careerId || null,
        employmentType: employmentType || null,
        workArrangement,
        city,
        state,
        requiredSkills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
        requiredCertifications: certsInput.split(",").map((s) => s.trim()).filter(Boolean),
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        salaryPublic,
        applicationType,
        applicationUrl: applicationUrl || null,
        screeningQuestions: applicationType === "platform_application" ? questions.filter((q) => q.label.trim()) : [],
        description,
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
        publish,
      };
      const result = jobId ? await updateJobPosting(jobId, payload) : await createJobPosting(payload);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(true);
      }}
      className="space-y-6"
    >
      <section className="border rounded-lg p-4 bg-white space-y-3">
        <p className="font-medium text-slate-900">Basics</p>
        <label className="block text-sm">
          Job title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border rounded-md px-3 py-2 mt-1" />
        </label>
        <label className="block text-sm">
          Career category
          <select value={careerId} onChange={(e) => setCareerId(e.target.value)} className="w-full border rounded-md px-3 py-2 mt-1">
            <option value="">Not specified</option>
            {careers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Employment type
          <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-full border rounded-md px-3 py-2 mt-1">
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="border rounded-lg p-4 bg-white space-y-3">
        <p className="font-medium text-slate-900">Location</p>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="border rounded-md px-3 py-2" />
          <input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className="border rounded-md px-3 py-2" />
        </div>
        <select value={workArrangement} onChange={(e) => setWorkArrangement(e.target.value)} className="w-full border rounded-md px-3 py-2">
          {WORK_ARRANGEMENTS.map((w) => (
            <option key={w} value={w}>
              {w.replace("_", " ")}
            </option>
          ))}
        </select>
      </section>

      <section className="border rounded-lg p-4 bg-white space-y-3">
        <p className="font-medium text-slate-900">Compensation (optional)</p>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="Min ($/yr)" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className="border rounded-md px-3 py-2" />
          <input type="number" placeholder="Max ($/yr)" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className="border rounded-md px-3 py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={salaryPublic} onChange={(e) => setSalaryPublic(e.target.checked)} />
          Show salary publicly on the listing
        </label>
      </section>

      <section className="border rounded-lg p-4 bg-white space-y-3">
        <p className="font-medium text-slate-900">Requirements (optional)</p>
        <input
          placeholder="Required skills, comma separated"
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        <input
          placeholder="Required certifications, comma separated"
          value={certsInput}
          onChange={(e) => setCertsInput(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
      </section>

      <section className="border rounded-lg p-4 bg-white space-y-3">
        <p className="font-medium text-slate-900">Application method</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="applicationType"
            checked={applicationType === "external_url"}
            onChange={() => setApplicationType("external_url")}
          />
          External URL — candidates go to your own site
        </label>
        {applicationType === "external_url" && (
          <input
            type="url"
            placeholder="https://yourcompany.com/careers/job-id"
            value={applicationUrl}
            onChange={(e) => setApplicationUrl(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="applicationType"
            checked={applicationType === "platform_application"}
            onChange={() => setApplicationType("platform_application")}
          />
          Native apply — candidates apply directly on this site
        </label>

        {applicationType === "platform_application" && (
          <div className="border-t pt-3 mt-3">
            <p className="text-xs text-amber-800 bg-amber-50 rounded p-2 mb-3">
              Applications will appear in your Applicants tab — make sure someone on your team checks it regularly.
            </p>
            {questions.map((q) => (
              <div key={q.id} className="border rounded-md p-3 mb-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    placeholder="Question"
                    value={q.label}
                    onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                    className="flex-1 border rounded-md px-2 py-1.5 text-sm"
                  />
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, { type: e.target.value as ScreeningQuestion["type"] })}
                    className="border rounded-md px-2 py-1.5 text-sm"
                  >
                    <option value="yes_no">Yes/No</option>
                    <option value="short_text">Short text</option>
                    <option value="multiple_choice">Multiple choice</option>
                  </select>
                  <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-600 text-sm">
                    Remove
                  </button>
                </div>
                {q.type === "multiple_choice" && (
                  <input
                    placeholder="Options, comma separated"
                    value={q.options?.join(", ") ?? ""}
                    onChange={(e) => updateQuestion(q.id, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                    className="w-full border rounded-md px-2 py-1.5 text-sm"
                  />
                )}
              </div>
            ))}
            {questions.length < 3 && (
              <button type="button" onClick={addQuestion} className="text-sm text-blue-600 hover:underline">
                + Add screening question ({questions.length}/3)
              </button>
            )}
          </div>
        )}
      </section>

      <section className="border rounded-lg p-4 bg-white space-y-3">
        <p className="font-medium text-slate-900">Listing expiration (optional)</p>
        <label className="block text-sm">
          Automatically unlist this job after
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border rounded-md px-3 py-2 mt-1"
          />
        </label>
        <p className="text-xs text-slate-500">Leave blank to keep the listing up until you pause or archive it yourself.</p>
      </section>

      <section className="border rounded-lg p-4 bg-white space-y-3">
        <p className="font-medium text-slate-900">Description</p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="w-full border rounded-md px-3 py-2"
        />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        {alreadyLive ? (
          <button
            type="submit"
            disabled={isPending}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-md font-medium disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSubmit(false)}
              className="border border-slate-300 px-6 py-2.5 rounded-md font-medium disabled:opacity-50 hover:bg-slate-50"
            >
              {isPending ? "Saving…" : "Save as Draft"}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-md font-medium disabled:opacity-50"
            >
              {isPending ? "Publishing…" : "Publish Job"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
