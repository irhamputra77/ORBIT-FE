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
import { getDummyServiceBulletin } from "../data/serviceBulletinDummyData";

export function useServiceBulletinDetail(id: string) {
  const dummyServiceBulletin = getDummyServiceBulletin(id);
  const [serviceBulletin, setServiceBulletin] = useState<ServiceBulletinViewModel | null>(dummyServiceBulletin);
  const [eesDocument, setEesDocument] = useState<ServiceBulletinEesDocument | null>(null);
  const [reviewActions, setReviewActions] = useState<ServiceBulletinReviewAction[]>([]);
  const [isLoading, setIsLoading] = useState(!dummyServiceBulletin);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (dummyServiceBulletin) return;
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
  }, [dummyServiceBulletin, id, requestVersion]);

  return {
    serviceBulletin: dummyServiceBulletin ?? serviceBulletin,
    eesDocument,
    reviewActions: dummyServiceBulletin?.reviewActions ?? reviewActions,
    isLoading: dummyServiceBulletin ? false : isLoading,
    error,
    isDummy: Boolean(dummyServiceBulletin),
    retry: () => setRequestVersion((version) => version + 1),
  };
}
