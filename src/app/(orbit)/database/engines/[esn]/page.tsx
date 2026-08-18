import { EngineDetailPage } from "@/features/database/components/EngineDetailPage";

export default async function Page({ params }: { params: Promise<{ esn: string }> }) {
  const { esn } = await params;
  return <EngineDetailPage esn={esn} />;
}
