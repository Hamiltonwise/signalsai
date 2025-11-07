import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  FileSpreadsheet,
  CheckCircle,
  Bot,
  Info,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "../api/notifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationPopoverProps {
  googleAccountId: number | null;
}

export function NotificationPopover({
  googleAccountId,
}: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Poll notifications every 3 seconds
  useEffect(() => {
    if (!googleAccountId) return;

    const pollNotifications = async () => {
      try {
        const data = await fetchNotifications(googleAccountId);
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // Initial fetch
    pollNotifications();

    // Poll every 3 seconds
    const interval = setInterval(pollNotifications, 3000);

    return () => clearInterval(interval);
  }, [googleAccountId]);

  // Update button position and handle click outside
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", () => setIsOpen(false));
      window.addEventListener("resize", () => setIsOpen(false));
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", () => setIsOpen(false));
      window.removeEventListener("resize", () => setIsOpen(false));
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: number) => {
    if (!googleAccountId) return;

    try {
      await markNotificationRead(notificationId, googleAccountId);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!googleAccountId) return;

    setLoading(true);
    try {
      await markAllNotificationsRead(googleAccountId);
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<
      string,
      {
        Icon: React.ComponentType<{ className?: string }>;
        color: string;
        bgColor: string;
      }
    > = {
      pms: {
        Icon: FileSpreadsheet,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      task: {
        Icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      agent: {
        Icon: Bot,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
      system: {
        Icon: Info,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      },
    };
    return (
      iconMap[type] || {
        Icon: Info,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      }
    );
  };

  const popoverContent = isOpen && buttonRect && (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed",
        left: `${buttonRect.left}px`,
        bottom: `${window.innerHeight - buttonRect.top + 8}px`,
        zIndex: 9999,
      }}
      className="w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {unreadCount > 0
                ? `${unreadCount} unread notification${
                    unreadCount !== 1 ? "s" : ""
                  }`
                : "All caught up!"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              We'll notify you when something important happens
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => {
              const { Icon, color, bgColor } = getNotificationIcon(
                notification.type
              );
              return (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !notification.read
                      ? "bg-blue-50/50 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 ${bgColor} rounded-full p-2`}
                    >
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {notification.title}
                            {!notification.read && (
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </h4>
                          {notification.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatDistanceToNow(
                              new Date(notification.created_at),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex-shrink-0"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Notification Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-white/30"
      >
        <Bell className="h-4 w-4" />
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 left-3 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover rendered via Portal */}
      {createPortal(
        <AnimatePresence>{popoverContent}</AnimatePresence>,
        document.body
      )}
    </>
  );
}
