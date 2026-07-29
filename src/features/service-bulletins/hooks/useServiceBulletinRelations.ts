"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { getServiceBulletinRelations } from "../services/serviceBulletinApi";
import type { ServiceBulletinRelations } from "../types";

export function useServiceBulletinRelations(serviceBulletinId?: string) {
  const [data, setData] = useState<ServiceBulletinRelations | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(serviceBulletinId));
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!serviceBulletinId) return;

    const controller = new AbortController();
    const id = serviceBulletinId;

    async function load() {
      await Promise.resolve();
      if (controller.signal.aborted) return;

      setIsLoading(true);
      setError(null);

      try {
        setData(await getServiceBulletinRelations(id, controller.signal));
      } catch (caughtError: unknown) {
        if (!axios.isCancel(caughtError)) {
          setData(null);
          setError(
            axios.isAxiosError<{ message?: string }>(caughtError)
              ? caughtError.response?.data.message
                ?? "Data relasi Service Bulletin tidak dapat dimuat."
              : "Data relasi Service Bulletin tidak dapat dimuat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [requestVersion, serviceBulletinId]);

  const retry = useCallback(
    () => setRequestVersion((version) => version + 1),
    [],
  );

  return {
    data: serviceBulletinId ? data : null,
    isLoading: serviceBulletinId ? isLoading : false,
    error: serviceBulletinId ? error : null,
    retry,
  };
}
