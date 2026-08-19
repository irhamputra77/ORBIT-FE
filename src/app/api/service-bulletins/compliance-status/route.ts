import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const ALLOWED_QUERY_KEYS = new Set([
  "search",
  "operatorId",
  "aircraftType",
  "engineModel",
  "complianceCategory",
  "documentStatus",
  "complianceStatus",
  "priority",
  "page",
  "limit",
  "sortBy",
  "sortOrder",
]);

const DOCUMENT_STATUSES = new Set([
  "DRAFT",
  "OPEN",
  "ACTIVE",
  "SUPERSEDED",
  "TERMINATED",
  "CANCELLED",
  "CLOSED",
  "CONCURRENT",
]);
const COMPLIANCE_STATUSES = new Set([
  "OPEN",
  "PARTIALLY_COMPLIED",
  "COMPLIED",
  "OVERDUE",
  "NOT_APPLICABLE",
  "UNKNOWN",
]);
const PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const SORT_FIELDS = new Set([
  "sbNumber",
  "title",
  "complianceCategory",
  "documentStatus",
  "complianceStatus",
  "updatedAt",
]);

function invalidEnum(value: string | null, allowed: Set<string>) {
  return Boolean(value && !allowed.has(value.toUpperCase()));
}

export async function GET(request: Request) {
  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  const incoming = new URL(request.url).searchParams;
  const page = Number(incoming.get("page") ?? "1");
  const limit = Number(incoming.get("limit") ?? "20");
  const category = incoming.get("complianceCategory");
  const sortOrder = incoming.get("sortOrder")?.toLowerCase();

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    (category !== null && (!Number.isInteger(Number(category)) || Number(category) < 0)) ||
    invalidEnum(incoming.get("documentStatus"), DOCUMENT_STATUSES) ||
    invalidEnum(incoming.get("complianceStatus"), COMPLIANCE_STATUSES) ||
    invalidEnum(incoming.get("priority"), PRIORITIES) ||
    Boolean(incoming.get("sortBy") && !SORT_FIELDS.has(incoming.get("sortBy")!)) ||
    Boolean(sortOrder && sortOrder !== "asc" && sortOrder !== "desc")
  ) {
    return apiJson({ message: "Parameter filter SB Status tidak valid." }, { status: 400 });
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy: incoming.get("sortBy") || "updatedAt",
    sortOrder: sortOrder || "desc",
  });

  for (const [key, value] of incoming) {
    if (
      ALLOWED_QUERY_KEYS.has(key) &&
      !["page", "limit", "sortBy", "sortOrder"].includes(key) &&
      value.trim()
    ) {
      params.set(key, value.trim().slice(0, 200));
    }
  }

  try {
    const response = await backendApi.get(
      `/api/service-bulletins/compliance-status?${params.toString()}`,
      {
        headers: { Authorization: authorization },
        timeout: 60_000,
      },
    );
    return apiJson(response.data);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
