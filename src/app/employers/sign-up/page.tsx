"use client";

import { useActionState } from "react";
import { registerEmployer } from "@/features/employers/registration-actions";
import { companyTypeLabel } from "@/lib/companyType";

const COMPANY_TYPES = [
  "airline",
  "airport",
  "airport_authority",
  "mro",
  "ground_handling",
  "cargo",
  "fbo",
  "manufacturer",
  "aerospace",
  "government",
  "staffing",
  "training",
  "ems_operator",
  "law_enforcement",
  "military_defense",
  "other",
];

export default function EmployerSignUpPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string | null } | null, formData: FormData) => {
      const result = await registerEmployer(formData);
      return result ?? { error: null };
    },
    null
  );

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Register your company</h1>
      <p className="text-sm text-slate-500 mt-1">
        You'll need to sign in first — this creates your employer account under your existing profile.
      </p>

      <form action={formAction} className="space-y-3 mt-6">
        <label className="block text-sm">
          Company name
          <input name="companyName" required className="w-full border rounded-md px-3 py-2 mt-1" />
        </label>
        <label className="block text-sm">
          Company type
          <select name="companyType" defaultValue="other" className="w-full border rounded-md px-3 py-2 mt-1">
            {COMPANY_TYPES.map((t) => (
              <option key={t} value={t}>
                {companyTypeLabel(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Website
          <input name="website" type="url" placeholder="https://" className="w-full border rounded-md px-3 py-2 mt-1" />
        </label>
        <label className="block text-sm">
          How can we verify your company? (optional)
          <input
            name="verificationMethod"
            placeholder="e.g. work email domain, LinkedIn company page"
            className="w-full border rounded-md px-3 py-2 mt-1"
          />
        </label>

        {state?.error && (
          <p className="text-sm text-red-600">
            {state.error === "sign_in_required" ? (
              <>
                Please <a href="/sign-in" className="underline">sign in</a> first, then come back to this page.
              </>
            ) : (
              state.error
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand-600 text-white hover:bg-brand-700 transition-colors py-2.5 rounded-md font-medium disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Register"}
        </button>
      </form>
    </div>
  );
}
