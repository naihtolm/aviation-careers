"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/features/auth/actions";

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    const result = await updatePassword(password);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Set a new password</h1>
      <form onSubmit={handleSubmit} className="space-y-3 mt-6">
        <label className="block text-sm">
          New password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md px-3 py-2 mt-1"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand-600 text-white py-2.5 rounded-md font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Set password"}
        </button>
      </form>
    </div>
  );
}
