export interface CareerOption {
  id: string;
  name: string;
  categoryName?: string | null;
}

// "high" confidence rules are specific enough that a title match means
// what it looks like it means (e.g. "Cost Analyst" in the title -- there's
// essentially no other role that phrase would appear on). "low" confidence
// rules are broad catch-alls (a bare "manager"/"technician", or an indirect
// signal like "software"/"hardware"/"EE" for Aerospace Engineer) that give
// a reasonable suggestion but are real guesses -- worth a human's second
// look rather than trusting outright. lib/ingestion/auto-approve.ts uses
// this distinction to decide what's safe to publish unattended.
const TITLE_RULES: Array<{ career: string; confidence: "high" | "low"; terms: RegExp[] }> = [
  { career: "Cost Analyst", confidence: "high", terms: [/\bcost analyst\b/i, /\bcost estimator\b/i, /\bpricing analyst\b/i] },
  { career: "Financial Analyst", confidence: "high", terms: [/\bfinancial analyst\b/i, /\bfinance analyst\b/i, /\bfp&a\b/i] },
  { career: "Accountant", confidence: "high", terms: [/\baccountant\b/i, /\baccounting\b/i, /\bcontroller\b/i] },
  { career: "Procurement Specialist", confidence: "high", terms: [/\bprocurement\b/i, /\bpurchasing\b/i, /\bbuyer\b/i, /\bsourcing\b/i, /\bsupply chain\b/i] },
  {
    career: "Human Resources Specialist",
    confidence: "high",
    terms: [
      /\bhuman resources\b/i,
      /\bhr (?:specialist|generalist|manager)\b/i,
      /\brecruiter\b/i,
      /\btalent acquisition\b/i,
      /\bcompensation\b/i,
      /\bpeople operations\b/i,
      /\bemployee relations\b/i,
    ],
  },
  // Specific management titles -- checked ahead of the generic
  // manager/director catch-all near the bottom, so these land somewhere
  // more precise than "Program Manager" when a better fit exists.
  { career: "Program Manager", confidence: "high", terms: [/\bprogram manager\b/i, /\bproject manager\b/i] },
  { career: "Business Development Specialist", confidence: "high", terms: [/\bbusiness development\b/i, /\bsales (?:manager|representative|executive)\b/i, /\baccount executive\b/i] },
  { career: "IT & Cybersecurity Specialist", confidence: "high", terms: [/\bcybersecurity\b/i, /\binformation security\b/i, /\bit specialist\b/i, /\bsystems administrator\b/i, /\bit support\b/i, /\bhelp desk\b/i] },
  { career: "Aircraft Mechanic (A&P)", confidence: "high", terms: [/\ba&p\b/i, /\baircraft mechanic\b/i, /\baircraft maintenance technician\b/i] },
  { career: "Avionics Technician", confidence: "high", terms: [/\bavionics\b/i] },
  { career: "Airline Pilot", confidence: "high", terms: [/\bairline pilot\b/i, /\bfirst officer\b/i, /\bcaptain\b/i] },
  { career: "Flight Instructor", confidence: "high", terms: [/\bflight instructor\b/i, /\bcfi\b/i] },
  { career: "Ramp Agent", confidence: "high", terms: [/\bramp agent\b/i, /\bground handler\b/i] },
  // Generic hands-on technician catch-all -- checked after Avionics
  // Technician above, so an avionics-specific title still wins that more
  // precise match; a plain "Composites Technician" or "EPS Manufacturing
  // Technician" falls through to here instead of going unmatched.
  { career: "Aircraft Mechanic (A&P)", confidence: "low", terms: [/\btechnician\b/i] },
  // The literal word "engineer"/"engineering" in a title is about as
  // reliable a signal as this file has -- kept high confidence, separate
  // from the softer indirect signals below.
  { career: "Aerospace Engineer", confidence: "high", terms: [/\bengineer(ing)?\b/i] },
  // Indirect engineering signals -- a hardware/software/design-lead role,
  // or a bare "EE" abbreviation, that would otherwise fall through to the
  // generic manager catch-all below even when this is the closer fit.
  // Real inferences, not a literal match, so kept low confidence.
  { career: "Aerospace Engineer", confidence: "low", terms: [/\bsoftware\b/i, /\bhardware\b/i, /\bdesign lead\b/i, /\bEE\b/] },
  // Generic manager/director catch-all -- checked last of all, so only a
  // title with no domain-specific or engineering fit (e.g. "Corporate
  // Development Manager") lands here rather than going unmatched.
  { career: "Program Manager", confidence: "low", terms: [/\bmanager\b/i, /\bdirector\b/i] },
];

export function suggestCareerMatch(title: string, careers: CareerOption[]): { id: string; confidence: "high" | "low" } | null {
  const rule = TITLE_RULES.find((candidate) => candidate.terms.some((term) => term.test(title)));
  if (!rule) return null;
  const id = careers.find((career) => career.name.toLowerCase() === rule.career.toLowerCase())?.id;
  return id ? { id, confidence: rule.confidence } : null;
}

export function suggestCareerId(title: string, careers: CareerOption[]): string | null {
  return suggestCareerMatch(title, careers)?.id ?? null;
}

export function groupCareers(careers: CareerOption[]) {
  const groups = new Map<string, CareerOption[]>();
  for (const career of careers) {
    const category = career.categoryName || "Other aviation careers";
    groups.set(category, [...(groups.get(category) ?? []), career]);
  }
  return Array.from(groups, ([category, options]) => ({ category, options }));
}
