// components/ui/CompanyLogo.tsx
//
// Was: try a Clearbit logo fetch, fall back to colored initials on
// failure. Clearbit's public logo API (logo.clearbit.com) is gone --
// the domain no longer resolves at all -- so every single company was
// silently eating a guaranteed-failing request plus a 3-second timeout
// before landing on the "fallback" anyway. Confirmed no company has a
// logo_path set either (no upload flow exists yet), so until one does,
// this initials avatar isn't a fallback -- it's the only thing that
// will ever render. Designed and treated as that, not left as an
// afterthought sized for the rare case.

const PALETTE = [
  "#4d7fff", // brand blue
  "#0ea5e9", // sky
  "#8b5cf6", // violet
  "#f43f5e", // rose
  "#f59e0b", // amber
  "#10b981", // emerald
  "#14b8a6", // teal
  "#ec4899", // pink
  "#6366f1", // indigo
  "#f97316", // orange
  "#84cc16", // lime
  "#06b6d4", // cyan
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function CompanyLogo({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  // Kept in the call signature so none of the ~15 call sites need
  // touching -- website-based lookup just has nothing left to look up.
  website?: string | null;
  size?: number;
  className?: string;
}) {
  const color = colorForName(name);
  return (
    <div
      className={`flex items-center justify-center rounded-lg text-white font-semibold shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(155deg, ${color}, ${color}cc)`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
      }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
