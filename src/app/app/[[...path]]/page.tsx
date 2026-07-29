import { redirect } from "next/navigation";

export default async function LegacyAppRoute({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  const destination = path.length
    ? `/${path.map(segment => encodeURIComponent(segment)).join("/")}`
    : "/dashboard";

  redirect(destination);
}
