export interface CareerOption {
  id: string;
  name: string;
  categoryName?: string | null;
}

const TITLE_RULES: Array<{ career: string; terms: RegExp[] }> = [
  { career: "Cost Analyst", terms: [/\bcost analyst\b/i, /\bcost estimator\b/i, /\bpricing analyst\b/i] },
  { career: "Financial Analyst", terms: [/\bfinancial analyst\b/i, /\bfinance analyst\b/i, /\bfp&a\b/i] },
  { career: "Accountant", terms: [/\baccountant\b/i, /\baccounting\b/i, /\bcontroller\b/i] },
  { career: "Procurement Specialist", terms: [/\bprocurement\b/i, /\bpurchasing\b/i, /\bbuyer\b/i, /\bsourcing\b/i, /\bsupply chain\b/i] },
  {
    career: "Human Resources Specialist",
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
  { career: "Program Manager", terms: [/\bprogram manager\b/i, /\bproject manager\b/i] },
  { career: "Business Development Specialist", terms: [/\bbusiness development\b/i, /\bsales (?:manager|representative|executive)\b/i, /\baccount executive\b/i] },
  { career: "IT & Cybersecurity Specialist", terms: [/\bcybersecurity\b/i, /\binformation security\b/i, /\bit specialist\b/i, /\bsystems administrator\b/i, /\bit support\b/i, /\bhelp desk\b/i] },
  { career: "Aircraft Mechanic (A&P)", terms: [/\ba&p\b/i, /\baircraft mechanic\b/i, /\baircraft maintenance technician\b/i] },
  { career: "Avionics Technician", terms: [/\bavionics\b/i] },
  { career: "Airline Pilot", terms: [/\bairline pilot\b/i, /\bfirst officer\b/i, /\bcaptain\b/i] },
  { career: "Flight Instructor", terms: [/\bflight instructor\b/i, /\bcfi\b/i] },
  { career: "Ramp Agent", terms: [/\bramp agent\b/i, /\bground handler\b/i] },
  // Generic hands-on technician catch-all -- checked after Avionics
  // Technician above, so an avionics-specific title still wins that more
  // precise match; a plain "Composites Technician" or "EPS Manufacturing
  // Technician" falls through to here instead of going unmatched.
  { career: "Aircraft Mechanic (A&P)", terms: [/\btechnician\b/i] },
  // Generic engineering catch-all -- checked after every domain-specific
  // rule above, so a role like "Aircraft Dynamics Engineer" or "Staff GNC
  // Engineer" still gets a reasonable suggestion instead of none at all.
  // Also covers adjacent engineering-flavored titles that don't literally
  // say "engineer" -- a hardware/software/design-lead role, or a bare "EE"
  // abbreviation -- which would otherwise fall through to the generic
  // manager catch-all below even when this is the closer fit.
  { career: "Aerospace Engineer", terms: [/\bengineer(ing)?\b/i, /\bsoftware\b/i, /\bhardware\b/i, /\bdesign lead\b/i, /\bEE\b/] },
  // Generic manager/director catch-all -- checked last of all, so only a
  // title with no domain-specific or engineering fit (e.g. "Corporate
  // Development Manager") lands here rather than going unmatched.
  { career: "Program Manager", terms: [/\bmanager\b/i, /\bdirector\b/i] },
];

export function suggestCareerId(title: string, careers: CareerOption[]): string | null {
  const rule = TITLE_RULES.find((candidate) => candidate.terms.some((term) => term.test(title)));
  if (!rule) return null;
  return careers.find((career) => career.name.toLowerCase() === rule.career.toLowerCase())?.id ?? null;
}

export function groupCareers(careers: CareerOption[]) {
  const groups = new Map<string, CareerOption[]>();
  for (const career of careers) {
    const category = career.categoryName || "Other aviation careers";
    groups.set(category, [...(groups.get(category) ?? []), career]);
  }
  return Array.from(groups, ([category, options]) => ({ category, options }));
}
