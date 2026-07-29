import { apiJson, proxyBackendBinary } from "@/lib/http/backendRoute";

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const RESOURCES = new Set(["view", "download"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; resource: string }> },
) {
  const { id, resource } = await params;
  if (!ID_PATTERN.test(id) || !RESOURCES.has(resource)) {
    return apiJson({ message: "Resource SVR tidak valid." }, { status: 400 });
  }

  return proxyBackendBinary(
    `/api/shop-visit-reports/${encodeURIComponent(id)}/${resource}`,
    resource === "view" ? "inline" : "attachment",
  );
}
