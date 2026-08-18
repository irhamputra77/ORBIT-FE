import { SecondEngineerReviewPage } from "@/features/second-engineer-review";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ eesId?: string | string[] }>;
}) {
  const query = await searchParams;
  const eesId = Array.isArray(query.eesId) ? query.eesId[0] : query.eesId;

  return <SecondEngineerReviewPage initialEesId={eesId} />;
}
