import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { AppShell } from "@/components/app-shell";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <AppShell user={user}>{children}</AppShell>;
}
