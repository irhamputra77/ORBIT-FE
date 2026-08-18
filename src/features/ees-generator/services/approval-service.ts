import { axiosClient } from "@/lib/http/axiosClient";

export type SubmitEesApprovalInput = {
  eesId: string;
  assignedToId: string;
  signature?: File;
};

export type ResubmitEesApprovalInput = SubmitEesApprovalInput;

export type ApprovalCandidate = {
  id: string;
  employeeNumber: string;
  name: string;
  username: string;
  email: string;
  role: "ENGINEER" | "MANAGER";
  operator: {
    code: string;
    name: string;
  };
  unit: string;
  active: boolean;
};

export async function getApprovalCandidates(
  operator: "GARUDA" | "CITILINK",
  role: "ENGINEER" | "MANAGER",
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<{ data?: ApprovalCandidate[] }>(
    "/users/approval-candidates",
    {
      params: { operator, role },
      signal,
    },
  );

  return Array.isArray(response.data.data) ? response.data.data : [];
}

export async function submitEesForApproval({
  eesId,
  assignedToId,
  signature,
}: SubmitEesApprovalInput) {
  const formData = new FormData();

  formData.append("assignedToId", assignedToId);
  if (signature) {
    formData.append("signature", signature, signature.name);
  }

  const response = await axiosClient.post(
    `/approvals/${encodeURIComponent(eesId)}/submit`,
    formData,
    {
      timeout: 30_000,
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return response.data;
}

export async function resubmitEesForApproval({
  eesId,
  assignedToId,
  signature,
}: ResubmitEesApprovalInput) {
  const formData = new FormData();
  formData.append("assignedToId", assignedToId);
  if (signature) formData.append("signature", signature, signature.name);

  const response = await axiosClient.post(
    `/approvals/${encodeURIComponent(eesId)}/resubmit`,
    formData,
    {
      timeout: 30_000,
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return response.data;
}
