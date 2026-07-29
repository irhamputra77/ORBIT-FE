import { apiJson, proxyBackendBinary } from "@/lib/http/backendRoute";

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!ID_PATTERN.test(id)) {
    return apiJson({ message: "Service Bulletin ID tidak valid." }, { status: 400 });
  }

  return proxyBackendBinary(
    `/api/service-bulletins/${encodeURIComponent(id)}/export/excel`,
    "attachment",
  );
}
