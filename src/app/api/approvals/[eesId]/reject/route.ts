import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const EES_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const MAX_COMMENT_LENGTH = 2_000;

export async function POST(
  request: Request,
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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiJson(
      { message: "Request harus menggunakan application/json." },
      { status: 400 },
    );
  }

  const comment =
    typeof payload === "object"
    && payload !== null
    && "comment" in payload
    && typeof payload.comment === "string"
      ? payload.comment.trim()
      : "";

  if (!comment) {
    return apiJson(
      { message: "Comment wajib diisi ketika EES ditolak." },
      { status: 400 },
    );
  }
  if (comment.length > MAX_COMMENT_LENGTH) {
    return apiJson(
      { message: "Comment maksimal 2.000 karakter." },
      { status: 400 },
    );
  }

  try {
    const response = await backendApi.post(
      `/api/approvals/${encodeURIComponent(eesId)}/reject`,
      { comment },
      {
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
      },
    );
    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
