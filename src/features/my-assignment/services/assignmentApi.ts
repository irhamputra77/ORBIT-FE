import { axiosClient } from "@/lib/http/axiosClient";
import { mapEesAssignmentList } from "../adapters/assignmentAdapter";

export async function getEesAssignments(
  page = 1,
  limit = 20,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get("/ees", {
    params: { page, limit },
    signal,
  });
  return mapEesAssignmentList(response.data);
}
