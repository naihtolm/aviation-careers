"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthGate } from "./AuthGateContext";

// middleware.ts redirects a signed-out visitor hitting a gated URL
// (/jobs, /careers, etc.) back here with ?gate=1 -- otherwise that
// redirect just looks like "nothing happened," landing on a homepage
// that's indistinguishable from typing "/" directly. This is what
// actually opens the modal on arrival so the gate is felt, not silent.
export function AutoOpenGate() {
  const searchParams = useSearchParams();
  const { openGate } = useAuthGate();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (searchParams.get("gate") === "1") {
      firedRef.current = true;
      openGate("signup");
    }
  }, [searchParams, openGate]);

  return null;
}
