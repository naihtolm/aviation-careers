// No server imports here (unlike queries.ts/actions.ts) — this needs to
// be safely importable from client components too.
export const STATUSES = ["interested", "applied", "interviewing", "offer", "rejected", "withdrawn"] as const;
