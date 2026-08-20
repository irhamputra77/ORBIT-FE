"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import {
  getServiceBulletin,
  getServiceBulletinEes,
  type ServiceBulletinEesDocument,
  type ServiceBulletinReviewAction,
  type ServiceBulletinViewModel,
} from "@/features/service-bulletins";
import { getServiceBulletinReviewHistory } from "../services/serviceBulletinReviewApi";

export function useServiceBulletinDetail(id: string) {
  const [serviceBulletin, setServiceBulletin] = useState<ServiceBulletinViewModel | null>(null);
  const [eesDocument, setEesDocument] = useState<ServiceBulletinEesDocument | null>(null);
  const [reviewActions, setReviewActions] = useState<ServiceBulletinReviewAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);
      setEesDocument(null);
      setReviewActions([]);

      try {
        const detail = await getServiceBulletin(id, controller.signal);
        if (controller.signal.aborted) return;
        setServiceBulletin(detail);

        if (detail.generatedEesId) {
          try {
            const history = await getServiceBulletinReviewHistory(detail.generatedEesId, controller.signal);
            if (!controller.signal.aborted) setReviewActions(history);
          } catch (historyError) {
            if (axios.isCancel(historyError)) return;
            if (!controller.signal.aborted) setReviewActions(detail.reviewActions);
          }
        }

        if (detail.eesReviewStatus?.toUpperCase() === "APPROVED") {
          const ees = await getServiceBulletinEes(id, controller.signal);
          if (!controller.signal.aborted && ees.status === "available") {
            setEesDocument(ees.data);
          }
        }
      } catch (caughtError) {
        if (axios.isCancel(caughtError)) return;
        const message = axios.isAxiosError<{ message?: string; error?: string }>(caughtError)
          ? caughtError.response?.data.message
            ?? caughtError.response?.data.error
            ?? "Detail Service Bulletin tidak dapat dimuat."
          : "Detail Service Bulletin tidak dapat dimuat.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [id, requestVersion]);

  return {
    serviceBulletin,
    eesDocument,
    reviewActions,
    isLoading,
    error,
    retry: () => setRequestVersion((version) => version + 1),
  };
}
