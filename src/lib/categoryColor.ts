export interface CategoryColorClasses {
  iconBg: string;
  iconText: string;
  border: string;
  tagBg: string;
  tagText: string;
  text: string;
}

// Dark-surface identities: a saturated 400/500-weight border (600-weight
// reads muddy against a near-black card, so this bumps a step brighter
// than the old light-theme values), an icon badge as a translucent tint
// of the same hue rather than a flat light-50 fill, and text lightened
// to a 300-weight so it stays readable on dark without glowing. One
// shared dark card surface now carries every category (see JobCard.tsx)
// -- the old per-category cardWash gradient (light-50 -> white) doesn't
// have a dark equivalent worth maintaining separately; the colored
// border + icon + tag already carry the identity.
const ENGINEERING: CategoryColorClasses = {
  iconBg: "bg-indigo-500/15",
  iconText: "text-indigo-300",
  border: "border-indigo-400",
  tagBg: "bg-indigo-500/15",
  tagText: "text-indigo-300",
  text: "text-indigo-300",
};

const MAINTENANCE: CategoryColorClasses = {
  iconBg: "bg-amber-500/15",
  iconText: "text-amber-300",
  border: "border-amber-400",
  tagBg: "bg-amber-500/15",
  tagText: "text-amber-300",
  text: "text-amber-300",
};

const FLIGHT: CategoryColorClasses = {
  iconBg: "bg-sky-500/15",
  iconText: "text-sky-300",
  border: "border-sky-400",
  tagBg: "bg-sky-500/15",
  tagText: "text-sky-300",
  text: "text-sky-300",
};

const DEFAULT: CategoryColorClasses = {
  iconBg: "bg-brand-400/15",
  iconText: "text-brand-300",
  border: "border-brand-400",
  tagBg: "bg-brand-400/15",
  tagText: "text-brand-300",
  text: "text-brand-300",
};

const EMERGENCY: CategoryColorClasses = {
  iconBg: "bg-rose-500/15",
  iconText: "text-rose-300",
  border: "border-rose-400",
  tagBg: "bg-rose-500/15",
  tagText: "text-rose-300",
  text: "text-rose-300",
};

const MILITARY: CategoryColorClasses = {
  iconBg: "bg-stone-400/15",
  iconText: "text-stone-300",
  border: "border-stone-400",
  tagBg: "bg-stone-400/15",
  tagText: "text-stone-300",
  text: "text-stone-300",
};

const CARGO: CategoryColorClasses = {
  iconBg: "bg-teal-500/15",
  iconText: "text-teal-300",
  border: "border-teal-400",
  tagBg: "bg-teal-500/15",
  tagText: "text-teal-300",
  text: "text-teal-300",
};

const GENERAL_AVIATION: CategoryColorClasses = {
  iconBg: "bg-violet-500/15",
  iconText: "text-violet-300",
  border: "border-violet-400",
  tagBg: "bg-violet-500/15",
  tagText: "text-violet-300",
  text: "text-violet-300",
};

// Same substring matching as CategoryIcon so a career/category always gets
// a color that agrees with its icon, without keeping two separate lookup
// tables in sync by hand.
export function categoryColorClasses(name: string | null | undefined): CategoryColorClasses {
  const lower = (name ?? "").toLowerCase();
  if (lower.includes("engineer") || lower.includes("design")) return ENGINEERING;
  if (lower.includes("maintenance") || lower.includes("technical")) return MAINTENANCE;
  if (lower.includes("emergency") || lower.includes("public safety")) return EMERGENCY;
  if (lower.includes("military") || lower.includes("defense")) return MILITARY;
  if (lower.includes("cargo") || lower.includes("logistics")) return CARGO;
  if (lower.includes("general aviation") || lower.includes("private")) return GENERAL_AVIATION;
  if (lower.includes("flight") || lower.includes("pilot") || lower.includes("operations")) return FLIGHT;
  return DEFAULT;
}
