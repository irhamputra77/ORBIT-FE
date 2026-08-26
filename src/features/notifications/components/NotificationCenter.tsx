"use client";

import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useApp } from "@/app/(orbit)/context/AppContext";
import { useSmoothNavigation } from "@/components/orbit/SmoothNavigationProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "../hooks/useNotifications";
import { SHOW_NOTIFICATION_TOAST_AFTER_LOGIN } from "../constants";
import type { OrbitNotification } from "../types";

const PAGE_SIZE = 10;

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");

  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return formatter.format(days, "day");

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(timestamp);
}

function notificationDestination(
  link: string | null,
  userRole: "engineer" | "manager" | "admin",
) {
  if (!link || !link.startsWith("/") || link.startsWith("//")) return null;

  const approvalMatch = link.match(/^\/approvals\/([^/?#]+)/);
  if (approvalMatch) {
    if (userRole === "admin") {
      return `/ees/${encodeURIComponent(approvalMatch[1])}`;
    }
    const target = userRole === "manager" ? "/manager-ees-review" : "/second-engineer-review";
    return `${target}?eesId=${encodeURIComponent(approvalMatch[1])}`;
  }

  return link;
}

function NotificationRow({
  notification,
  busy,
  onSelect,
}: {
  notification: OrbitNotification;
  busy: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={busy}
      className={`group relative flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/70 disabled:cursor-wait ${notification.isRead ? "bg-card" : "bg-blue-600/[0.07]"}`}
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-border" : "bg-blue-600 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"}`}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={`line-clamp-1 text-xs text-foreground ${notification.isRead ? "font-semibold" : "font-bold"}`}>
            {notification.title}
          </span>
          <span className="shrink-0 text-[9px] text-muted-foreground">
            {relativeTime(notification.createdAt)}
          </span>
        </span>
        <span className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
          {notification.message}
        </span>
      </span>
      {busy && (
        <Loader2
          size={13}
          className="absolute bottom-2 right-3 animate-spin text-blue-600"
          aria-label="Menandai notifikasi"
        />
      )}
    </button>
  );
}

export function NotificationCenter() {
  const router = useSmoothNavigation();
  const { userRole } = useApp();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const query = useNotifications({ page, limit: PAGE_SIZE, unreadOnly });
  const {
    error: notificationError,
    isLoading: notificationsLoading,
    markRead,
    meta: notificationMeta,
    notifications,
  } = query;
  const notificationSnapshotReady = useRef(false);
  const previousUnreadCount = useRef(0);

  useEffect(() => {
    if (notificationsLoading || notificationError) return;

    if (!notificationSnapshotReady.current) {
      notificationSnapshotReady.current = true;
      previousUnreadCount.current = notificationMeta.unreadCount;

      const showAfterLogin = window.sessionStorage.getItem(
        SHOW_NOTIFICATION_TOAST_AFTER_LOGIN,
      ) === "1";
      window.sessionStorage.removeItem(SHOW_NOTIFICATION_TOAST_AFTER_LOGIN);

      if (showAfterLogin && notificationMeta.unreadCount > 0) {
        const latestUnread = page === 1
          ? notifications.find((notification) => !notification.isRead)
          : undefined;

        toast.info("Ada notifikasi yang perlu dilihat", {
          id: "notifications-after-login",
          description: notificationMeta.unreadCount > 1
            ? `Anda memiliki ${notificationMeta.unreadCount} notifikasi belum dibaca. Buka pusat notifikasi untuk melihat detailnya.`
            : latestUnread?.message ?? "Anda memiliki satu notifikasi belum dibaca.",
          duration: 10_000,
          action: {
            label: "Lihat notifikasi",
            onClick: () => setOpen(true),
          },
        });
      }
      return;
    }

    const addedCount = notificationMeta.unreadCount - previousUnreadCount.current;
    previousUnreadCount.current = notificationMeta.unreadCount;
    if (addedCount <= 0) return;

    const latestNotification = page === 1
      ? notifications.find((notification) => !notification.isRead)
      : undefined;
    const destination = notificationDestination(
      latestNotification?.link ?? null,
      userRole,
    );

    toast.info(latestNotification?.title ?? "Notifikasi baru masuk", {
      id: latestNotification
        ? `incoming-notification-${latestNotification.id}`
        : `incoming-notification-count-${notificationMeta.unreadCount}`,
      description: addedCount > 1
        ? `${addedCount} notifikasi baru masuk. ${latestNotification?.message ?? "Buka pusat notifikasi untuk melihat detailnya."}`
        : latestNotification?.message ?? "Buka pusat notifikasi untuk melihat detailnya.",
      duration: 8_000,
      action: {
        label: "Lihat",
        onClick: () => {
          if (latestNotification && !latestNotification.isRead) {
            void markRead(latestNotification).catch(() => undefined);
          }
          if (destination) router.push(destination);
          else setOpen(true);
        },
      },
    });
  }, [
    markRead,
    notificationError,
    notificationMeta.unreadCount,
    notifications,
    notificationsLoading,
    page,
    router,
    userRole,
  ]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) query.retry();
  }

  async function handleSelect(notification: OrbitNotification) {
    try {
      await query.markRead(notification);
    } catch {
      toast.error("Notifikasi belum dapat ditandai sebagai dibaca.");
    }

    const destination = notificationDestination(notification.link, userRole);
    if (destination) {
      setOpen(false);
      router.push(destination);
    }
  }

  async function handleMarkAll() {
    try {
      await query.markAllRead();
      setPage(1);
      toast.success("Semua notifikasi telah ditandai sebagai dibaca.");
    } catch {
      toast.error("Gagal menandai semua notifikasi.");
    }
  }

  function changeUnreadFilter(nextUnreadOnly: boolean) {
    setUnreadOnly(nextUnreadOnly);
    setPage(1);
  }

  const unreadLabel = query.meta.unreadCount > 99
    ? "99+"
    : String(query.meta.unreadCount);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative rounded-lg p-1.5 transition-colors hover:bg-accent"
          title="Notifications"
          aria-label={`Notifications, ${query.meta.unreadCount} unread`}
        >
          <Bell size={16} className="text-muted-foreground" />
          {query.meta.unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60 motion-reduce:animate-none" />
              <span className="relative flex min-h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-red-600 px-1 text-[8px] font-bold leading-none text-white shadow-[0_0_0_2px_rgba(220,38,38,0.16)]">
                {unreadLabel}
              </span>
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="z-[80] w-[390px] overflow-hidden rounded-2xl border-border bg-card p-0 shadow-[0_18px_50px_rgba(15,23,42,0.22)]"
      >
        <div className="border-b border-border px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">Notifications</h2>
                {query.isRefreshing && <Loader2 size={12} className="animate-spin text-blue-600" />}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {query.meta.unreadCount} unread notification{query.meta.unreadCount === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleMarkAll()}
              disabled={!query.meta.unreadCount || query.isMarkingAll}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-blue-700 transition-colors hover:bg-blue-600/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-300"
            >
              {query.isMarkingAll
                ? <Loader2 size={12} className="animate-spin" />
                : <CheckCheck size={12} />}
              Mark all read
            </button>
          </div>

          <div className="mt-3 flex rounded-lg border border-border bg-muted/60 p-0.5">
            {[
              { label: "All", value: false },
              { label: "Unread", value: true },
            ].map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => changeUnreadFilter(filter.value)}
                className={`flex-1 rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors ${unreadOnly === filter.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[430px] overflow-y-auto">
          {query.isLoading ? (
            <div className="space-y-1 p-3" role="status" aria-label="Loading notifications">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex animate-pulse gap-3 rounded-xl px-2 py-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="h-2.5 w-full rounded bg-muted" />
                    <div className="h-2.5 w-4/5 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : query.error ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-8 text-center">
              <RefreshCw size={22} className="mb-3 text-red-500" />
              <p className="text-xs font-semibold text-foreground">Notifications unavailable</p>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{query.error}</p>
              <button
                type="button"
                onClick={query.retry}
                className="mt-3 rounded-lg bg-blue-700 px-3 py-1.5 text-[10px] font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : query.notifications.length ? (
            query.notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                busy={query.markingId === notification.id}
                onSelect={() => void handleSelect(notification)}
              />
            ))
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center px-8 text-center">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-300">
                <Inbox size={19} />
              </span>
              <p className="text-xs font-semibold text-foreground">
                {unreadOnly ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                {unreadOnly
                  ? "You are all caught up."
                  : "Updates related to EES and approvals will appear here."}
              </p>
            </div>
          )}
        </div>

        {query.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <span className="text-[10px] text-muted-foreground">
              Page {query.meta.page} of {query.meta.totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || query.isLoading}
                className="rounded-md border border-border p-1 text-muted-foreground hover:bg-accent disabled:opacity-40"
                aria-label="Previous notification page"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(query.meta.totalPages, current + 1))}
                disabled={page >= query.meta.totalPages || query.isLoading}
                className="rounded-md border border-border p-1 text-muted-foreground hover:bg-accent disabled:opacity-40"
                aria-label="Next notification page"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
