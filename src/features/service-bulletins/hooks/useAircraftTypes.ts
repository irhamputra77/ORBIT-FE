"use client";

import { useCallback, useEffect, useState } from "react";
import { getAircraftTypes } from "../services/serviceBulletinApi";

export function useAircraftTypes(enabled = true) {
  const [aircraftTypes, setAircraftTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  const retry = useCallback(() => setRequestKey((key) => key + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAircraftTypes() {
      await Promise.resolve();
      if (controller.signal.aborted) return;

      if (!enabled) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        setAircraftTypes(await getAircraftTypes(controller.signal));
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;
        setAircraftTypes([]);
        setError(cause instanceof Error ? cause.message : "Daftar aircraft tidak dapat dimuat.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadAircraftTypes();

    return () => controller.abort();
  }, [enabled, requestKey]);

  return { aircraftTypes, isLoading, error, retry };
}
