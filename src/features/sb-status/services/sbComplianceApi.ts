import axios from "axios";
import { axiosClient } from "@/lib/http/axiosClient";
import type {
  SbComplianceDetailResponse,
  SbComplianceListParams,
  SbComplianceListResponse,
  SbComplianceSummary,
} from "../types";

function metricValue(...values: unknown[]) {
  for (const value of values) {
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
}

function countStatuses(
  items: SbComplianceListResponse["data"],
): Omit<SbComplianceSummary, "total"> {
  const counts = {
    open: 0,
    partiallyComplied: 0,
    complied: 0,
    overdue: 0,
    notApplicable: 0,
    unknown: 0,
  };

  for (const item of items) {
    switch (item.complianceStatus) {
      case "OPEN":
        counts.open += 1;
        break;
      case "PARTIALLY_COMPLIED":
        counts.partiallyComplied += 1;
        break;
      case "COMPLIED":
        counts.complied += 1;
        break;
      case "OVERDUE":
        counts.overdue += 1;
        break;
      case "NOT_APPLICABLE":
        counts.notApplicable += 1;
        break;
      default:
        counts.unknown += 1;
    }
  }

  return counts;
}

export async function getSbComplianceStatus(
  params: SbComplianceListParams,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<SbComplianceListResponse>(
    "/service-bulletins/compliance-status",
    { params, signal, timeout: 65_000 },
  );

  const payload = response.data;
  const items = Array.isArray(payload.data) ? payload.data : [];
  const statusFallback = countStatuses(items);
  // The current backend separates the global total (`summary`) from the
  // status breakdown for the active page (`pageSummary`). Older deployments
  // returned every metric in `summary`, so support both response shapes.
  const statusSummary = payload.pageSummary ?? payload.summary ?? {};
  const globalSummary = payload.summary ?? {};
  const normalizedSummary: SbComplianceSummary = {
    total: metricValue(
      globalSummary.total,
      payload.pagination?.total,
      statusSummary.total,
      items.length,
    ),
    open: metricValue(statusSummary.open, statusFallback.open),
    partiallyComplied: metricValue(
      statusSummary.partiallyComplied,
      statusFallback.partiallyComplied,
    ),
    complied: metricValue(statusSummary.complied, statusFallback.complied),
    overdue: metricValue(statusSummary.overdue, statusFallback.overdue),
    notApplicable: metricValue(
      statusSummary.notApplicable,
      statusFallback.notApplicable,
    ),
    unknown: metricValue(statusSummary.unknown, statusFallback.unknown),
  };

  return {
    ...payload,
    data: items,
    summary: normalizedSummary,
  };
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
