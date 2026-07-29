import { axiosClient } from "@/lib/http/axiosClient";
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
  file: File,
  signal?: AbortSignal,
  onProgress?: (percentage: number) => void,
): Promise<UploadShopVisitReportResult> {
  const response = await axiosClient.post<UploadShopVisitReportResult>(
    "/shop-visit-reports/upload/SVR",
    file,
    {
      signal,
      timeout: 0,
      headers: {
        "Content-Type": "application/pdf",
        "X-File-Name": file.name,
      },
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
