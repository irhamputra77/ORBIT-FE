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

  const searchParams = new URL(request.url).searchParams;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const unreadOnlyValue = searchParams.get("unreadOnly") ?? "false";

  if (
    !Number.isInteger(page)
    || page < 1
    || !Number.isInteger(limit)
    || limit < 1
    || limit > 100
    || !["true", "false"].includes(unreadOnlyValue)
  ) {
    return apiJson(
      { message: "Parameter daftar notifikasi tidak valid." },
      { status: 400 },
    );
  }

  try {
    const response = await backendApi.get("/api/notifications", {
      params: {
        page,
        limit,
        unreadOnly: unreadOnlyValue === "true",
      },
      headers: { Authorization: authorization },
    });

    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
