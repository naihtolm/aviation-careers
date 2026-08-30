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
const TEST_PASSWORD = "Sprint6Test!2026";

async function findUserByEmail(email) {
  let page = 1;
  while (true) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found;
    if (data.users.length < 200) return null;
    page++;
  }
}

// Reset password on existing QA-only test accounts (never touches the real user's own account).
for (const email of ["qa-admin@aviationcareers.test", "jobseeker-test2@aviationcareers.test"]) {
  const user = await findUserByEmail(email);
  if (!user) {
    console.log(email, "NOT FOUND");
    continue;
  }
  const { error } = await db.auth.admin.updateUserById(user.id, { password: TEST_PASSWORD });
  console.log(email, error ? `ERROR: ${error.message}` : "password reset OK");
}

// Fresh employer test account
const employerEmail = "employer-test1@aviationcareers.test";
let employerUser = await findUserByEmail(employerEmail);
if (!employerUser) {
  const { data, error } = await db.auth.admin.createUser({
    email: employerEmail,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error) console.log(employerEmail, "CREATE ERROR:", error.message);
  else console.log(employerEmail, "created OK");
} else {
  await db.auth.admin.updateUserById(employerUser.id, { password: TEST_PASSWORD });
  console.log(employerEmail, "already existed, password reset OK");
}
