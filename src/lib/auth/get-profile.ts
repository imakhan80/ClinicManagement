import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types/database";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role: profile.role,
    avatarUrl: profile.avatar_url,
  };
}
