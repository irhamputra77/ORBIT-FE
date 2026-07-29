import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const MAX_PDF_SIZE = 100 * 1024 * 1024;

function sanitizeFilename(value: string | null) {
  const basename = (value || "svr-upload.pdf").split(/[\\/]/).pop() || "svr-upload.pdf";
  return basename.replace(/[^a-zA-Z0-9._ ()-]/g, "_").slice(0, 180);
}

export async function POST(request: Request) {
  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type")?.split(";")[0].trim();
  if (contentType !== "application/pdf") {
    return apiJson({ message: "Content-Type harus application/pdf." }, { status: 400 });
  }

  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > MAX_PDF_SIZE) {
    return apiJson({ message: "Ukuran file PDF SVR melebihi batas 100 MB." }, { status: 413 });
  }

  const filename = sanitizeFilename(request.headers.get("x-file-name"));
  if (!filename.toLowerCase().endsWith(".pdf")) {
    return apiJson({ message: "Nama file SVR harus menggunakan ekstensi .pdf." }, { status: 400 });
  }

  try {
    const body = await request.arrayBuffer();
    if (body.byteLength === 0) {
      return apiJson({ message: "File PDF SVR kosong." }, { status: 400 });
    }
    if (body.byteLength > MAX_PDF_SIZE) {
      return apiJson({ message: "Ukuran file PDF SVR melebihi batas 100 MB." }, { status: 413 });
    }

    const signature = new TextDecoder("ascii").decode(body.slice(0, 4));
    if (signature !== "%PDF") {
      return apiJson({ message: "Signature file PDF tidak valid." }, { status: 400 });
    }

    const response = await backendApi.post(
      "/api/shop-visit-reports/upload",
      body,
      {
        headers: {
          Authorization: authorization,
          "Content-Type": "application/pdf",
          "X-File-Name": filename,
        },
        maxBodyLength: MAX_PDF_SIZE,
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
