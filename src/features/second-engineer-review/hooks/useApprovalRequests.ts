"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  getApprovalRequests,
  type ApprovalRequestCollection,
} from "../services/approvalRequestApi";
import type {
  ApprovalRequestListParams,
  ApprovalRequestListResult,
} from "../types";

const EMPTY_RESULT: ApprovalRequestListResult = {
  items: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
};

export function useApprovalRequests(
  params: ApprovalRequestListParams,
  enabled = true,
  collection: ApprovalRequestCollection = "inbox",
) {
  const [result, setResult] = useState(EMPTY_RESULT);
  const [isLoading, setIsLoading] = useState(enabled);
  const [completedRequestKey, setCompletedRequestKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const serializedParams = useMemo(() => JSON.stringify(params), [params]);
  const requestKey = `${collection}:${serializedParams}:${requestVersion}`;

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    const requestParams = JSON.parse(
      serializedParams,
    ) as ApprovalRequestListParams;

    async function load() {
      await Promise.resolve();
      if (controller.signal.aborted) return;

      setIsLoading(true);
      setError(null);

      try {
        setResult(
          await getApprovalRequests(requestParams, controller.signal, collection),
        );
      } catch (caughtError: unknown) {
        if (!axios.isCancel(caughtError)) {
          setError(
            axios.isAxiosError<{ message?: string }>(caughtError)
              ? caughtError.response?.data.message
                ?? "Daftar approval EES tidak dapat dimuat."
              : "Daftar approval EES tidak dapat dimuat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setCompletedRequestKey(requestKey);
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [collection, enabled, requestKey, serializedParams]);

  return {
    ...result,
    isLoading: enabled
      ? isLoading || completedRequestKey !== requestKey
      : false,
    error: enabled ? error : null,
    retry: () => setRequestVersion((version) => version + 1),
  };
}
