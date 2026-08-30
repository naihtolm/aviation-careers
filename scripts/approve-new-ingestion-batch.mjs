// One-off script: approves the raw_job_records from the two newly added
// ingestion sources (Neon Aerospace, Electra.aero), mirroring exactly what
// src/app/admin/jobs/review/actions.ts's approveRawJob does server-side --
// same company/job/location/audit-log shape -- just run directly against
// the service client instead of through the browser admin UI.
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SOURCES = {
  "cfe04fb8-14b4-4409-8e74-b0e8b1e5c363": "Neon Aerospace",
  "80990da0-9696-4253-8b95-da4bdb3860b0": "Electra.aero",
};

function decodeHtmlEntities(html) {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Mirrors RawJobCard.tsx's parseLocation.
function parseLocation(raw) {
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length > 2 && /^\d/.test(parts[0])) parts.shift();
  const city = parts[0] ?? "";
  const state = (parts[1] ?? "").replace(/\s*\d{5}(-\d{4})?$/, "").trim();
  return { city, state };
}

async function findOrCreateLocation(city, state) {
  if (!city || !state) return null;
  const { data: existing } = await db.from("locations").select("id").ilike("city", city).ilike("state_code", state).maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await db
    .from("locations")
    .insert({ city, state_code: state, display_name: `${city}, ${state}` })
    .select("id")
    .single();
  return created?.id ?? null;
}

const { data: careers } = await db.from("careers").select("id, name");
const aerospaceEngineerId = careers.find((c) => c.name === "Aerospace Engineer")?.id ?? null;

// Only map to Aerospace Engineer when the title is genuinely an
// engineering role -- leave non-engineering titles (Finance, Supply
// Chain, Trade Compliance, ...) uncategorized rather than forcing a
// mismatch, matching what a careful admin would do by hand.
function guessCareerId(title) {
  return /engineer/i.test(title) ? aerospaceEngineerId : null;
}

const companyIdByName = {};
for (const name of Object.values(SOURCES)) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { data: existing } = await db.from("companies").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    companyIdByName[name] = existing.id;
    continue;
  }
  const { data: created, error } = await db
    .from("companies")
    .insert({ name, slug, company_type: "manufacturer", status: "active" })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create company ${name}: ${error.message}`);
  companyIdByName[name] = created.id;
  console.log(`Created company: ${name} (${created.id})`);
}

const { data: records } = await db
  .from("raw_job_records")
  .select("id, source_id, raw_data")
  .in("source_id", Object.keys(SOURCES))
  .eq("status", "received");

console.log(`Approving ${records.length} raw records...`);

let approved = 0;
for (const record of records) {
  const companyName = SOURCES[record.source_id];
  const companyId = companyIdByName[companyName];
  const title = record.raw_data.title ?? "(untitled)";
  const locationName = record.raw_data.location?.name ?? "";
  const { city, state } = parseLocation(locationName);

  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const { data: clash } = await db.from("jobs").select("id").eq("company_id", companyId).eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${++suffix}`;
  }

  const { data: job, error: jobError } = await db
    .from("jobs")
    .insert({
      company_id: companyId,
      career_id: guessCareerId(title),
      title,
      slug,
      description: decodeHtmlEntities(record.raw_data.content ?? ""),
      status: "active",
      source_type: "feed",
      application_type: "external_url",
      application_url: record.raw_data.absolute_url ?? null,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError) {
    console.log(`FAILED: ${title} — ${jobError.message}`);
    continue;
  }

  if (city && state) {
    const locationId = await findOrCreateLocation(city, state);
    await db.from("job_locations").insert({ job_id: job.id, location_id: locationId, is_primary: true });
  }

  await db.from("raw_job_records").update({ status: "processed", processed_at: new Date().toISOString() }).eq("id", record.id);
  await db.from("audit_logs").insert({
    action: "approve_raw_job",
    entity_type: "jobs",
    entity_id: job.id,
    new_data: { raw_record_id: record.id, note: "batch-approved via scripts/approve-new-ingestion-batch.mjs" },
  });

  approved += 1;
}

console.log(`Approved ${approved}/${records.length} jobs.`);
