"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { getDummyShopVisitReport } from "../data/shopVisitReportDummyData";
import { getShopVisitReport } from "../services/shopVisitReportApi";
import type { ShopVisitReport } from "../types";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    return error.response?.data.message
      ?? error.response?.data.error
      ?? "Detail SVR tidak dapat dimuat.";
  }
  return error instanceof Error
    ? error.message
    : "Detail SVR tidak dapat dimuat.";
}

export function useShopVisitReportDetail(id: string, useDummyData = false) {
  const [report, setReport] = useState<ShopVisitReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (useDummyData) return;

    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const detail = await getShopVisitReport(id, controller.signal);
        if (!controller.signal.aborted) setReport(detail);
      } catch (requestError) {
        if (axios.isCancel(requestError) || controller.signal.aborted) return;
        setReport(null);
        setError(getErrorMessage(requestError));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [id, requestVersion, useDummyData]);

  const dummyReport = useDummyData ? getDummyShopVisitReport(id) : null;

  return useDummyData ? {
    report: dummyReport,
    isLoading: false,
    error: dummyReport ? null : "Detail dummy SVR tidak ditemukan.",
    retry: () => setRequestVersion(version => version + 1),
  } : {
    report,
    isLoading,
    error,
    retry: () => setRequestVersion(version => version + 1),
  };
}
