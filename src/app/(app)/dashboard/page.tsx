import { getCurrentUser } from "@/lib/auth/get-profile";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard";
import { NurseDashboard } from "@/components/dashboard/nurse-dashboard";
import { ReceptionistDashboard } from "@/components/dashboard/receptionist-dashboard";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  switch (user.role) {
    case "doctor":
      return <DoctorDashboard user={user} />;
    case "nurse":
      return <NurseDashboard user={user} />;
    case "receptionist":
      return <ReceptionistDashboard user={user} />;
    default:
      return <AdminDashboard user={user} />;
  }
}
