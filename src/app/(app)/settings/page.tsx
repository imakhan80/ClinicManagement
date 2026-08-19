import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { StaffRow } from "@/components/settings/staff-row";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const isAdmin = user.role === "admin";

  const [{ data: ownProfile }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("phone").eq("id", user.id).single(),
    isAdmin
      ? supabase.from("profiles").select("id, full_name, role, phone").order("full_name")
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and, if you're an admin, clinic staff." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">My profile</TabsTrigger>
          {isAdmin && <TabsTrigger value="staff">Staff</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="gap-3 p-5 shadow-sm">
              <h2 className="text-sm font-semibold">Profile</h2>
              <ProfileForm fullName={user.fullName} phone={ownProfile?.phone ?? null} />
            </Card>
            <Card className="gap-3 p-5 shadow-sm">
              <h2 className="text-sm font-semibold">Password</h2>
              <PasswordForm />
            </Card>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="staff" className="mt-4">
            <Card className="gap-0 overflow-hidden p-0 shadow-sm">
              <div className="border-b border-border px-5 py-3.5">
                <h2 className="text-sm font-semibold">Staff directory</h2>
              </div>
              <ul className="divide-y divide-border">
                {(staff ?? []).map((s) => (
                  <StaffRow
                    key={s.id}
                    id={s.id}
                    fullName={s.full_name}
                    role={s.role}
                    phone={s.phone}
                    isSelf={s.id === user.id}
                  />
                ))}
              </ul>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
