import { axiosClient } from "@/lib/http/axiosClient";

export type SubmitEesApprovalInput = {
  eesId: string;
  assignedToId?: number;
  signature?: File;
};

export async function submitEesForApproval({
  eesId,
  assignedToId,
  signature,
}: SubmitEesApprovalInput) {
  const formData = new FormData();

  if (assignedToId !== undefined) {
    formData.append("assignedToId", String(assignedToId));
  }
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
