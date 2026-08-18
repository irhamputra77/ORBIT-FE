import { apiJson, proxyBackendBinary } from "@/lib/http/backendRoute";

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; resource: string }> },
) {
  const { id, resource } = await params;
  if (!ID_PATTERN.test(id) || !["view", "download"].includes(resource)) {
    return apiJson({ message: "Resource EDS tidak valid." }, { status: 400 });
  }
  return proxyBackendBinary(
    `/api/eds/${encodeURIComponent(id)}/${resource}`,
    resource === "view" ? "inline" : "attachment",
  );
}
