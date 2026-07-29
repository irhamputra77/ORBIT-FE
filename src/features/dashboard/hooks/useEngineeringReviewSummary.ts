"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { getEngineeringReviewSummary } from "../services/dashboardApi";
import type {
  EngineeringReviewSummary,
  EngineeringReviewSummaryParams,
} from "../types";

export function useEngineeringReviewSummary(
  params: EngineeringReviewSummaryParams = {},
  enabled = true,
) {
  const [data, setData] = useState<EngineeringReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const serializedParams = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    const requestParams = JSON.parse(
      serializedParams,
    ) as EngineeringReviewSummaryParams;

    async function loadSummary() {
      await Promise.resolve();
      if (controller.signal.aborted) return;

      setIsLoading(true);
      setError(null);

      try {
        setData(
          await getEngineeringReviewSummary(requestParams, controller.signal),
        );
      } catch (caughtError: unknown) {
        if (!axios.isCancel(caughtError)) {
          setError(
            axios.isAxiosError<{ message?: string }>(caughtError)
              ? caughtError.response?.data.message
                ?? "Dashboard engineering review tidak dapat dimuat."
              : "Dashboard engineering review tidak dapat dimuat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadSummary();

    return () => controller.abort();
  }, [enabled, requestVersion, serializedParams]);

  return {
    data,
    isLoading: enabled ? isLoading : false,
    error: enabled ? error : null,
    retry: () => setRequestVersion((version) => version + 1),
  };
}
