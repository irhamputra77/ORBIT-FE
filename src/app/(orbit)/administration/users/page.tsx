import { UserManagementPage } from "@/features/user-management";
import { requireRole } from "@/lib/auth/serverAuthorization";

export default async function Page() {
  await requireRole(["ADMIN"]);
  return <UserManagementPage />;
}
