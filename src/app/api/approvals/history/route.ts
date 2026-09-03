import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const HISTORY_STATUSES = new Set([
  "PENDING",
  "PARTIALLY_APPROVED",
  "APPROVED",
  "REJECTED",
  "RETURNED",
]);

export async function GET(request: Request) {
  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get("status")?.trim().toUpperCase();
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");

  if (
    (status && !HISTORY_STATUSES.has(status))
    || !Number.isInteger(page)
    || page < 1
    || !Number.isInteger(limit)
    || limit < 1
    || limit > 100
  ) {
    return apiJson(
      { message: "Parameter history approval tidak valid." },
      { status: 400 },
    );
  }

  try {
    const response = await backendApi.get("/api/approvals/history", {
      params: {
        ...(status ? { status } : {}),
        page,
        limit,
      },
      headers: { Authorization: authorization },
    });

    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
