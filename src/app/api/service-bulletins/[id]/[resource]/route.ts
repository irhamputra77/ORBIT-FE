import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
  proxyBackendBinary,
} from "@/lib/http/backendRoute";

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const JSON_RESOURCES = new Set(["ai-summary", "applicability", "ees", "relations"]);
const BINARY_RESOURCES = new Set(["view", "download"]);
const POST_RESOURCES = new Set(["generate-ees", "relations"]);
const PATCH_RESOURCES = new Set(["ees"]);
const RELATION_TYPES = new Set(["CONCURRENT", "SUPERSEDES", "TERMINATES"]);
const CONDITION_TYPES = new Set(["PRE", "POST", "NONE"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; resource: string }> },
) {
  const { id, resource } = await params;

  if (
    !ID_PATTERN.test(id) ||
    (!JSON_RESOURCES.has(resource) && !BINARY_RESOURCES.has(resource))
  ) {
    return apiJson({ message: "Resource Service Bulletin tidak valid." }, { status: 400 });
  }

  if (BINARY_RESOURCES.has(resource)) {
    return proxyBackendBinary(
      `/api/service-bulletins/${encodeURIComponent(id)}/${resource}`,
      resource === "view" ? "inline" : "attachment",
    );
  }

  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  try {
    const response = await backendApi.get(
      `/api/service-bulletins/${encodeURIComponent(id)}/${resource}`,
      { headers: { Authorization: authorization } },
    );
    return apiJson(response.data);
  } catch (error) {
    return backendErrorResponse(error);
  }
}

async function mutateServiceBulletinResource(
  request: Request,
  params: Promise<{ id: string; resource: string }>,
  method: "post" | "patch",
) {
  const { id, resource } = await params;
  const allowedResources = method === "post" ? POST_RESOURCES : PATCH_RESOURCES;
  if (!ID_PATTERN.test(id) || !allowedResources.has(resource)) {
    return apiJson({ message: "Resource Service Bulletin tidak valid." }, { status: 400 });
  }

  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiJson(
      { message: "Request harus menggunakan application/json." },
      { status: 400 },
    );
  }

  if (method === "post" && resource === "relations") {
    if (!isRecord(body)) {
      return apiJson({ message: "Payload relasi SB tidak valid." }, { status: 400 });
    }

    const targetSbNumber =
      typeof body.targetSbNumber === "string"
        ? body.targetSbNumber.trim()
        : "";
    const relationType =
      typeof body.relationType === "string"
        ? body.relationType.trim().toUpperCase()
        : "";
    const conditionType =
      typeof body.conditionType === "string"
        ? body.conditionType.trim().toUpperCase()
        : "NONE";
    const remarks =
      typeof body.remarks === "string"
        ? body.remarks.trim()
        : "";

    if (!targetSbNumber || targetSbNumber.length > 255) {
      return apiJson(
        { message: "Target SB Number wajib diisi dan maksimal 255 karakter." },
        { status: 400 },
      );
    }
    if (!RELATION_TYPES.has(relationType)) {
      return apiJson(
        { message: "Relation Type harus CONCURRENT, SUPERSEDES, atau TERMINATES." },
        { status: 400 },
      );
    }
    if (!CONDITION_TYPES.has(conditionType)) {
      return apiJson(
        { message: "Condition Type harus PRE, POST, atau NONE." },
        { status: 400 },
      );
    }
    if (remarks.length > 2_000) {
      return apiJson(
        { message: "Remarks maksimal 2.000 karakter." },
        { status: 400 },
      );
    }

    body = {
      targetSbNumber,
      relationType,
      conditionType,
      ...(remarks ? { remarks } : {}),
    };
  }

  try {
    const response = await backendApi[method](
      `/api/service-bulletins/${encodeURIComponent(id)}/${resource}`,
      body,
      { headers: { Authorization: authorization } },
    );
    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; resource: string }> },
) {
  return mutateServiceBulletinResource(request, params, "post");
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; resource: string }> },
) {
  return mutateServiceBulletinResource(request, params, "patch");
}
