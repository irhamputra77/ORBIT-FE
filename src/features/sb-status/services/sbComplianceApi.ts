import axios from "axios";
import { axiosClient } from "@/lib/http/axiosClient";
import type {
  SbComplianceDetailResponse,
  SbComplianceListParams,
  SbComplianceListResponse,
} from "../types";

export async function getSbComplianceStatus(
  params: SbComplianceListParams,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<SbComplianceListResponse>(
    "/service-bulletins/compliance-status",
    { params, signal, timeout: 65_000 },
  );
  return response.data;
}

export async function getSbComplianceDetail(
  sbId: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<SbComplianceDetailResponse>(
    `/service-bulletins/${encodeURIComponent(sbId)}/compliance-status`,
    { signal, timeout: 65_000 },
  );
  return response.data.data;
}

export function complianceApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const payload = error.response?.data as
    | { message?: unknown; error?: unknown; details?: unknown }
    | undefined;
  if (typeof payload?.details === "string") return payload.details;
  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload?.message === "string") return payload.message;
  return error.message || fallback;
}
