export type OrbitNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

export type NotificationListParams = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
};

export type NotificationPagination = {
  page: number;
  limit: number;
  total: number;
  unreadCount: number;
  totalPages: number;
};

export type NotificationListResponse = {
  data: OrbitNotification[];
  meta: NotificationPagination;
};

export type MarkNotificationReadResponse = {
  message: string;
  data: OrbitNotification;
};
