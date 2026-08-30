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

const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
  email: "employer-test1@aviationcareers.test",
  password: "Sprint6Test!2026",
});
console.log("signIn error:", signInError);
console.log("user id:", signInData?.user?.id);

const { data: em, error: emError } = await anon
  .from("employer_members")
  .select("role, status, organization_id, employer_organizations ( company_id, companies ( id, name, status ) )")
  .eq("user_id", signInData.user.id)
  .eq("status", "active")
  .maybeSingle();
console.log("employer_members query:", JSON.stringify({ em, emError }, null, 2));
