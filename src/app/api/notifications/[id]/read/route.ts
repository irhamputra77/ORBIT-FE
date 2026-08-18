import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const NOTIFICATION_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!NOTIFICATION_ID_PATTERN.test(id)) {
    return apiJson({ message: "Notification ID tidak valid." }, { status: 400 });
  }

  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  try {
    const response = await backendApi.patch(
      `/api/notifications/${encodeURIComponent(id)}/read`,
      undefined,
      { headers: { Authorization: authorization } },
    );

    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
