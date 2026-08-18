import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const MAX_FILES = 6;
const MAX_PDF_SIZE = 100 * 1024 * 1024;
const MAX_TOTAL_SIZE = MAX_FILES * MAX_PDF_SIZE;

function sanitizeFilename(value: string) {
  const basename = value.split(/[\\/]/).pop() || "svr-upload.pdf";
  return basename.replace(/[^a-zA-Z0-9._ ()-]/g, "_").slice(0, 180);
}

async function validatePdf(file: File) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "Semua file SVR harus menggunakan ekstensi .pdf.";
  }
  if (file.type && file.type !== "application/pdf") {
    return "Semua file SVR harus bertipe application/pdf.";
  }
  if (file.size === 0) return `File ${file.name} kosong.`;
  if (file.size > MAX_PDF_SIZE) {
    return `Ukuran file ${file.name} melebihi batas 100 MB.`;
  }
  const signature = new TextDecoder("ascii").decode(
    await file.slice(0, 4).arrayBuffer(),
  );
  return signature === "%PDF"
    ? null
    : `Signature file ${file.name} tidak valid.`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ docType: string }> },
) {
  const { docType } = await params;
  if (docType.toUpperCase() !== "SVR") {
    return apiJson({ message: "Tipe dokumen upload tidak didukung." }, { status: 400 });
  }

  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return apiJson(
      { message: "Upload SVR harus menggunakan multipart/form-data." },
      { status: 400 },
    );
  }

  try {
    const incoming = await request.formData();
    const files = incoming
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0 || files.length > MAX_FILES) {
      return apiJson(
        { message: `Pilih 1 sampai ${MAX_FILES} file PDF SVR.` },
        { status: 400 },
      );
    }

    const totalSize = files.reduce((total, file) => total + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return apiJson(
        { message: "Total ukuran file SVR melebihi batas upload." },
        { status: 413 },
      );
    }

    for (const file of files) {
      const validationError = await validatePdf(file);
      if (validationError) {
        return apiJson({ message: validationError }, { status: 400 });
      }
    }

    const outbound = new FormData();
    files.forEach((file) => {
      outbound.append("files", file, sanitizeFilename(file.name));
    });

    const response = await backendApi.post(
      "/api/shop-visit-reports/upload/SVR",
      outbound,
      {
        headers: { Authorization: authorization },
        maxBodyLength: MAX_TOTAL_SIZE,
        maxContentLength: 20 * 1024 * 1024,
        timeout: 0,
        signal: request.signal,
      },
    );
    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
