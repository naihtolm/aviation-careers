// Simple inline SVG icons per career category -- matched by name substring
// so new categories still get a sensible default rather than nothing.
export function CategoryIcon({ name, className = "w-6 h-6" }: { name: string; className?: string }) {
  const lower = name.toLowerCase();

  if (lower.includes("engineer") || lower.includes("design")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M4 4h11l5 5v11H4V4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M15 4v5h5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M8 13h8M8 16.5h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }

  if (lower.includes("maintenance") || lower.includes("technical")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2 2.3-2.3z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (lower.includes("flight") || lower.includes("pilot") || lower.includes("operations")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M12 2v6.5L4 13v2l8-2.5V19l-2.5 1.8V22l3.5-1 3.5 1v-1.2L14 19v-6.5l8 2.5v-2l-8-4.5V2h-2z"
          fill="currentColor"
        />
      </svg>
    );
  }

  // Default: a simple briefcase for anything unmatched.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
