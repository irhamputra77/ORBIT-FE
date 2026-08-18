"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationApi";
import type {
  NotificationListParams,
  NotificationListResponse,
  OrbitNotification,
} from "../types";

const EMPTY_RESULT: NotificationListResponse = {
  data: [],
  meta: {
    page: 1,
    limit: 10,
    total: 0,
    unreadCount: 0,
    totalPages: 1,
  },
};

function errorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data.message ?? "Notifikasi tidak dapat dimuat.";
  }
  return "Notifikasi tidak dapat dimuat.";
}

export function useNotifications(params: NotificationListParams) {
  const [result, setResult] = useState<NotificationListResponse>(EMPTY_RESULT);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const serializedParams = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    const controller = new AbortController();
    const requestParams = JSON.parse(serializedParams) as NotificationListParams;

    async function load() {
      setError(null);
      if (result.data.length) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        setResult(await getNotifications(requestParams, controller.signal));
      } catch (caughtError) {
        if (!axios.isCancel(caughtError)) setError(errorMessage(caughtError));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void load();
    return () => controller.abort();
    // result is intentionally excluded so a successful fetch does not loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestVersion, serializedParams]);

  useEffect(() => {
    const refresh = () => setRequestVersion((version) => version + 1);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(refresh, 30_000);

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const markRead = useCallback(async (notification: OrbitNotification) => {
    if (notification.isRead) return;
    setMarkingId(notification.id);
    try {
      const updated = await markNotificationAsRead(notification.id);
      setResult((current) => {
        const unreadOnly = Boolean(params.unreadOnly);
        const data = unreadOnly
          ? current.data.filter((item) => item.id !== notification.id)
          : current.data.map((item) => item.id === updated.id ? updated : item);
        return {
          data,
          meta: {
            ...current.meta,
            total: unreadOnly ? Math.max(0, current.meta.total - 1) : current.meta.total,
            unreadCount: Math.max(0, current.meta.unreadCount - 1),
          },
        };
      });
    } finally {
      setMarkingId(null);
    }
  }, [params.unreadOnly]);

  const markAllRead = useCallback(async () => {
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setResult((current) => ({
        data: params.unreadOnly
          ? []
          : current.data.map((notification) => ({ ...notification, isRead: true })),
        meta: {
          ...current.meta,
          total: params.unreadOnly ? 0 : current.meta.total,
          unreadCount: 0,
          totalPages: params.unreadOnly ? 1 : current.meta.totalPages,
        },
      }));
    } finally {
      setIsMarkingAll(false);
    }
  }, [params.unreadOnly]);

  return {
    notifications: result.data,
    meta: result.meta,
    isLoading,
    isRefreshing,
    error,
    markingId,
    isMarkingAll,
    retry: () => setRequestVersion((version) => version + 1),
    markRead,
    markAllRead,
  };
}
