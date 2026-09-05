"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/features/auth/actions";

export default function ResetPasswordRequestPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string | null; sent?: boolean } | null, formData: FormData) => {
      const result = await requestPasswordReset(formData);
      return { ...result, sent: !result.error };
    },
    null
  );

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Reset your password</h1>
      <p className="text-sm text-slate-500 mt-1">We'll email you a link to set a new password.</p>

      {state?.sent ? (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded-md p-3 mt-6">
          Check your email for a reset link.
        </p>
      ) : (
        <form action={formAction} className="space-y-3 mt-6">
          <label className="block text-sm">
            Email
            <input name="email" type="email" required className="w-full border rounded-md px-3 py-2 mt-1" />
          </label>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-accent-200 text-board py-2.5 rounded-md font-medium hover:bg-accent-100 transition-colors disabled:opacity-50"
          >
            {isPending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </div>
  );
}
