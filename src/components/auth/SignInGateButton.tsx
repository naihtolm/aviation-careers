"use client";

import { useAuthGate } from "./AuthGateContext";

// The header's "Sign In" button opens the same in-place modal every other
// gated action uses, rather than navigating to /sign-in -- the /sign-in
// page itself still exists (e.g. for a direct link from an email), this
// is just the header's entry point into the same flow.
export function SignInGateButton() {
  const { openGate } = useAuthGate();
  return (
    <button
      onClick={() => openGate("signin")}
      className="bg-accent-200 text-board font-semibold px-4 py-2 rounded-md hover:bg-accent-100 transition-colors"
    >
      Sign In
    </button>
  );
}
