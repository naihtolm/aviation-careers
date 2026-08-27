"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/features/auth/actions";

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string | null } | null, formData: FormData) => {
      const result = await signUp(formData);
      return result ?? { error: null };
    },
    null
  );

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
      <p className="text-sm text-slate-500 mt-1">Find aviation jobs, save searches, and get alerted to new openings.</p>

      <form action={formAction} className="space-y-3 mt-6">
        <label className="block text-sm">
          Email
          <input name="email" type="email" required className="w-full border rounded-md px-3 py-2 mt-1" />
        </label>
        <label className="block text-sm">
          Password
          <input name="password" type="password" required minLength={8} className="w-full border rounded-md px-3 py-2 mt-1" />
        </label>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-slate-900 text-white py-2.5 rounded-md font-medium hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Creating account…" : "Sign Up"}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-4">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
