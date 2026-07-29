import { axiosClient } from "@/lib/http/axiosClient";
import {
  mapApprovalRequestDetail,
  mapApprovalRequestList,
} from "../adapters/approvalRequestAdapter";
import type { ApprovalRequestListParams } from "../types";

export async function getApprovalRequests(
  params: ApprovalRequestListParams = {},
  signal?: AbortSignal,
) {
  const response = await axiosClient.get("/approvals", {
    params,
    signal,
  });

  return mapApprovalRequestList(response.data);
}

export async function getApprovalRequestDetail(
  eesId: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get(
    `/approvals/${encodeURIComponent(eesId)}`,
    { signal },
  );
  const detail = mapApprovalRequestDetail(response.data);

  if (!detail) {
    throw new Error("Format detail approval dari backend tidak valid.");
  }

  return detail;
}
