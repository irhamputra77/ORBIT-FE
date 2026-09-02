import { axiosClient } from "@/lib/http/axiosClient";
import {
  mapApprovalRequestDetail,
  mapApprovalRequestList,
} from "../adapters/approvalRequestAdapter";
import type { ApprovalRequestListParams } from "../types";
import type {
  ApprovalRequestListResult,
  ApprovalReviewItem,
} from "../types";

export type ApprovalRequestCollection = "inbox" | "history" | "combined";

type BackendApprovalRequestCollection = Exclude<
  ApprovalRequestCollection,
  "combined"
>;

async function getApprovalCollectionPage(
  collection: BackendApprovalRequestCollection,
  params: ApprovalRequestListParams,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get(`/approvals/${collection}`, {
    params,
    signal,
  });

  return mapApprovalRequestList(response.data);
}

async function getAllApprovalCollectionItems(
  collection: BackendApprovalRequestCollection,
  status: ApprovalRequestListParams["status"],
  signal?: AbortSignal,
) {
  const firstPage = await getApprovalCollectionPage(
    collection,
    {
      page: 1,
      limit: 100,
      ...(status ? { status } : {}),
    },
    signal,
  );

  if (firstPage.pagination.totalPages <= 1) {
    return filterItemsByStatus(firstPage.items, status);
  }

  const remainingPages = await Promise.all(
    Array.from(
      { length: firstPage.pagination.totalPages - 1 },
      (_, index) => index + 2,
    ).map((page) => getApprovalCollectionPage(
      collection,
      {
        page,
        limit: 100,
        ...(status ? { status } : {}),
      },
      signal,
    )),
  );

  return filterItemsByStatus([
    ...firstPage.items,
    ...remainingPages.flatMap((result) => result.items),
  ], status);
}

function filterItemsByStatus(
  items: ApprovalReviewItem[],
  status: ApprovalRequestListParams["status"],
) {
  if (!status) return items;
  return items.filter((item) => item.reviewStatus === status);
}

function submittedAtTimestamp(item: ApprovalReviewItem) {
  const timestamp = Date.parse(item.reviewedAt || item.submittedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isTerminalStatus(status: string) {
  return status === "APPROVED"
    || status === "REJECTED"
    || status === "RETURNED";
}

function keepLatestApprovalState(
  items: Map<string, ApprovalReviewItem>,
  candidate: ApprovalReviewItem,
) {
  const current = items.get(candidate.eesId);
  if (!current) {
    items.set(candidate.eesId, candidate);
    return;
  }

  const currentTimestamp = submittedAtTimestamp(current);
  const candidateTimestamp = submittedAtTimestamp(candidate);
  const candidateIsNewer = candidateTimestamp > currentTimestamp;
  const sameTimestampWithTerminalCandidate = candidateTimestamp === currentTimestamp
    && isTerminalStatus(candidate.reviewStatus)
    && !isTerminalStatus(current.reviewStatus);

  if (candidateIsNewer || sameTimestampWithTerminalCandidate) {
    items.set(candidate.eesId, candidate);
  }
}

async function getCombinedApprovalRequests(
  params: ApprovalRequestListParams,
  signal?: AbortSignal,
): Promise<ApprovalRequestListResult> {
  const requestedPage = params.page && params.page > 0 ? params.page : 1;
  const requestedLimit = params.limit && params.limit > 0 ? params.limit : 20;
  const collections: BackendApprovalRequestCollection[] =
    params.status === "PENDING" || params.status === "PARTIALLY_APPROVED"
      ? ["inbox"]
      : params.status === "APPROVED"
        || params.status === "REJECTED"
        || params.status === "RETURNED"
        ? ["history"]
        : ["inbox", "history"];
  const collectionItems = await Promise.all(
    collections.map((collection) => getAllApprovalCollectionItems(
      collection,
      params.status,
      signal,
    )),
  );

  // One EES can have an old terminal history record and a newer resubmitted
  // inbox record (or vice versa immediately after review). Keep the state with
  // the newest event timestamp instead of always preferring one endpoint.
  const uniqueItems = new Map<string, ApprovalReviewItem>();
  const historyItems = collections.includes("history")
    ? collectionItems[collections.indexOf("history")]
    : [];
  const inboxItems = collections.includes("inbox")
    ? collectionItems[collections.indexOf("inbox")]
    : [];

  historyItems.forEach((item) => keepLatestApprovalState(uniqueItems, item));
  inboxItems.forEach((item) => keepLatestApprovalState(uniqueItems, item));

  const items = [...uniqueItems.values()].sort(
    (left, right) => submittedAtTimestamp(right) - submittedAtTimestamp(left),
  );
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / requestedLimit));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * requestedLimit;

  return {
    items: items.slice(start, start + requestedLimit),
    pagination: {
      page,
      limit: requestedLimit,
      total,
      totalPages,
    },
  };
}

export async function getApprovalRequests(
  params: ApprovalRequestListParams = {},
  signal?: AbortSignal,
  collection: ApprovalRequestCollection = "inbox",
) {
  if (collection === "combined") {
    return getCombinedApprovalRequests(params, signal);
  }

  return getApprovalCollectionPage(collection, params, signal);
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
