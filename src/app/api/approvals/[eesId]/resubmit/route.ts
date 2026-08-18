import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const EES_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const MAX_SIGNATURE_SIZE = 5 * 1024 * 1024;
const ALLOWED_SIGNATURE_TYPES = new Set(["image/jpeg", "image/png"]);

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

  let incomingForm: FormData;
  try {
    incomingForm = await request.formData();
  } catch {
    return apiJson(
      { message: "Request harus menggunakan multipart/form-data." },
      { status: 400 },
    );
  }

  const assignedToId = incomingForm.get("assignedToId");
  if (typeof assignedToId !== "string" || !USER_ID_PATTERN.test(assignedToId)) {
    return apiJson(
      { message: "assignedToId wajib diisi dengan User ID yang valid." },
      { status: 400 },
    );
  }

  const signature = incomingForm.get("signature");
  if (signature !== null) {
    if (!(signature instanceof File)) {
      return apiJson({ message: "Signature tidak valid." }, { status: 400 });
    }
    if (!ALLOWED_SIGNATURE_TYPES.has(signature.type)) {
      return apiJson(
        { message: "Signature harus berupa gambar PNG atau JPEG." },
        { status: 400 },
      );
    }
    if (signature.size === 0 || signature.size > MAX_SIGNATURE_SIZE) {
      return apiJson(
        { message: "Ukuran signature harus antara 1 byte dan 5 MB." },
        { status: 400 },
      );
    }
  }

  const outgoingForm = new FormData();
  outgoingForm.append("assignedToId", assignedToId);
  if (signature instanceof File) {
    outgoingForm.append("signature", signature, signature.name);
  }

  try {
    const response = await backendApi.post(
      `/api/approvals/${encodeURIComponent(eesId)}/resubmit`,
      outgoingForm,
      {
        headers: { Authorization: authorization },
        timeout: 30_000,
        maxBodyLength: MAX_SIGNATURE_SIZE + 256 * 1024,
      },
    );
    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
