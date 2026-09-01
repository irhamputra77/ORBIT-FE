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
    return firstPage.items;
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

  return [
    ...firstPage.items,
    ...remainingPages.flatMap((result) => result.items),
  ];
}

function submittedAtTimestamp(item: ApprovalReviewItem) {
  const timestamp = Date.parse(item.submittedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

async function getCombinedApprovalRequests(
  params: ApprovalRequestListParams,
  signal?: AbortSignal,
): Promise<ApprovalRequestListResult> {
  const requestedPage = params.page && params.page > 0 ? params.page : 1;
  const requestedLimit = params.limit && params.limit > 0 ? params.limit : 20;
  const collections: BackendApprovalRequestCollection[] =
    params.status === "PENDING"
      ? ["inbox"]
      : params.status === "APPROVED"
        ? ["history"]
        : ["inbox", "history"];
  const collectionItems = await Promise.all(
    collections.map((collection) => getAllApprovalCollectionItems(
      collection,
      params.status,
      signal,
    )),
  );

  // History can contain the same EES that is currently actionable in inbox.
  // The inbox record is inserted last so the current assignment wins.
  const uniqueItems = new Map<string, ApprovalReviewItem>();
  const historyItems = collections.includes("history")
    ? collectionItems[collections.indexOf("history")]
    : [];
  const inboxItems = collections.includes("inbox")
    ? collectionItems[collections.indexOf("inbox")]
    : [];

  historyItems.forEach((item) => uniqueItems.set(item.eesId, item));
  inboxItems.forEach((item) => uniqueItems.set(item.eesId, item));

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
