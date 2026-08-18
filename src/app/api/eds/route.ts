import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

export async function GET(request: Request) {
  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }
  const query = new URL(request.url).searchParams;
  const page = Number(query.get("page") || 1);
  const limit = Number(query.get("limit") || 20);
  const esn = query.get("esn")?.trim() || undefined;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return apiJson({ message: "Pagination EDS tidak valid." }, { status: 400 });
  }
  try {
    const response = await backendApi.get("/api/eds", {
      params: { page, limit, ...(esn ? { esn } : {}) },
      headers: { Authorization: authorization },
    });
    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
