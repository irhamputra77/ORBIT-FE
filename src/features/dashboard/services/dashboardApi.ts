import { axiosClient } from "@/lib/http/axiosClient";
import type {
  EngineeringReviewSummary,
  EngineeringReviewSummaryParams,
  EngineeringReviewSummaryResponse,
} from "../types";

export async function getEngineeringReviewSummary(
  params: EngineeringReviewSummaryParams = {},
  signal?: AbortSignal,
): Promise<EngineeringReviewSummary> {
  const response = await axiosClient.get<EngineeringReviewSummaryResponse>(
    "/dashboard/engineering-review/summary",
    {
      params,
      signal,
    },
  );

  return response.data.data;
}
