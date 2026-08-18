import { axiosClient } from "@/lib/http/axiosClient";
import type {
  MarkNotificationReadResponse,
  NotificationListParams,
  NotificationListResponse,
} from "../types";

export async function getNotifications(
  params: NotificationListParams,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<NotificationListResponse>(
    "/notifications",
    { params, signal },
  );

  return response.data;
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await axiosClient.patch<MarkNotificationReadResponse>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
  );

  return response.data.data;
}

export async function markAllNotificationsAsRead() {
  await axiosClient.patch("/notifications/read-all");
}
