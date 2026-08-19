"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import type { Role } from "@/lib/types/database";

export interface ActionResult {
  error?: string;
}

// Fixed credentials for the seeded demo accounts (see scripts/seed-demo-users.mjs).
// Server-only — never sent to the client.
const DEMO_ACCOUNTS: Record<Role, { email: string; password: string }> = {
  admin: { email: "admin@clinicos.demo", password: "Demo1234!" },
  doctor: { email: "doctor@clinicos.demo", password: "Demo1234!" },
  nurse: { email: "nurse@clinicos.demo", password: "Demo1234!" },
  receptionist: { email: "receptionist@clinicos.demo", password: "Demo1234!" },
};

export async function loginAsDemo(role: Role): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(DEMO_ACCOUNTS[role]);
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function login(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signup(input: unknown): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
