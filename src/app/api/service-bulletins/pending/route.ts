import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const ALLOWED_QUERY_KEYS = new Set([
  "page",
  "limit",
  "search",
  "sbType",
  "status",
  "operatorId",
]);

export async function GET(request: Request) {
  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  const incoming = new URL(request.url).searchParams;
  const page = Number(incoming.get("page") ?? "1");
  const limit = Number(incoming.get("limit") ?? "10");

  if (
    !Number.isInteger(page)
    || page < 1
    || !Number.isInteger(limit)
    || limit < 1
    || limit > 100
  ) {
    return apiJson(
      { message: "Parameter pagination tidak valid." },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  for (const [key, value] of incoming) {
    if (ALLOWED_QUERY_KEYS.has(key) && key !== "page" && key !== "limit") {
      params.set(key, value.slice(0, 200));
    }
  }

  try {
    const response = await backendApi.get(
      `/api/service-bulletins/pending?${params.toString()}`,
      { headers: { Authorization: authorization } },
    );
    return apiJson(response.data);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
