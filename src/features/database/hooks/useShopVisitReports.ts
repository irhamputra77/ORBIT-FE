"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { getShopVisitReports } from "../services/shopVisitReportApi";
import type { ShopVisitReport, ShopVisitReportListResponse } from "../types";

const EMPTY_META: ShopVisitReportListResponse["meta"] = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || "Data SVR tidak dapat dimuat.";
  }
  return error instanceof Error ? error.message : "Data SVR tidak dapat dimuat.";
}

export function useShopVisitReports() {
  const abortRef = useRef<AbortController | null>(null);
  const [items, setItems] = useState<ShopVisitReport[]>([]);
  const [selected, setSelected] = useState<ShopVisitReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [meta, setMeta] = useState(EMPTY_META);

  useEffect(() => () => abortRef.current?.abort(), []);
  const select = useCallback((id: string) => {
    const report = items.find((item) => item.id === id) ?? null;
    setSelected(report);
    if (!report) setError("Data SVR yang dipilih tidak ditemukan.");
  }, [items]);

  const search = useCallback(async (esn?: string, page = 1) => {
    abortRef.current?.abort();
    setError(null);
    setHasSearched(true);
    setSelected(null);

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    try {
      const response = await getShopVisitReports(
        { page, limit: 20, esn: esn?.trim() || undefined },
        controller.signal,
      );
      setItems(response.data);
      setMeta(response.meta);
      setSelected(response.data[0] ?? null);
    } catch (requestError) {
      if (!controller.signal.aborted) {
        setItems([]);
        setMeta(EMPTY_META);
        setError(getErrorMessage(requestError));
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setItems([]);
    setSelected(null);
    setError(null);
    setHasSearched(false);
    setIsLoading(false);
    setMeta(EMPTY_META);
  }, []);

  return {
    items,
    selected,
    meta,
    isLoading,
    error,
    hasSearched,
    search,
    select,
    reset,
  };
}

export function useShopVisitReportCount(enabled = true) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    getShopVisitReports({ page: 1, limit: 1 }, controller.signal)
      .then((response) => setCount(response.meta.total))
      .catch(() => {
        if (!controller.signal.aborted) setCount(null);
      });
    return () => controller.abort();
  }, [enabled]);

  return count;
}
