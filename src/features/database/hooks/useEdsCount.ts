"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { getEdsList } from "../services/edsApi";

export function useEdsCount(enabled = true) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    async function load() {
      try {
        const result = await getEdsList(
          { page: 1, limit: 1 },
          controller.signal,
        );
        if (!controller.signal.aborted) setCount(result.pagination.total);
      } catch (error) {
        if (!axios.isCancel(error) && !controller.signal.aborted) setCount(null);
      }
    }
    void load();
    return () => controller.abort();
  }, [enabled]);

  return enabled ? count : null;
}
