import axios from "axios";
import { directUploadClient } from "@/lib/http/directUploadClient";

export const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export class DatabaseExcelExportError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "DatabaseExcelExportError";
    this.status = status;
  }
}

function safeDownloadName(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function filenameFromDisposition(
  disposition: unknown,
  fallback: string,
) {
  if (typeof disposition !== "string") return safeDownloadName(fallback);

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return safeDownloadName(decodeURIComponent(utf8Match[1].trim()));
    } catch {
      // Continue with the regular filename or fallback.
    }
  }

  const filenameMatch = disposition.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i);
  const filename = filenameMatch?.[1] || filenameMatch?.[2];
  return safeDownloadName(filename?.trim() || fallback);
}

async function responseErrorMessage(
  error: unknown,
  documentLabel: "SVR" | "EDS",
) {
  if (!axios.isAxiosError(error)) {
    return {
      message: error instanceof Error
        ? error.message
        : `Data ${documentLabel} gagal diekspor ke Excel.`,
      status: undefined,
    };
  }

  const status = error.response?.status;
  const payload = error.response?.data;
  let backendMessage: string | undefined;

  if (payload instanceof Blob) {
    try {
      const body = JSON.parse(await payload.text()) as {
        error?: unknown;
        message?: unknown;
        details?: unknown;
      };
      backendMessage = [body.details, body.error, body.message]
        .find((value): value is string => typeof value === "string");
    } catch {
      // Some gateway responses are plain text or HTML.
    }
  }

  if (status === 401) {
    return { message: "Sesi login tidak valid. Silakan login kembali.", status };
  }
  if (status === 404) {
    return { message: `Dokumen ${documentLabel} tidak ditemukan atau telah dihapus.`, status };
  }
  if (backendMessage) return { message: backendMessage, status };
  if (status) return { message: `Export ${documentLabel} gagal (HTTP ${status}).`, status };
  return { message: `Data ${documentLabel} gagal diekspor ke Excel.`, status };
}

export async function downloadDatabaseExcel({
  endpoint,
  fallbackFilename,
  documentLabel,
}: {
  endpoint: string;
  fallbackFilename: string;
  documentLabel: "SVR" | "EDS";
}) {
  try {
    const response = await directUploadClient.get<Blob>(endpoint, {
      responseType: "blob",
      timeout: 0,
      headers: {
        Accept: EXCEL_MIME_TYPE,
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const blob = response.data;
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new DatabaseExcelExportError(
        "File Excel yang diterima dari backend kosong.",
      );
    }

    const filename = filenameFromDisposition(
      response.headers["content-disposition"],
      fallbackFilename,
    );
    const objectUrl = URL.createObjectURL(new Blob([blob], { type: EXCEL_MIME_TYPE }));
    const anchor = document.createElement("a");

    try {
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    }
  } catch (error) {
    if (error instanceof DatabaseExcelExportError) throw error;
    const result = await responseErrorMessage(error, documentLabel);
    throw new DatabaseExcelExportError(result.message, result.status);
  }
}
