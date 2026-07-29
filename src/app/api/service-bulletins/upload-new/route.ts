import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const MAX_PDF_SIZE = 100 * 1024 * 1024;

function sanitizeFilename(value: string | null) {
  const basename = (value || "service-bulletin.pdf").split(/[\\/]/).pop() || "service-bulletin.pdf";
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
    return apiJson({ message: "Ukuran file PDF melebihi batas 100 MB." }, { status: 413 });
  }

  const filename = sanitizeFilename(request.headers.get("x-file-name"));
  if (!filename.toLowerCase().endsWith(".pdf")) {
    return apiJson({ message: "Nama file harus menggunakan ekstensi .pdf." }, { status: 400 });
  }

  const requestedAircraftType = request.headers.get("x-aircraft-type")?.trim() || null;
  if (requestedAircraftType === "Unassigned") {
    return apiJson(
      { message: "Pilih aircraft type yang terdaftar atau kosongkan field tersebut." },
      { status: 400 },
    );
  }
  if (requestedAircraftType && requestedAircraftType.length > 80) {
    return apiJson({ message: "Aircraft type tidak valid." }, { status: 400 });
  }

  try {
    const body = await request.arrayBuffer();
    if (body.byteLength === 0) {
      return apiJson({ message: "File PDF kosong." }, { status: 400 });
    }
    if (body.byteLength > MAX_PDF_SIZE) {
      return apiJson({ message: "Ukuran file PDF melebihi batas 100 MB." }, { status: 413 });
    }

    const signature = new TextDecoder("ascii").decode(body.slice(0, 4));
    if (signature !== "%PDF") {
      return apiJson({ message: "Signature file PDF tidak valid." }, { status: 400 });
    }

    const response = await backendApi.post("/api/service-bulletins/upload-new", body, {
      headers: {
        Authorization: authorization,
        "Content-Type": "application/pdf",
        "X-File-Name": filename,
        ...(requestedAircraftType
          ? { "X-Aircraft-Type": requestedAircraftType }
          : {}),
      },
      maxBodyLength: MAX_PDF_SIZE,
      maxContentLength: 5 * 1024 * 1024,
      // The backend completes AI extraction before returning this response.
      timeout: 0,
      signal: request.signal,
    });

    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
