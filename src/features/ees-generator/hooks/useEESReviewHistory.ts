"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import {
  getEESReviewHistory,
  type EESHistoryPagination,
} from "../services/ees-review-service";
import type { EESReviewRecord } from "../types/review";

type UseEESReviewHistoryOptions = {
  enabled?: boolean;
};

export function useEESReviewHistory({
  enabled = true,
}: UseEESReviewHistoryOptions = {}) {
  const initialPagination: EESHistoryPagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };
  const [records, setRecords] = useState<EESReviewRecord[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getEESReviewHistory(page, 20, controller.signal);
        setRecords(result.records);
        setPagination(result.pagination);
      } catch (caughtError) {
        if (!axios.isCancel(caughtError)) {
          const payload = axios.isAxiosError(caughtError)
            ? caughtError.response?.data as { message?: unknown } | undefined
            : undefined;
          setError(
            typeof payload?.message === "string"
              ? payload.message
              : "Riwayat EES tidak dapat dimuat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [enabled, page, requestVersion]);

  const retry = useCallback(() => setRequestVersion((version) => version + 1), []);

  return {
    records,
    pagination,
    setPage,
    isLoading: enabled && isLoading,
    error,
    retry,
  };
}
