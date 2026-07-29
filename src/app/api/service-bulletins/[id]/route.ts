import { apiJson, backendApi, backendErrorResponse, getAuthorizationHeader } from "@/lib/http/backendRoute";

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!ID_PATTERN.test(id)) {
    return apiJson({ message: "Service Bulletin ID tidak valid." }, { status: 400 });
  }

  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  try {
    const response = await backendApi.get(`/api/service-bulletins/${encodeURIComponent(id)}`, {
      headers: { Authorization: authorization },
    });
    return apiJson(response.data);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
