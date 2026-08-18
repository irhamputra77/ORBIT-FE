import { axiosClient } from "@/lib/http/axiosClient";
import {
  directUploadClient,
  directUploadError,
} from "@/lib/http/directUploadClient";
import type {
  EdsDetail,
  EdsListItem,
  EdsListResult,
  UploadEdsResult,
} from "../edsTypes";

export const MAX_EDS_PDF_SIZE = 100 * 1024 * 1024;

const EMPTY_SUMMARY = {
  configurationItems: 0,
  llpItems: 0,
  serviceBulletins: 0,
  airworthinessDirectives: 0,
  accessories: 0,
  complianceRecords: 0,
};

function listItem(value: EdsListItem): EdsListItem {
  return {
    ...value,
    hasPdf: Boolean(value.hasPdf ?? value.storedFileName),
    summary: { ...EMPTY_SUMMARY, ...(value.summary || {}) },
  };
}

function detailItem(value: EdsDetail): EdsDetail {
  const normalized = listItem(value);
  return {
    ...value,
    ...normalized,
    configurationReport: Array.isArray(value.configurationReport)
      ? value.configurationReport
      : [],
    llpStatus: Array.isArray(value.llpStatus) ? value.llpStatus : [],
    sbStatus: Array.isArray(value.sbStatus) ? value.sbStatus : [],
    adStatus: Array.isArray(value.adStatus) ? value.adStatus : [],
    accessoriesList: Array.isArray(value.accessoriesList)
      ? value.accessoriesList
      : [],
    complianceRecords: Array.isArray(value.complianceRecords)
      ? value.complianceRecords
      : [],
  };
}

export async function getEdsList(
  params: { page?: number; limit?: number; esn?: string } = {},
  signal?: AbortSignal,
): Promise<EdsListResult> {
  const response = await axiosClient.get<EdsListResult>("/eds", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...(params.esn ? { esn: params.esn } : {}),
    },
    signal,
  });
  return {
    data: Array.isArray(response.data.data)
      ? response.data.data.map(listItem)
      : [],
    pagination: response.data.pagination || {
      page: 1,
      limit: params.limit ?? 20,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function getEdsDetail(id: string, signal?: AbortSignal) {
  const response = await axiosClient.get<{ data: EdsDetail }>(
    `/eds/${encodeURIComponent(id)}`,
    { signal },
  );
  return detailItem(response.data.data);
}

export function getEdsPreviewUrl(id: string) {
  return `/api/eds/${encodeURIComponent(id)}/view`;
}

export function getEdsDownloadUrl(id: string) {
  return `/api/eds/${encodeURIComponent(id)}/download`;
}

export async function validateEdsPdf(file: File) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("File EDS harus menggunakan ekstensi .pdf.");
  }
  if (file.type && file.type !== "application/pdf") {
    throw new Error("Tipe file EDS harus application/pdf.");
  }
  if (file.size === 0) {
    throw new Error("File PDF EDS kosong.");
  }
  if (file.size > MAX_EDS_PDF_SIZE) {
    throw new Error("Ukuran file PDF EDS maksimal 100 MB.");
  }

  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (String.fromCharCode(...signature) !== "%PDF") {
    throw new Error("Isi file tidak memiliki signature PDF yang valid.");
  }
}

export async function uploadEdsPdf(
  file: File,
  signal?: AbortSignal,
  onProgress?: (percentage: number) => void,
): Promise<UploadEdsResult> {
  try {
    const response = await directUploadClient.post<UploadEdsResult>(
      "/api/eds/upload",
      file,
      {
        signal,
        timeout: 0,
        headers: {
          "Content-Type": "application/pdf",
          "X-File-Name": file.name,
          "X-Requested-With": "XMLHttpRequest",
        },
        onUploadProgress: (event) => {
          if (!event.total) return;
          onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        },
      },
    );
    return {
      message: response.data.message || "PDF EDS berhasil diunggah dan diproses.",
      data: response.data.data,
    };
  } catch (error) {
    throw directUploadError(error, "PDF EDS gagal diunggah.");
  }
}
