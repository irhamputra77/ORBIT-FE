import { ManagerWorkspacePage } from "@/features/manager";
import { requireRole } from "@/lib/auth/serverAuthorization";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ eesId?: string | string[] }>;
}) {
  await requireRole(["MANAGER"]);
  const query = await searchParams;
  const eesId = Array.isArray(query.eesId) ? query.eesId[0] : query.eesId;

  return <ManagerWorkspacePage initialEesId={eesId} />;
}
