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

type UserDirectoryResponse = {
  data?: unknown[];
  meta?: {
    totalPages?: number;
  };
};

function toApprovalCandidate(value: unknown): ApprovalCandidate | null {
  if (!value || typeof value !== "object") return null;

  const user = value as Record<string, unknown>;
  const operatorValue = user.operator;
  const operator = operatorValue && typeof operatorValue === "object"
    ? operatorValue as Record<string, unknown>
    : {};
  const id = typeof user.id === "string" ? user.id.trim() : "";
  const role = typeof user.role === "string" ? user.role.trim().toUpperCase() : "";

  if (!id || role !== "MANAGER") return null;

  const stringValue = (candidate: unknown) => (
    typeof candidate === "string" ? candidate.trim() : ""
  );
  const email = stringValue(user.email);
  const username = stringValue(user.username);
  const employeeNumber = stringValue(user.employeeNumber);

  return {
    id,
    employeeNumber: employeeNumber || "—",
    name: stringValue(user.name) || username || email || employeeNumber || id,
    username,
    email,
    role: "MANAGER",
    operator: {
      code: stringValue(operator.code),
      name: stringValue(operator.name) || "Operator not assigned",
    },
    unit: stringValue(user.unit) || "Unit not assigned",
    active: user.active !== false,
  };
}

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

export async function getAllManagerApprovalCandidates(signal?: AbortSignal) {
  const firstResponse = await axiosClient.get<UserDirectoryResponse>("/users", {
    params: { page: 1, limit: 100, role: "MANAGER" },
    signal,
  });
  const totalPages = Math.max(1, Number(firstResponse.data.meta?.totalPages) || 1);
  const remainingResponses = totalPages > 1
    ? await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => (
        axiosClient.get<UserDirectoryResponse>("/users", {
          params: { page: index + 2, limit: 100, role: "MANAGER" },
          signal,
        })
      )),
    )
    : [];
  const users = [firstResponse, ...remainingResponses]
    .flatMap(response => Array.isArray(response.data.data) ? response.data.data : [])
    .map(toApprovalCandidate)
    .filter((candidate): candidate is ApprovalCandidate => candidate !== null);

  return Array.from(
    new Map(users.map(candidate => [candidate.id, candidate])).values(),
  ).sort((left, right) => left.name.localeCompare(right.name));
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
