import { axiosClient } from "@/lib/http/axiosClient";
import {
  directUploadClient,
  directUploadError,
} from "@/lib/http/directUploadClient";
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
