"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  getAllPendingServiceBulletins,
  getAllServiceBulletins,
  getPendingServiceBulletins,
  getServiceBulletins,
} from "../services/serviceBulletinApi";
import type { ServiceBulletinListParams, ServiceBulletinListResult } from "../types";

const EMPTY_RESULT: ServiceBulletinListResult = { items: [], total: 0, page: 1, limit: 10 };

export function useServiceBulletins(
  params: ServiceBulletinListParams,
  options: {
    fetchAll?: boolean;
    enabled?: boolean;
    pendingOnly?: boolean;
  } = {},
) {
  const [result, setResult] = useState<ServiceBulletinListResult>(EMPTY_RESULT);
  const [isLoading, setIsLoading] = useState(options.enabled !== false);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const serializedParams = useMemo(() => JSON.stringify(params), [params]);
  const fetchAll = options.fetchAll === true;
  const enabled = options.enabled !== false;
  const pendingOnly = options.pendingOnly === true;

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    const requestParams = JSON.parse(serializedParams) as ServiceBulletinListParams;

    async function loadServiceBulletins() {
      await Promise.resolve();
      if (controller.signal.aborted) return;

      setIsLoading(true);
      setError(null);

      try {
        const fetchServiceBulletins = pendingOnly
          ? fetchAll
            ? getAllPendingServiceBulletins
            : getPendingServiceBulletins
          : fetchAll
            ? getAllServiceBulletins
            : getServiceBulletins;

        setResult(
          await fetchServiceBulletins(
            requestParams,
            controller.signal,
          ),
        );
      } catch (caughtError: unknown) {
        if (!axios.isCancel(caughtError)) {
          setError(
            axios.isAxiosError<{ message?: string }>(caughtError)
              ? caughtError.response?.data.message ?? "Service Bulletin tidak dapat dimuat."
              : "Service Bulletin tidak dapat dimuat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadServiceBulletins();

    return () => controller.abort();
  }, [enabled, fetchAll, pendingOnly, serializedParams, requestVersion]);

  return {
    ...result,
    isLoading: enabled ? isLoading : false,
    error: enabled ? error : null,
    retry: () => setRequestVersion((version) => version + 1),
  };
}
