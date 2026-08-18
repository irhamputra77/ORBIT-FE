import { ManagerWorkspacePage } from "@/features/manager";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ eesId?: string | string[] }>;
}) {
  const query = await searchParams;
  const eesId = Array.isArray(query.eesId) ? query.eesId[0] : query.eesId;

  return <ManagerWorkspacePage initialEesId={eesId} />;
}
