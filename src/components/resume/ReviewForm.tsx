"use client";

import { useState, useTransition } from "react";
import { saveReviewedResumeData } from "@/features/resumes/actions";
import type { ParsedResumeData, ReviewedExperience, ReviewedEducation } from "@/lib/resume-parsing";
import { titleCase } from "@/lib/text";

const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "temporary", "internship"];

export function ReviewForm({ data }: { data: ParsedResumeData }) {
  const [isPending, startTransition] = useTransition();

  const [experience, setExperience] = useState<ReviewedExperience[]>(
    data.experience.map((e) => ({ ...e, approved: true }))
  );
  const [education, setEducation] = useState<ReviewedEducation[]>(
    data.education.map((e) => ({ ...e, approved: true }))
  );
  const [skills, setSkills] = useState(data.skills.map((name) => ({ approved: true, name })));
  const [certifications, setCertifications] = useState(data.certifications.map((name) => ({ approved: true, name })));

  function handleSave() {
    startTransition(() => {
      saveReviewedResumeData({ experience, education, skills, certifications });
    });
  }

  const totalApproved =
    experience.filter((e) => e.approved).length +
    education.filter((e) => e.approved).length +
    skills.filter((s) => s.approved).length +
    certifications.filter((c) => c.approved).length;

  return (
    <div className="space-y-6">
      {experience.length === 0 && education.length === 0 && skills.length === 0 && certifications.length === 0 && (
        <p className="text-sm text-slate-500">We couldn't find much in this file — try adding your profile manually instead.</p>
      )}

      {experience.length > 0 && (
        <section>
          <h2 className="font-medium text-slate-900 mb-3">Experience</h2>
          <div className="space-y-3">
            {experience.map((item, i) => (
              <div key={i} className={`border rounded-lg p-3 ${!item.approved ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={item.approved}
                    onChange={(e) =>
                      setExperience((prev) => prev.map((it, idx) => (idx === i ? { ...it, approved: e.target.checked } : it)))
                    }
                    className="mt-2"
                  />
                  <div className="flex-1 grid sm:grid-cols-2 gap-2">
                    <input
                      value={item.job_title}
                      onChange={(e) =>
                        setExperience((prev) => prev.map((it, idx) => (idx === i ? { ...it, job_title: e.target.value } : it)))
                      }
                      placeholder="Job title"
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <input
                      value={item.company_name}
                      onChange={(e) =>
                        setExperience((prev) => prev.map((it, idx) => (idx === i ? { ...it, company_name: e.target.value } : it)))
                      }
                      placeholder="Company"
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <select
                      value={item.employment_type ?? ""}
                      onChange={(e) =>
                        setExperience((prev) =>
                          prev.map((it, idx) =>
                            idx === i
                              ? { ...it, employment_type: (e.target.value || null) as ReviewedExperience["employment_type"] }
                              : it
                          )
                        )
                      }
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="">Employment type</option>
                      {EMPLOYMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {titleCase(t)}
                        </option>
                      ))}
                    </select>
                    <input
                      value={item.location ?? ""}
                      onChange={(e) =>
                        setExperience((prev) => prev.map((it, idx) => (idx === i ? { ...it, location: e.target.value } : it)))
                      }
                      placeholder="Location"
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={item.start_date ?? ""}
                      onChange={(e) =>
                        setExperience((prev) => prev.map((it, idx) => (idx === i ? { ...it, start_date: e.target.value } : it)))
                      }
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={item.end_date ?? ""}
                      disabled={item.is_current}
                      onChange={(e) =>
                        setExperience((prev) => prev.map((it, idx) => (idx === i ? { ...it, end_date: e.target.value } : it)))
                      }
                      className="border rounded px-2 py-1 text-sm disabled:bg-slate-50"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={item.is_current}
                        onChange={(e) =>
                          setExperience((prev) => prev.map((it, idx) => (idx === i ? { ...it, is_current: e.target.checked } : it)))
                        }
                      />
                      Current role
                    </label>
                  </div>
                  <button
                    onClick={() => setExperience((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-xs text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section>
          <h2 className="font-medium text-slate-900 mb-3">Education</h2>
          <div className="space-y-3">
            {education.map((item, i) => (
              <div key={i} className={`border rounded-lg p-3 ${!item.approved ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={item.approved}
                    onChange={(e) =>
                      setEducation((prev) => prev.map((it, idx) => (idx === i ? { ...it, approved: e.target.checked } : it)))
                    }
                    className="mt-2"
                  />
                  <div className="flex-1 grid sm:grid-cols-2 gap-2">
                    <input
                      value={item.school_name}
                      onChange={(e) =>
                        setEducation((prev) => prev.map((it, idx) => (idx === i ? { ...it, school_name: e.target.value } : it)))
                      }
                      placeholder="School"
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <input
                      value={item.degree ?? ""}
                      onChange={(e) =>
                        setEducation((prev) => prev.map((it, idx) => (idx === i ? { ...it, degree: e.target.value } : it)))
                      }
                      placeholder="Degree"
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <input
                      value={item.field_of_study ?? ""}
                      onChange={(e) =>
                        setEducation((prev) => prev.map((it, idx) => (idx === i ? { ...it, field_of_study: e.target.value } : it)))
                      }
                      placeholder="Field of study"
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={item.graduation_date ?? ""}
                      onChange={(e) =>
                        setEducation((prev) => prev.map((it, idx) => (idx === i ? { ...it, graduation_date: e.target.value } : it)))
                      }
                      className="border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setEducation((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-xs text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <h2 className="font-medium text-slate-900 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <label
                key={i}
                className={`flex items-center gap-1.5 text-sm border rounded-full px-3 py-1 ${!skill.approved ? "opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={skill.approved}
                  onChange={(e) => setSkills((prev) => prev.map((s, idx) => (idx === i ? { ...s, approved: e.target.checked } : s)))}
                />
                {skill.name}
              </label>
            ))}
          </div>
        </section>
      )}

      {certifications.length > 0 && (
        <section>
          <h2 className="font-medium text-slate-900 mb-3">Certifications</h2>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert, i) => (
              <label
                key={i}
                className={`flex items-center gap-1.5 text-sm border rounded-full px-3 py-1 ${!cert.approved ? "opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={cert.approved}
                  onChange={(e) =>
                    setCertifications((prev) => prev.map((c, idx) => (idx === i ? { ...c, approved: e.target.checked } : c)))
                  }
                />
                {cert.name}
              </label>
            ))}
          </div>
        </section>
      )}

      <button
        onClick={handleSave}
        disabled={isPending || totalApproved === 0}
        className="bg-accent-200 text-board hover:bg-accent-100 transition-colors px-5 py-2.5 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Saving…" : `Save ${totalApproved} item${totalApproved === 1 ? "" : "s"} to profile`}
      </button>
    </div>
  );
}
