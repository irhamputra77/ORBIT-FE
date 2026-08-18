import { EdsDetailPage } from "@/features/database/components/EdsDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EdsDetailPage id={id} />;
}
