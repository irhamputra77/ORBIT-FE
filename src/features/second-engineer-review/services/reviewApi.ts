import { axiosClient } from "@/lib/http/axiosClient";

export type ReviewEesInput = {
  eesId: string;
  action: "APPROVED";
  comment?: string;
  signature?: File;
  nextAssignedToId?: number;
};

export type RejectEesInput = {
  eesId: string;
  comment: string;
};

export async function reviewEes({
  eesId,
  action,
  comment,
  signature,
  nextAssignedToId,
}: ReviewEesInput) {
  const formData = new FormData();
  formData.append("action", action);
  if (comment?.trim()) formData.append("comment", comment.trim());
  if (signature) formData.append("signature", signature, signature.name);
  if (nextAssignedToId !== undefined) {
    formData.append("nextAssignedToId", String(nextAssignedToId));
  }

  const response = await axiosClient.post(
    `/approvals/${encodeURIComponent(eesId)}/review`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30_000,
    },
  );
  return response.data;
}

export async function rejectEes({ eesId, comment }: RejectEesInput) {
  const response = await axiosClient.post(
    `/approvals/${encodeURIComponent(eesId)}/reject`,
    { comment: comment.trim() },
  );
  return response.data;
}
