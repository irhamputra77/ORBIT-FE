import AdminDashboardPage from "@/features/dashboard/components/AdminDashboardPage";
import { requireRole } from "@/lib/auth/serverAuthorization";

export default async function Page() {
  await requireRole(["ADMIN"]);
  return <AdminDashboardPage />;
}
