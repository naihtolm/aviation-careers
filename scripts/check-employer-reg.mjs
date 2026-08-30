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

const { data: profile } = await db.from("profiles").select("id, email").eq("email", "employer-test1@aviationcareers.test").maybeSingle();
console.log("profile", profile);

const { data: companies } = await db.from("companies").select("*").ilike("name", "%SkyLink%");
console.log("companies", companies);

if (profile) {
  const { data: members } = await db.from("employer_members").select("*").eq("user_id", profile.id);
  console.log("employer_members", members);
}
