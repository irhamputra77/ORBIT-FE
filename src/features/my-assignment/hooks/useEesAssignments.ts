"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { getEesAssignments } from "../services/assignmentApi";
import type { EesAssignmentListResult } from "../types";

const EMPTY_RESULT: EesAssignmentListResult = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

export function useEesAssignments(page: number, limit = 20, enabled = true) {
  const [result, setResult] = useState<EesAssignmentListResult>(EMPTY_RESULT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    async function load() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setIsLoading(true);
      setError(null);

      try {
        setResult(await getEesAssignments(page, limit, controller.signal));
      } catch (caughtError) {
        if (!axios.isCancel(caughtError)) {
          setError(
            axios.isAxiosError<{ message?: string }>(caughtError)
              ? caughtError.response?.data.message || "My Assignment tidak dapat dimuat."
              : "My Assignment tidak dapat dimuat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [enabled, limit, page, requestVersion]);

  return {
    ...result,
    isLoading: enabled ? isLoading : false,
    error: enabled ? error : null,
    retry: () => setRequestVersion((version) => version + 1),
  };
}
