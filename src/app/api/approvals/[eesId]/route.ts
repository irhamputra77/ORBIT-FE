import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const EES_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eesId: string }> },
) {
  const { eesId } = await params;
  if (!EES_ID_PATTERN.test(eesId)) {
    return apiJson({ message: "EES ID tidak valid." }, { status: 400 });
  }

  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  try {
    const response = await backendApi.get(`/api/approvals/${encodeURIComponent(eesId)}`, {
      headers: { Authorization: authorization },
    });
    return apiJson(response.data);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
