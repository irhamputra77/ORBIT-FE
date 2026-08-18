import { axiosClient } from "@/lib/http/axiosClient";
import axios from "axios";
import {
  directUploadClient,
  directUploadError,
} from "@/lib/http/directUploadClient";
import {
  mapServiceBulletin,
  mapServiceBulletinList,
  mapServiceBulletinRelations,
  normalizeAiSummary,
} from "../adapters/serviceBulletinAdapter";
import type {
  ServiceBulletinAiSummary,
  ServiceBulletinApplicability,
  EesApprovalState,
  ServiceBulletinEesDocument,
  ServiceBulletinReviewAction,
  ServiceBulletinEesResult,
  EesValidatedPayload,
  GenerateServiceBulletinEesPayload,
  ServiceBulletinListParams,
  CreateServiceBulletinRelationInput,
  AircraftRecord,
  UploadServiceBulletinResponseData,
  UploadServiceBulletinResult,
} from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapApprovalHistoryItem(value: unknown): ServiceBulletinReviewAction | null {
  if (!isRecord(value)) return null;
  const actor = isRecord(value.actor)
    ? value.actor
    : isRecord(value.reviewedBy)
      ? value.reviewedBy
      : {};

  return {
    id: String(value.id ?? ""),
    action: String(value.action ?? value.status ?? ""),
    actorName: nullableString(
      actor.username
      ?? actor.email
      ?? value.actorName
      ?? value.reviewerName,
    ),
    actorRole: nullableString(
      value.actorRole
      ?? actor.role
      ?? value.reviewerRole,
    ),
    comment: nullableString(value.comment ?? value.remarks),
    createdAt: nullableString(
      value.createdAt
      ?? value.reviewedAt
      ?? value.updatedAt,
    ),
  };
}

export const MAX_SERVICE_BULLETIN_PDF_SIZE = 100 * 1024 * 1024;

export async function validateServiceBulletinPdf(file: File) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("File harus menggunakan ekstensi .pdf.");
  }
  if (file.type && file.type !== "application/pdf") {
    throw new Error("Tipe file harus application/pdf.");
  }
  if (file.size === 0) {
    throw new Error("File PDF kosong.");
  }
  if (file.size > MAX_SERVICE_BULLETIN_PDF_SIZE) {
    throw new Error("Ukuran file PDF maksimal 100 MB.");
  }

  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (String.fromCharCode(...signature) !== "%PDF") {
    throw new Error("Isi file tidak memiliki signature PDF yang valid.");
  }
}

export async function uploadServiceBulletin(
  file: File,
  aircraftType?: string,
  signal?: AbortSignal,
  onProgress?: (percentage: number) => void,
): Promise<UploadServiceBulletinResult> {
  try {
    const response = await directUploadClient.post<{
      message?: string;
      data: UploadServiceBulletinResponseData;
    }>("/api/service-bulletins/upload-new", file, {
      signal,
      // Upload waits for the backend AI extraction in the same request.
      timeout: 0,
      headers: {
        "Content-Type": "application/pdf",
        "X-File-Name": file.name,
        "X-Requested-With": "XMLHttpRequest",
        ...(aircraftType && aircraftType !== "Unassigned"
          ? { "X-Aircraft-Type": aircraftType }
          : {}),
      },
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    });

    const data = response.data.data;
    return {
      message: response.data.message || "Service Bulletin berhasil diunggah.",
      data,
      serviceBulletin: mapServiceBulletin(data),
      aiCompleted: Boolean(data.ai),
      warning: data.warning || null,
    };
  } catch (error) {
    throw directUploadError(error, "Service Bulletin gagal diunggah.");
  }
}

export async function getAircraftTypes(signal?: AbortSignal) {
  const response = await axiosClient.get<{ data: AircraftRecord[] }>("/aircraft", {
    signal,
  });
  const aircraft = Array.isArray(response.data.data) ? response.data.data : [];

  return [...new Set(
    aircraft
      .filter((aircraft) => aircraft.active !== false)
      .map((aircraft) => aircraft.aircraftType.trim())
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right));
}

export async function getServiceBulletins(
  params: ServiceBulletinListParams,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get("/service-bulletins", { params, signal });
  return mapServiceBulletinList(response.data);
}

export async function getPendingServiceBulletins(
  params: ServiceBulletinListParams,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get("/service-bulletins/pending", {
    params,
    signal,
  });
  return mapServiceBulletinList(response.data);
}

export async function getAllServiceBulletins(
  params: ServiceBulletinListParams,
  signal?: AbortSignal,
) {
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 100);
  const firstPage = Math.max(params.page ?? 1, 1);
  const firstResult = await getServiceBulletins(
    { ...params, page: firstPage, limit },
    signal,
  );
  const items = [...firstResult.items];
  let page = firstPage;

  while (items.length < firstResult.total && page - firstPage < 999) {
    page += 1;
    const nextResult = await getServiceBulletins(
      { ...params, page, limit },
      signal,
    );
    if (!nextResult.items.length) break;
    items.push(...nextResult.items);
  }

  return {
    ...firstResult,
    items,
    page: firstPage,
    limit: items.length,
  };
}

export async function getAllPendingServiceBulletins(
  params: ServiceBulletinListParams,
  signal?: AbortSignal,
) {
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 100);
  const firstPage = Math.max(params.page ?? 1, 1);
  const firstResult = await getPendingServiceBulletins(
    { ...params, page: firstPage, limit },
    signal,
  );
  const items = [...firstResult.items];
  let page = firstPage;

  while (items.length < firstResult.total && page - firstPage < 999) {
    page += 1;
    const nextResult = await getPendingServiceBulletins(
      { ...params, page, limit },
      signal,
    );
    if (!nextResult.items.length) break;
    items.push(...nextResult.items);
  }

  return {
    ...firstResult,
    items,
    page: firstPage,
    limit: items.length,
  };
}

export async function getServiceBulletin(id: string, signal?: AbortSignal) {
  const response = await axiosClient.get(`/service-bulletins/${encodeURIComponent(id)}`, { signal });
  const payload = response.data as { data?: unknown };
  return mapServiceBulletin(payload.data);
}

export async function getServiceBulletinRelations(
  id: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get(
    `/service-bulletins/${encodeURIComponent(id)}/relations`,
    { signal },
  );
  return mapServiceBulletinRelations(response.data);
}

export async function createServiceBulletinRelation(
  id: string,
  input: CreateServiceBulletinRelationInput,
) {
  const response = await axiosClient.post(
    `/service-bulletins/${encodeURIComponent(id)}/relations`,
    {
      targetSbNumber: input.targetSbNumber.trim(),
      relationType: input.relationType,
      conditionType: input.conditionType,
      ...(input.remarks?.trim() ? { remarks: input.remarks.trim() } : {}),
    },
  );
  return response.data;
}

export async function getServiceBulletinAiSummary(id: string, signal?: AbortSignal) {
  const response = await axiosClient.get<{ data: ServiceBulletinAiSummary }>(
    `/service-bulletins/${encodeURIComponent(id)}/ai-summary`,
    { signal },
  );
  return {
    ...response.data.data,
    aiSummary: normalizeAiSummary(response.data.data.aiSummary),
  };
}

export async function getServiceBulletinApplicability(id: string, signal?: AbortSignal) {
  const response = await axiosClient.get<{ data: ServiceBulletinApplicability }>(
    `/service-bulletins/${encodeURIComponent(id)}/applicability`,
    { signal },
  );
  return response.data.data;
}

export async function getServiceBulletinEes(
  id: string,
  signal?: AbortSignal,
): Promise<ServiceBulletinEesResult> {
  try {
    const response = await axiosClient.get<{ data: ServiceBulletinEesDocument }>(
      `/service-bulletins/${encodeURIComponent(id)}/ees`,
      { signal },
    );
    return { status: "available", data: response.data.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { status: "not-found", data: null };
    }
    throw error;
  }
}

export async function getEesApprovalState(
  eesId: string,
  signal?: AbortSignal,
): Promise<EesApprovalState> {
  const response = await axiosClient.get(
    `/approvals/${encodeURIComponent(eesId)}`,
    { signal },
  );
  const payload = isRecord(response.data) ? response.data : {};
  const data = isRecord(payload.data) ? payload.data : payload;
  const approval = isRecord(data.approval) ? data.approval : data;
  const assignedTo = isRecord(approval.assignedTo)
    ? approval.assignedTo
    : isRecord(approval.currentAssignee)
      ? approval.currentAssignee
      : {};
  const rawHistory = Array.isArray(data.history)
    ? data.history
    : Array.isArray(data.actions)
      ? data.actions
      : [];

  return {
    status: nullableString(approval.status ?? approval.reviewStatus),
    currentStage: nullableString(
      approval.currentStage
      ?? approval.stage
      ?? approval.approvalStage,
    ),
    assignedRole: nullableString(
      approval.assignedRole
      ?? assignedTo.role
      ?? approval.currentReviewerRole,
    ),
    history: rawHistory
      .map(mapApprovalHistoryItem)
      .filter((item): item is ServiceBulletinReviewAction => item !== null),
  };
}

export async function generateServiceBulletinEes(
  id: string,
  payload: GenerateServiceBulletinEesPayload = {},
) {
  const response = await axiosClient.post(
    `/service-bulletins/${encodeURIComponent(id)}/generate-ees`,
    payload,
  );
  return response.data;
}

export async function updateServiceBulletinEes(
  id: string,
  validatedPayload: EesValidatedPayload,
) {
  const response = await axiosClient.patch(
    `/service-bulletins/${encodeURIComponent(id)}/ees`,
    { validatedPayload },
  );
  return response.data;
}

export function getServiceBulletinPdfUrl(id: string, mode: "view" | "download") {
  return `/api/service-bulletins/${encodeURIComponent(id)}/${mode}`;
}

export function getEesPdfUrl(
  id: string,
  operator: "garuda" | "citilink",
  mode: "view" | "download",
) {
  const suffix = mode === "download" ? "/download" : "";
  return `/api/service-bulletins/${encodeURIComponent(id)}/export/${operator}/pdf${suffix}`;
}

export function getEesExcelUrl(id: string) {
  return `/api/service-bulletins/${encodeURIComponent(id)}/export/excel`;
}
