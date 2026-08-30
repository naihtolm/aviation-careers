"use client";

import { useEffect, useRef, useState } from "react";

// Deterministic accent color per company so the initials fallback still
// feels distinct company-to-company instead of one flat gray block.
const PALETTE = ["bg-brand-600", "bg-sky-600", "bg-violet-600", "bg-rose-600", "bg-amber-600", "bg-emerald-600"];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function domainFromWebsite(website?: string | null): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Real employer logos via Clearbit's free public logo API (keyed off the
// company's own website domain) -- no logo storage/upload flow exists yet
// (see logo_path gap tracked on the admin Data Quality page), so this is
// the fastest path to real-looking employer branding. Falls back to a
// colored initials avatar when there's no website on file or the image
// 404s (Clearbit has no logo for that domain).
export function CompanyLogo({
  name,
  website,
  size = 40,
  className = "",
}: {
  name: string;
  website?: string | null;
  size?: number;
  className?: string;
}) {
  const domain = domainFromWebsite(website);
  const [failed, setFailed] = useState(false);
  const loadedRef = useRef(false);

  // Belt-and-suspenders: some blocked/hung image loads never fire onLoad
  // or onError at all (seen behind restrictive network policies), leaving
  // a permanently broken-image icon. If nothing has resolved after a few
  // seconds, treat it as failed and fall back to initials.
  useEffect(() => {
    if (!domain) return;
    loadedRef.current = false;
    const timer = setTimeout(() => {
      if (!loadedRef.current) setFailed(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [domain]);

  if (!domain || failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg text-white font-semibold shrink-0 ${colorForName(name)} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        aria-hidden
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}?size=${size * 2}`}
      alt=""
      width={size}
      height={size}
      className={`rounded-lg object-contain bg-white border border-slate-100 shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      // Some blocked/empty responses resolve as a "successful" load with
      // no actual pixels (0x0) instead of firing onError -- catch those
      // here too so a bad domain doesn't leave a broken-image icon.
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth === 0) {
          setFailed(true);
        } else {
          loadedRef.current = true;
        }
      }}
    />
  );
}
