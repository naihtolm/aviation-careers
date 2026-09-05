"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "@/features/profile/actions";

const STEPS = ["Career interest", "Experience", "Location", "Certifications", "Salary goal"] as const;

const EXPERIENCE_LEVELS = [
  { value: "no_experience", label: "No experience" },
  { value: "entry_level", label: "Entry level" },
  { value: "one_to_two", label: "1–2 years" },
  { value: "three_to_five", label: "3–5 years" },
  { value: "five_to_ten", label: "5–10 years" },
  { value: "ten_plus", label: "10+ years" },
];

interface CareerCategory {
  id: string;
  name: string;
  description: string | null;
}

export function OnboardingWizard({ categories }: { categories: CareerCategory[] }) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();

  const [careerCategoryIds, setCareerCategoryIds] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [openToRemote, setOpenToRemote] = useState(false);
  const [certInput, setCertInput] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  function toggleCategory(id: string) {
    setCareerCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function addCert() {
    if (certInput.trim()) {
      setCertifications((prev) => [...prev, certInput.trim()]);
      setCertInput("");
    }
  }

  function handleFinish() {
    startTransition(() => {
      completeOnboarding({
        careerCategoryIds,
        experienceLevel: experienceLevel || null,
        city,
        state,
        willingToRelocate,
        openToRemote,
        certificationNames: certifications,
        desiredSalaryMin: salaryMin ? Number(salaryMin) : null,
        desiredSalaryMax: salaryMax ? Number(salaryMax) : null,
      });
    });
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="flex gap-1 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? "bg-brand-600" : "bg-slate-200"}`} />
        ))}
      </div>

      {step === 0 && (
        <div>
          <h1 className="text-xl font-semibold text-slate-900">What are you interested in?</h1>
          <p className="text-sm text-slate-500 mt-1">Pick as many as apply — you can change this later.</p>
          <div className="space-y-2 mt-6">
            {categories.length === 0 && <p className="text-sm text-slate-500">No career categories available yet.</p>}
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-start gap-2 border rounded-md px-3 py-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={careerCategoryIds.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">{cat.name}</span>
                  {cat.description && <span className="block text-xs text-slate-500">{cat.description}</span>}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 className="text-xl font-semibold text-slate-900">How much experience do you have?</h1>
          <div className="space-y-2 mt-6">
            {EXPERIENCE_LEVELS.map((level) => (
              <label key={level.value} className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="experience_level"
                  checked={experienceLevel === level.value}
                  onChange={() => setExperienceLevel(level.value)}
                />
                {level.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Where are you located?</h1>
          <div className="space-y-3 mt-6">
            <input
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
            <input
              placeholder="State (e.g. CA)"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={willingToRelocate} onChange={(e) => setWillingToRelocate(e.target.checked)} />
              Willing to relocate
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={openToRemote} onChange={(e) => setOpenToRemote(e.target.checked)} />
              Open to remote work
            </label>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Any certifications? (optional)</h1>
          <p className="text-sm text-slate-500 mt-1">A&P, ATP, IA, etc. — you can always add more later.</p>
          <div className="flex gap-2 mt-6">
            <input
              placeholder="e.g. A&P Certificate"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCert())}
              className="flex-1 border rounded-md px-3 py-2"
            />
            <button type="button" onClick={addCert} className="border rounded-md px-3 py-2 text-sm">
              Add
            </button>
          </div>
          {certifications.length > 0 && (
            <ul className="mt-3 space-y-1">
              {certifications.map((c, i) => (
                <li key={i} className="text-sm bg-slate-100 rounded px-2 py-1 inline-block mr-2">
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {step === 4 && (
        <div>
          <h1 className="text-xl font-semibold text-slate-900">What's your salary goal?</h1>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <input
              type="number"
              placeholder="Min ($/yr)"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="Max ($/yr)"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              className="border rounded-md px-3 py-2"
            />
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        {step > 0 ? (
          <button onClick={() => setStep((s) => s - 1)} className="text-sm text-slate-500">
            Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="bg-accent-200 text-board hover:bg-accent-100 transition-colors px-5 py-2 rounded-md text-sm font-medium"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={isPending}
            className="bg-accent-200 text-board hover:bg-accent-100 transition-colors px-5 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}
