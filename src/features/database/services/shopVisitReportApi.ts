import axios from "axios";
import { axiosClient } from "@/lib/http/axiosClient";
import {
  directUploadClient,
  directUploadError,
} from "@/lib/http/directUploadClient";
import {
  isCreatedAfter,
  normalizeUploadFilename,
  waitForUploadRecord,
} from "@/lib/http/uploadReconciliation";
import {
  mapShopVisitReport,
  mapShopVisitReportList,
} from "../adapters/shopVisitReportAdapter";
import type {
  ShopVisitReport,
  ShopVisitReportDetailResponse,
  ShopVisitReportListParams,
  ShopVisitReportListResponse,
  UploadShopVisitReportResult,
} from "../types";

export const MAX_SVR_PDF_SIZE = 100 * 1024 * 1024;
export const MAX_SVR_PDF_FILES = 6;

export async function validateShopVisitReportPdf(file: File) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("File SVR harus menggunakan ekstensi .pdf.");
  }
  if (file.type && file.type !== "application/pdf") {
    throw new Error("Tipe file SVR harus application/pdf.");
  }
  if (file.size === 0) {
    throw new Error("File PDF SVR kosong.");
  }
  if (file.size > MAX_SVR_PDF_SIZE) {
    throw new Error("Ukuran file PDF SVR maksimal 100 MB.");
  }

  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (String.fromCharCode(...signature) !== "%PDF") {
    throw new Error("Isi file tidak memiliki signature PDF yang valid.");
  }
}

export async function uploadShopVisitReport(
  files: File[],
  signal?: AbortSignal,
  onProgress?: (percentage: number) => void,
): Promise<UploadShopVisitReportResult> {
  if (files.length === 0 || files.length > MAX_SVR_PDF_FILES) {
    throw new Error(`Pilih 1 sampai ${MAX_SVR_PDF_FILES} file PDF SVR.`);
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file, file.name));

  try {
    const response = await directUploadClient.post<UploadShopVisitReportResult>(
      "/api/shop-visit-reports/upload/SVR",
      formData,
      {
        // Do not set Content-Type manually. The browser must add the multipart
        // boundary for the direct cross-origin upload.
        headers: { "X-Requested-With": "XMLHttpRequest" },
        signal,
        timeout: 0,
        onUploadProgress: (event) => {
          if (!event.total) return;
          onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        },
      },
    );

    return {
      message: response.data.message || "SVR berhasil diunggah dan diproses.",
      data: response.data.data,
    };
  } catch (error) {
    throw directUploadError(error, "SVR gagal diunggah.");
  }
}

export async function reconcileShopVisitReportUpload(
  fileNames: string[],
  knownIds: Set<string>,
  startedAt: number,
  signal?: AbortSignal,
) {
  const expectedFilenames = new Set(fileNames.map(normalizeUploadFilename));

  return waitForUploadRecord<ShopVisitReport>({
    signal,
    load: async (requestSignal) => {
      const result = await getShopVisitReports(
        { page: 1, limit: 100 },
        requestSignal,
      );
      const unseen = result.data.filter(
        (report) =>
          !knownIds.has(report.id)
          && isCreatedAfter(report.createdAt, startedAt),
      );
      const exact = unseen.filter((report) => {
        const original = normalizeUploadFilename(report.originalFileName);
        const stored = normalizeUploadFilename(report.storedFileName);
        return expectedFilenames.has(original) || expectedFilenames.has(stored);
      });
      return exact.length > 0 ? exact : unseen.length === 1 ? unseen : [];
    },
    matches: () => true,
  });
}

export async function getShopVisitReports(
  params: ShopVisitReportListParams = {},
  signal?: AbortSignal,
): Promise<ShopVisitReportListResponse> {
  const response = await axiosClient.get<unknown>(
    "/shop-visit-reports",
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...(params.esn ? { esn: params.esn } : {}),
      },
      signal,
    },
  );
  return mapShopVisitReportList(response.data);
}

export async function getShopVisitReport(
  id: string,
  signal?: AbortSignal,
): Promise<ShopVisitReport> {
  const response = await axiosClient.get<unknown>(
    `/shop-visit-reports/${encodeURIComponent(id)}`,
    { signal },
  );
  const payload = response.data as ShopVisitReportDetailResponse;
  const report = mapShopVisitReport(payload?.data);
  if (!report) throw new Error("Format detail SVR dari backend tidak valid.");
  return report;
}

export function getShopVisitReportPreviewUrl(id: string) {
  return `/api/shop-visit-reports/${encodeURIComponent(id)}/view`;
}

export function getShopVisitReportDownloadUrl(id: string) {
  return `/api/shop-visit-reports/${encodeURIComponent(id)}/download`;
}

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function safeDownloadName(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

async function excelExportErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : "Data SVR gagal diekspor ke Excel.";
  }

  const fallback = error.response?.status
    ? `Export gagal (HTTP ${error.response.status}).`
    : "Data SVR gagal diekspor ke Excel.";
  const payload = error.response?.data;

  if (payload instanceof Blob) {
    try {
      const body = JSON.parse(await payload.text()) as {
        error?: unknown;
        message?: unknown;
        details?: unknown;
      };
      if (typeof body.details === "string") return body.details;
      if (typeof body.error === "string") return body.error;
      if (typeof body.message === "string") return body.message;
    } catch {
      // Error responses from the export endpoint are not always JSON.
    }
  }

  return fallback;
}

export async function exportShopVisitReportExcel(
  id: string,
  engineSerialNumber?: string | null,
) {
  try {
    const response = await directUploadClient.get<Blob>(
      `/api/shop-visit-reports/${encodeURIComponent(id)}/export/excel`,
      {
        responseType: "blob",
        timeout: 0,
        headers: {
          Accept: EXCEL_MIME_TYPE,
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );

    const blob = response.data;
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error("File Excel yang diterima dari backend kosong.");
    }

    const filename = safeDownloadName(
      `SVR-${engineSerialNumber?.trim() || id}.xlsx`,
    );
    const objectUrl = URL.createObjectURL(blob);
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
    throw new Error(await excelExportErrorMessage(error));
  }
}
