import { apiJson, proxyBackendBinary } from "@/lib/http/backendRoute";

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const OPERATORS = new Set(["garuda", "citilink"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; operator: string }> },
) {
  const { id, operator } = await params;
  if (!ID_PATTERN.test(id) || !OPERATORS.has(operator)) {
    return apiJson({ message: "Parameter export tidak valid." }, { status: 400 });
  }

  return proxyBackendBinary(
    `/api/service-bulletins/${encodeURIComponent(id)}/export/${operator}/pdf`,
    "inline",
  );
}
