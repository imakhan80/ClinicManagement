// One-off seed script: creates/updates the 4 demo Supabase Auth accounts
// used by the "Or try a demo account" buttons on /login (see
// DEMO_ACCOUNTS in src/actions/auth.ts, which must stay in sync with this).
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (never committed).
// Usage: npm run seed:demo

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvLocal() {
  const envPath = path.join(rootDir, ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Add SUPABASE_SERVICE_ROLE_KEY to .env.local (from Supabase dashboard > Project Settings > API) and retry."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Keep in sync with DEMO_ACCOUNTS in src/actions/auth.ts.
const DEMO_USERS = [
  { email: "admin@clinicos.demo", password: "Demo1234!", role: "admin", fullName: "Ava Admin" },
  { email: "doctor@clinicos.demo", password: "Demo1234!", role: "doctor", fullName: "Dr. Noah Rivera" },
  { email: "nurse@clinicos.demo", password: "Demo1234!", role: "nurse", fullName: "Nora Nurse" },
  {
    email: "receptionist@clinicos.demo",
    password: "Demo1234!",
    role: "receptionist",
    fullName: "Reese Receptionist",
  },
];

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email === email);
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function seedUser({ email, password, role, fullName }) {
  let user = await findUserByEmail(email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created ${email}`);
  } else {
    console.log(`Found existing ${email}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role, full_name: fullName })
    .eq("id", user.id);
  if (profileError) throw profileError;

  console.log(`  -> profile set to role="${role}", full_name="${fullName}"`);
}

for (const demoUser of DEMO_USERS) {
  await seedUser(demoUser);
}

console.log("\nDone. Demo accounts are ready to use from the login screen.");
