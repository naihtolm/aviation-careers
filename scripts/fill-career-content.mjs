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

const { data: careers } = await db.from("careers").select("id, slug");
const byslug = Object.fromEntries(careers.map((c) => [c.slug, c.id]));

const CONTENT = [
  {
    career_id: byslug["aircraft-mechanic-ap"],
    overview:
      "Aircraft Mechanics and Avionics Technicians (A&P mechanics) inspect, maintain, troubleshoot, and repair aircraft airframes, engines, and related systems to keep them airworthy and in compliance with FAA regulations. They work for airlines, MRO (maintenance, repair, overhaul) shops, FBOs, the military, and aircraft manufacturers.",
    responsibilities: [
      "Perform scheduled inspections (A checks, annual and 100-hour inspections) and troubleshoot mechanical, electrical, and hydraulic issues",
      "Repair or replace worn, defective, or damaged airframe and powerplant components",
      "Read and interpret maintenance manuals, service bulletins, and airworthiness directives",
      "Document all work performed in aircraft maintenance logs per FAA recordkeeping requirements",
      "Perform run-ups and operational checks to confirm airworthiness before an aircraft returns to service",
    ],
    requirements: [
      "FAA Airframe & Powerplant (A&P) certificate",
      "Pass FAA written, oral, and practical exams for both Airframe and Powerplant ratings",
      "Strong mechanical aptitude and attention to detail",
    ],
    training_path:
      "Most A&P mechanics complete an FAA-approved Part 147 aviation maintenance technician school (typically 18-24 months), then pass the FAA's written, oral, and practical exams for both the Airframe and Powerplant ratings. The alternative path is 30 months of supervised on-the-job experience (18 months for a single rating), documented and signed off by a certificated mechanic, followed by the same FAA exams. Many technicians later pursue an Inspection Authorization (IA), which allows them to approve aircraft for return to service after major repairs and annual inspections.",
    career_path:
      "Entry-level A&P mechanics typically start as line technicians handling routine inspections and minor repairs, often specializing in a specific aircraft type or system (avionics, engines, structures). With experience, mechanics can move into lead technician, crew chief, or shift supervisor roles, pursue an Inspection Authorization (IA) to sign off major repairs, or transition into quality assurance, maintenance planning, or FAA-designated roles.",
    work_environment:
      "Hangars, ramps, and maintenance shops -- often working in shifts to cover overnight and weekend maintenance windows, sometimes outdoors in variable weather. Physically demanding work involving standing, climbing, and working in tight spaces.",
    pros: [
      "Entry-level friendly -- doesn't require a 4-year degree",
      "Strong, steady demand across airlines, MROs, and general aviation",
      "Clear certification path with recognized, portable credentials",
      "Hands-on work with tangible results",
    ],
    considerations: [
      "Physically demanding, often outdoors or in noisy hangar environments",
      "Shift work is common, including nights, weekends, and holidays",
      "Every repair must meet strict FAA documentation and airworthiness standards",
      "Entry-level pay is modest relative to the required certification effort",
    ],
    seo_title: "Aircraft Mechanic (A&P) Career Guide -- Salary, Requirements, How to Become One",
    seo_description: "What A&P aircraft mechanics do, how much they earn, and how to get certified.",
    published_at: new Date().toISOString(),
  },
  {
    career_id: byslug["airline-pilot"],
    overview:
      "Airline pilots fly and navigate commercial aircraft to transport passengers and cargo safely, working alongside a co-pilot (first officer) and cabin crew. They're responsible for flight planning, pre-flight checks, in-flight decision-making, and complying with FAA regulations and airline procedures on every flight.",
    responsibilities: [
      "Conduct pre-flight planning, weather briefings, and aircraft inspections before every flight",
      "Operate the aircraft during taxi, takeoff, cruise, and landing, monitoring systems and instruments throughout",
      "Communicate with air traffic control and coordinate with the flight crew and dispatch",
      "Make real-time decisions in response to weather, mechanical, or operational changes",
      "Complete required flight and duty-time documentation per FAA and airline recordkeeping rules",
    ],
    requirements: [
      "FAA Airline Transport Pilot (ATP) certificate -- requires 1,500 total flight hours under standard rules",
      "First-class FAA medical certificate, renewed regularly",
      "Strong communication, decision-making, and situational awareness skills",
    ],
    training_path:
      "The typical path starts with a Private Pilot Certificate, followed by an Instrument Rating and Commercial Pilot Certificate -- often built through a flight school or a collegiate aviation program. Most pilots then build flight hours as a flight instructor or in charter/cargo operations before qualifying for the FAA Airline Transport Pilot (ATP) certificate, which requires 1,500 total flight hours under standard rules (reduced-hour pathways exist for graduates of certain accredited aviation degree programs and for military-trained pilots). Regional airlines are the most common entry point into airline flying before moving to a mainline carrier.",
    career_path:
      "Pilots typically build hours as flight instructors or in charter/cargo operations, then join a regional airline as a first officer. With seniority and additional type ratings, pilots can upgrade to captain, move to a mainline or cargo carrier, or specialize in wide-body international routes -- pay and schedule seniority are both governed by time at each airline.",
    work_environment:
      "In the cockpit, with schedules built around flight assignments rather than a standard workweek -- including early mornings, overnight layovers, weekends, and holidays. Time away from home is common, especially early in a pilot's career.",
    pros: [
      "High earning potential, especially at mainline carriers with seniority",
      "Travel benefits and flexible days off between trips",
      "Strong long-term demand driven by pilot retirements",
      "Clear, merit-based upgrade path tied to seniority",
    ],
    considerations: [
      "Significant upfront time and cost to reach 1,500 flight hours and ATP certification",
      "Irregular schedules, time zone changes, and time away from home",
      "Pay and schedule seniority reset when moving between airlines",
      "Subject to strict FAA medical certification and duty-time limits",
    ],
    seo_title: "Airline Pilot Career Guide -- Salary, Requirements, How to Become One",
    seo_description: "What airline pilots do, how much they earn, and the path to an ATP certificate.",
    published_at: new Date().toISOString(),
  },
];

for (const row of CONTENT) {
  const { error } = await db.from("career_content").upsert(row, { onConflict: "career_id" });
  if (error) console.log("FAILED", row.career_id, error.message);
  else console.log("OK", row.career_id);
}

const { data: apCert } = await db
  .from("certifications")
  .select("id")
  .eq("name", "FAA Airframe & Powerplant (A&P) Certificate")
  .maybeSingle();

let { data: atpCert } = await db
  .from("certifications")
  .select("id")
  .eq("name", "FAA Airline Transport Pilot (ATP) Certificate")
  .maybeSingle();
if (!atpCert) {
  const { data: created, error } = await db
    .from("certifications")
    .insert({ name: "FAA Airline Transport Pilot (ATP) Certificate" })
    .select("id")
    .single();
  if (error) console.log("FAILED creating ATP cert", error.message);
  atpCert = created;
}

const REQS = [
  { career_id: byslug["aircraft-mechanic-ap"], certification_id: apCert?.id, requirement_type: "required" },
  { career_id: byslug["airline-pilot"], certification_id: atpCert?.id, requirement_type: "required" },
];

for (const req of REQS) {
  if (!req.certification_id) continue;
  const { data: existing } = await db
    .from("career_certification_requirements")
    .select("id")
    .eq("career_id", req.career_id)
    .eq("certification_id", req.certification_id)
    .maybeSingle();
  if (existing) continue;
  const { error } = await db.from("career_certification_requirements").insert(req);
  if (error) console.log("FAILED cert req", req, error.message);
  else console.log("OK cert req", req.career_id, req.certification_id);
}

console.log("done");
