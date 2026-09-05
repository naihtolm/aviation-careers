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
        className="border border-slate-300 text-slate-700 font-medium px-6 py-2.5 rounded-md hover:bg-slate-50 transition-colors"
      >
        Sign in
      </button>
    </div>
  );
}
