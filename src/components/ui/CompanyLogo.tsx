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

// Muted, desaturated tones instead of bright SaaS-rainbow colors -- these
// read as one considered, cohesive family (closer to the brand/accent
// palette's own depth) rather than each avatar competing for attention
// against its neighbors and the navy card it now sits on.
const PALETTE = [
  "#3d5a80", // slate blue
  "#5c6f8a", // steel blue-gray
  "#8a6a3a", // muted amber-brown
  "#4a6b5c", // deep sage
  "#6b4a5c", // dusty plum
  "#3a6b6b", // deep teal
  "#5c4a6b", // dusty indigo
  "#7a4a3a", // burnt sienna
  "#4a5c3a", // deep olive
  "#6b5a3a", // warm bronze
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
