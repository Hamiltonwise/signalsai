const API_BASE = "/api/notifications";

export interface Notification {
  id: number;
  google_account_id?: number;
  domain_name: string;
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
 * Fetch notifications for logged-in client
 */
export const fetchNotifications = async (
  googleAccountId: number
): Promise<NotificationsResponse> => {
  const response = await fetch(
    `${API_BASE}?googleAccountId=${googleAccountId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Mark a notification as read
 */
export const markNotificationRead = async (
  notificationId: number,
  googleAccountId: number
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE}/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ googleAccountId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to mark notification as read");
  }

  return response.json();
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (
  googleAccountId: number
): Promise<{ success: boolean; message: string; count: number }> => {
  const response = await fetch(`${API_BASE}/mark-all-read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ googleAccountId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Failed to mark all notifications as read"
    );
  }

  return response.json();
};
