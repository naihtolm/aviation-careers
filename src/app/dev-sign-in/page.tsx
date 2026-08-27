"use client";

// TEMPORARY — Sprint 1 only. There's no real sign-in UI until Sprint 3
// (app/(auth)/sign-in). This exists solely so the /admin/jobs/review
// screen can be exercised against a real signed-in session before then.
// Delete this file once Sprint 3 ships the real sign-in page.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DevSignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/admin/jobs/review");
  }

  return (
    <div className="max-w-sm mx-auto p-8">
      <h1 className="text-xl font-semibold mb-1">Dev sign-in</h1>
      <p className="text-sm text-gray-500 mb-4">Temporary — Sprint 1 verification only.</p>
      <form onSubmit={handleSignIn} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded px-2 py-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded px-2 py-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Sign in
        </button>
      </form>
    </div>
  );
}
