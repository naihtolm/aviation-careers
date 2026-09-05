"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/features/auth/actions";

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string | null } | null, formData: FormData) => {
      const result = await signIn(formData);
      return result ?? { error: null };
    },
    null
  );

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-board via-board-2 to-board-2">
      <div className="max-w-sm mx-auto px-4 py-16">
        <h1 className="font-display text-2xl font-bold text-white">Sign in</h1>

        <form action={formAction} className="space-y-3 mt-6">
          <label className="block text-sm text-slate-300">
            Email
            <input
              name="email"
              type="email"
              required
              className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 mt-1 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-200/60"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Password
            <input
              name="password"
              type="password"
              required
              className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 mt-1 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-200/60"
            />
          </label>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-accent-200 text-board py-2.5 rounded-md font-semibold hover:bg-accent-100 transition-colors disabled:opacity-50"
          >
            {isPending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="flex justify-between text-sm text-slate-400 mt-4">
          <Link href="/sign-up" className="text-accent-200 font-medium hover:underline">
            Create an account
          </Link>
          <Link href="/reset-password" className="hover:underline hover:text-white transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
