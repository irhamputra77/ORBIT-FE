import { EesDetailPage } from "@/features/ees-detail";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sourceSbId?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const sourceSbId = Array.isArray(query.sourceSbId)
    ? query.sourceSbId[0]
    : query.sourceSbId;

  return (
    <EesDetailPage
      eesId={id}
      sourceSbId={sourceSbId || ""}
    />
  );
}
