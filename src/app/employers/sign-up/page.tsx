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
    <div className="min-h-[70vh] bg-gradient-to-b from-board via-board-2 to-board-2">
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="font-display text-2xl font-bold text-white">Register your company</h1>
        <p className="text-sm text-slate-400 mt-1">
          You'll need to sign in first — this creates your employer account under your existing profile.
        </p>

        <form action={formAction} className="space-y-3 mt-6">
          <label className="block text-sm text-slate-300">
            Company name
            <input name="companyName" required className="w-full bg-white/5 border border-white/15 text-white rounded-md px-3 py-2 mt-1 focus:outline-none focus:border-accent-200/60" />
          </label>
          <label className="block text-sm text-slate-300">
            Company type
            <select name="companyType" defaultValue="other" className="w-full bg-white/5 border border-white/15 text-white rounded-md px-3 py-2 mt-1 focus:outline-none focus:border-accent-200/60">
              {COMPANY_TYPES.map((t) => (
                <option key={t} value={t} className="bg-board text-white">
                  {companyTypeLabel(t)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            Website
            <input name="website" type="url" placeholder="https://" className="w-full bg-white/5 border border-white/15 text-white placeholder:text-slate-500 rounded-md px-3 py-2 mt-1 focus:outline-none focus:border-accent-200/60" />
          </label>
          <label className="block text-sm text-slate-300">
            How can we verify your company? (optional)
            <input
              name="verificationMethod"
              placeholder="e.g. work email domain, LinkedIn company page"
              className="w-full bg-white/5 border border-white/15 text-white placeholder:text-slate-500 rounded-md px-3 py-2 mt-1 focus:outline-none focus:border-accent-200/60"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input name="veteranFriendly" type="checkbox" className="rounded border-white/30" />
            We actively welcome veteran applicants
          </label>

          {state?.error && (
            <p className="text-sm text-red-400">
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
            className="w-full bg-accent-200 text-board hover:bg-accent-100 transition-colors py-2.5 rounded-md font-semibold disabled:opacity-50"
          >
            {isPending ? "Submitting…" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
