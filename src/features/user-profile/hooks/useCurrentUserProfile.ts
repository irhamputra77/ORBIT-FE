"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { getCurrentUserProfile } from "../services/userProfileApi";
import type { UserProfile } from "../types";

function getProfileErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    return error.response?.data.message
      ?? error.response?.data.error
      ?? "Profil user tidak dapat dimuat.";
  }

  return "Profil user tidak dapat dimuat.";
}

export function useCurrentUserProfile() {
  const [data, setData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      setIsLoading(true);
      setError(null);

      try {
        setData(await getCurrentUserProfile(controller.signal));
      } catch (caughtError) {
        if (!axios.isCancel(caughtError)) {
          setError(getProfileErrorMessage(caughtError));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, [requestVersion]);

  return {
    data,
    isLoading,
    error,
    retry: () => setRequestVersion((version) => version + 1),
  };
}
