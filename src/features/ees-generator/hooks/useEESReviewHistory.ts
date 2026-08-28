"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import {
  getEESReviewHistory,
  type EESHistoryPagination,
} from "../services/ees-review-service";
import type { EESReviewRecord } from "../types/review";
import {
  EES_WORKFLOW_STEP_LABELS,
  getEesWorkflowProgress,
} from "../services/workflow-progress";

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
        setRecords(result.records.map(record => {
          const progress = getEesWorkflowProgress(record.id);
          const shouldShowLocalProgress = progress
            && progress.step < 5
            && !record.hasApprovalAssignment
            && !["Approved", "Rejected", "Returned"].includes(record.status);

          if (!shouldShowLocalProgress) return record;
          return {
            ...record,
            workflowStep: progress.step,
            workflowStepLabel: EES_WORKFLOW_STEP_LABELS[progress.step],
          };
        }));
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
