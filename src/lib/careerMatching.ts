export interface CareerOption {
  id: string;
  name: string;
  categoryName?: string | null;
}

const TITLE_RULES: Array<{ career: string; terms: RegExp[] }> = [
  { career: "Cost Analyst", terms: [/\bcost analyst\b/i, /\bcost estimator\b/i, /\bpricing analyst\b/i] },
  { career: "Financial Analyst", terms: [/\bfinancial analyst\b/i, /\bfinance analyst\b/i, /\bfp&a\b/i] },
  { career: "Accountant", terms: [/\baccountant\b/i, /\baccounting\b/i, /\bcontroller\b/i] },
  { career: "Procurement Specialist", terms: [/\bprocurement\b/i, /\bpurchasing\b/i, /\bbuyer\b/i, /\bsourcing\b/i] },
  { career: "Human Resources Specialist", terms: [/\bhuman resources\b/i, /\bhr (?:specialist|generalist|manager)\b/i, /\brecruiter\b/i, /\btalent acquisition\b/i] },
  { career: "Program Manager", terms: [/\bprogram manager\b/i, /\bproject manager\b/i] },
  { career: "Business Development Specialist", terms: [/\bbusiness development\b/i, /\bsales (?:manager|representative|executive)\b/i, /\baccount executive\b/i] },
  { career: "IT & Cybersecurity Specialist", terms: [/\bcybersecurity\b/i, /\binformation security\b/i, /\bit specialist\b/i, /\bsystems administrator\b/i] },
  { career: "Aircraft Mechanic (A&P)", terms: [/\ba&p\b/i, /\baircraft mechanic\b/i, /\baircraft maintenance technician\b/i] },
  { career: "Avionics Technician", terms: [/\bavionics\b/i] },
  { career: "Airline Pilot", terms: [/\bairline pilot\b/i, /\bfirst officer\b/i, /\bcaptain\b/i] },
  { career: "Flight Instructor", terms: [/\bflight instructor\b/i, /\bcfi\b/i] },
  { career: "Ramp Agent", terms: [/\bramp agent\b/i, /\bground handler\b/i] },
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
