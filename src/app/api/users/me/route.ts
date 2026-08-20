import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

export async function GET() {
  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  try {
    const response = await backendApi.get("/api/users/me", {
      headers: { Authorization: authorization },
    });

    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
