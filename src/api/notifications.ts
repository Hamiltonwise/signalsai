import { apiGet, apiPatch, apiDelete } from "./index";

export interface Notification {
  id: number;
  organization_id?: number;
  title: string;
  message?: string;
  type: "task" | "pms" | "agent" | "system";
  read: boolean;
  read_timestamp?: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

/**
 * Fetch notifications for logged-in client.
 * organizationId is resolved server-side from the JWT token via RBAC middleware.
 */
export const fetchNotifications = async (
  _organizationId: number,
  locationId?: number | null
): Promise<NotificationsResponse> => {
  const params = new URLSearchParams();
  if (locationId) {
    params.append("locationId", String(locationId));
  }
  const qs = params.toString();
  const path = `/notifications${qs ? `?${qs}` : ""}`;
  return apiGet({ path });
};

/**
 * Mark a notification as read
 */
export const markNotificationRead = async (
  notificationId: number,
  _organizationId: number
): Promise<{ success: boolean; message: string }> => {
  return apiPatch({
    path: `/notifications/${notificationId}/read`,
  });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (
  _organizationId: number
): Promise<{ success: boolean; message: string; count: number }> => {
  return apiPatch({
    path: `/notifications/mark-all-read`,
  });
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (
  _organizationId: number
): Promise<{ success: boolean; message: string; count: number }> => {
  return apiDelete({
    path: `/notifications/delete-all`,
  });
};
