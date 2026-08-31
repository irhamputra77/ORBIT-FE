import { axiosClient } from "@/lib/http/axiosClient";
import { getEesWorkflowProgress } from "@/features/ees-generator/services/workflow-progress";
import { mapEesAssignmentList } from "../adapters/assignmentAdapter";
import type { EesAssignment, EesAssignmentListResult } from "../types";

const API_PAGE_LIMIT = 100;
const PAGE_FETCH_CONCURRENCY = 4;

async function getAssignmentPage(page: number, signal?: AbortSignal) {
  const response = await axiosClient.get("/ees", {
    params: { page, limit: API_PAGE_LIMIT },
    signal,
  });
  return mapEesAssignmentList(response.data);
}

function hasReachedDoneStep(item: EesAssignment) {
  const localProgress = getEesWorkflowProgress(item.id);
  return localProgress
    ? localProgress.step >= 5
    : item.isWorkflowComplete;
}

export async function getEesAssignments(
  page = 1,
  limit = 20,
  signal?: AbortSignal,
): Promise<EesAssignmentListResult> {
  const firstPage = await getAssignmentPage(1, signal);
  const allItems = [...firstPage.items];

  for (
    let startPage = 2;
    startPage <= firstPage.pagination.totalPages;
    startPage += PAGE_FETCH_CONCURRENCY
  ) {
    const pageNumbers = Array.from(
      {
        length: Math.min(
          PAGE_FETCH_CONCURRENCY,
          firstPage.pagination.totalPages - startPage + 1,
        ),
      },
      (_, index) => startPage + index,
    );
    const results = await Promise.all(
      pageNumbers.map((pageNumber) => getAssignmentPage(pageNumber, signal)),
    );
    results.forEach((result) => allItems.push(...result.items));
  }

  const visibleItems = allItems.filter(hasReachedDoneStep);
  const total = visibleItems.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const normalizedPage = Math.min(Math.max(1, page), totalPages);
  const offset = (normalizedPage - 1) * limit;

  return {
    items: visibleItems.slice(offset, offset + limit),
    pagination: {
      page: normalizedPage,
      limit,
      total,
      totalPages,
    },
  };
}
