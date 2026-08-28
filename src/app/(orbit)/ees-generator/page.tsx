import { EESGeneratorWorkflow } from "@/features/ees-generator";

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    resumeEesId?: string | string[];
    sourceSbId?: string | string[];
    step?: string | string[];
  }>;
}) {
  const query = await searchParams;

  return (
    <EESGeneratorWorkflow
      resumeEesId={firstQueryValue(query.resumeEesId)}
      resumeSourceSbId={firstQueryValue(query.sourceSbId)}
      resumeStep={firstQueryValue(query.step)}
    />
  );
}
