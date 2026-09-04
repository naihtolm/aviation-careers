"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { AuthGateModal } from "./AuthGateModal";

type GateMode = "signup" | "signin";

const AuthGateContext = createContext<{ openGate: (mode: GateMode) => void } | null>(null);

// One modal instance, mounted once at the root layout, opened from
// anywhere in the tree (nav links, homepage teaser cards, job cards) via
// this context instead of each caller managing its own modal state --
// otherwise every gated element needs to know how to render a full modal.
export function AuthGateProvider({
  children,
  stats,
}: {
  children: ReactNode;
  stats?: { jobCount: number; companyCount: number } | null;
}) {
  const [mode, setMode] = useState<GateMode | null>(null);

  return (
    <AuthGateContext.Provider value={{ openGate: setMode }}>
      {children}
      {mode && <AuthGateModal mode={mode} onModeChange={setMode} onClose={() => setMode(null)} stats={stats} />}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used within AuthGateProvider");
  return ctx;
}
