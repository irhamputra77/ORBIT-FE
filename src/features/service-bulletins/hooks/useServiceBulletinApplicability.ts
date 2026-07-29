"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { getServiceBulletinApplicability } from "../services/serviceBulletinApi";
import type { ServiceBulletinApplicability } from "../types";

export function useServiceBulletinApplicability(serviceBulletinId?: string) {
  const [data, setData] = useState<ServiceBulletinApplicability | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(serviceBulletinId));
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!serviceBulletinId) {
      return;
    }
    const id: string = serviceBulletinId;

    const controller = new AbortController();

    async function load() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setIsLoading(true);
      setError(null);
      try {
        setData(await getServiceBulletinApplicability(id, controller.signal));
      } catch (caughtError) {
        if (!axios.isCancel(caughtError)) {
          const message = axios.isAxiosError<{ message?: string }>(caughtError)
            ? caughtError.response?.data.message
            : undefined;
          setData(null);
          setError(message || "Data applicability tidak dapat dimuat.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [serviceBulletinId, requestVersion]);

  const retry = useCallback(() => setRequestVersion(version => version + 1), []);

  return {
    data: serviceBulletinId ? data : null,
    isLoading: serviceBulletinId ? isLoading : false,
    error: serviceBulletinId ? error : "Service Bulletin ID tidak tersedia.",
    retry,
  };
}
