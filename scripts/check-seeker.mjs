import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

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

const { data: profiles } = await db.from("profiles").select("id, email").in("email", [
  "jobseeker-test1@aviationcareers.test",
  "jobseeker-test2@aviationcareers.test",
]);
console.log("profiles", profiles);

for (const p of profiles ?? []) {
  const { data: resumes } = await db.from("resumes").select("id, file_name, is_primary").eq("user_id", p.id);
  console.log(p.email, "resumes:", resumes);
}
