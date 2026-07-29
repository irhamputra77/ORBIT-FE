"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { getApprovalRequestDetail } from "../services/approvalRequestApi";
import type { ApprovalRequestDetail } from "../types";

export function useApprovalDetail(
  eesId: string | undefined,
  enabled = true,
) {
  const [data, setData] = useState<ApprovalRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled && eesId));
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!enabled || !eesId) return;

    const controller = new AbortController();
    const requestedEesId = eesId;

    async function load() {
      await Promise.resolve();
      if (controller.signal.aborted) return;

      setData(null);
      setIsLoading(true);
      setError(null);

      try {
        setData(
          await getApprovalRequestDetail(requestedEesId, controller.signal),
        );
      } catch (caughtError: unknown) {
        if (!axios.isCancel(caughtError)) {
          setError(
            axios.isAxiosError<{ message?: string }>(caughtError)
              ? caughtError.response?.data.message
                ?? "Detail dan riwayat approval tidak dapat dimuat."
              : caughtError instanceof Error
                ? caughtError.message
                : "Detail dan riwayat approval tidak dapat dimuat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [eesId, enabled, requestVersion]);

  const matchesRequestedEes = data?.approval.eesId === eesId;

  return {
    data: enabled && matchesRequestedEes ? data : null,
    isLoading: enabled && Boolean(eesId) ? isLoading : false,
    error: enabled && Boolean(eesId) ? error : null,
    retry: () => setRequestVersion((version) => version + 1),
  };
}
