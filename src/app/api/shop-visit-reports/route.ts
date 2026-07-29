import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const ESN_PATTERN = /^[a-zA-Z0-9._/-]{1,64}$/;

export async function GET(request: Request) {
  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const esn = searchParams.get("esn")?.trim() || undefined;

  if (
    !Number.isInteger(page)
    || page < 1
    || !Number.isInteger(limit)
    || limit < 1
    || limit > 100
    || (esn !== undefined && !ESN_PATTERN.test(esn))
  ) {
    return apiJson({ message: "Parameter pencarian SVR tidak valid." }, { status: 400 });
  }

  try {
    const response = await backendApi.get("/api/shop-visit-reports", {
      params: { page, limit, ...(esn ? { esn } : {}) },
      headers: { Authorization: authorization },
    });
    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
