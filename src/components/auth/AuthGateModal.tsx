"use client";

import { useActionState } from "react";
import { signUp, signIn } from "@/features/auth/actions";

type GateMode = "signup" | "signin";

export function AuthGateModal({
  mode,
  onModeChange,
  onClose,
  stats,
}: {
  mode: GateMode;
  onModeChange: (mode: GateMode) => void;
  onClose: () => void;
  stats?: { jobCount: number; companyCount: number } | null;
}) {
  const isSignup = mode === "signup";
  const action = isSignup ? signUp : signIn;

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string | null } | null, formData: FormData) => {
      const result = await action(formData);
      // Both actions redirect() on success (which throws internally), so
      // reaching this line at all means it failed -- redirect never
      // returns a value.
      return result ?? { error: null };
    },
    null
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-5 animate-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-board-2 border border-white/10 rounded-2xl p-6 shadow-2xl animate-modal-box">
        <h2 className="font-display text-lg font-bold text-white">
          {isSignup ? "See every open role" : "Welcome back"}
        </h2>
        <p className="text-sm text-slate-400 mt-1.5">
          {isSignup
            ? "Create a free account to browse every listing, filter by pay and location, save jobs, and apply in one click."
            : "Sign in to pick up where you left off."}
        </p>

        {isSignup && stats && (
          <div className="grid grid-cols-2 gap-2 my-4">
            <div className="text-center bg-white/5 border border-white/10 rounded-lg py-2">
              <p className="font-mono-data text-lg font-semibold text-accent-200">{stats.jobCount}+</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Open roles</p>
            </div>
            <div className="text-center bg-white/5 border border-white/10 rounded-lg py-2">
              <p className="font-mono-data text-lg font-semibold text-accent-200">{stats.companyCount}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Employers</p>
            </div>
          </div>
        )}

        <form action={formAction} className="space-y-3 mt-4">
          <input
            name="email"
            type="email"
            required
            placeholder="Email address"
            className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-200/60"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Password"
            className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-200/60"
          />
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-accent-200 text-board font-semibold py-2.5 rounded-md hover:bg-accent-100 transition-colors disabled:opacity-50"
          >
            {isPending ? (isSignup ? "Creating account…" : "Signing in…") : isSignup ? "Create free account" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-slate-400 text-center mt-4">
          {isSignup ? (
            <>Already have an account?{" "}
              <button onClick={() => onModeChange("signin")} className="text-accent-200 font-medium hover:underline">Sign in</button>
            </>
          ) : (
            <>New here?{" "}
              <button onClick={() => onModeChange("signup")} className="text-accent-200 font-medium hover:underline">Create a free account</button>
            </>
          )}
        </p>

        <button
          onClick={onClose}
          className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors mt-3"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
