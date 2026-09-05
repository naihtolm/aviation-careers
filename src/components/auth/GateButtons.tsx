"use client";

import { useAuthGate } from "./AuthGateContext";

export function GateButtons() {
  const { openGate } = useAuthGate();
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => openGate("signup")}
        className="bg-accent-200 text-board font-semibold px-6 py-2.5 rounded-md hover:bg-accent-100 transition-colors"
      >
        Create free account
      </button>
      <button
        onClick={() => openGate("signin")}
        className="border border-white/25 text-white font-medium px-6 py-2.5 rounded-md hover:bg-white/10 transition-colors"
      >
        Sign in
      </button>
    </div>
  );
}
