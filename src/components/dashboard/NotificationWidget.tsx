import { useState, useEffect } from "react";
import {
  CheckCircle,
  Check,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Bot,
  Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  markNotificationRead,
  type Notification,
} from "../../api/notifications";

interface NotificationWidgetProps {
  googleAccountId: number | null;
  onNotificationRead?: () => void;
}

export function NotificationWidget({
  googleAccountId,
  onNotificationRead,
}: NotificationWidgetProps) {
  const navigate = useNavigate();
  const [latestUnread, setLatestUnread] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications and filter for the latest unread
  const fetchLatestUnread = async () => {
    if (!googleAccountId) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchNotifications(googleAccountId);

      if (data.success) {
        // Get first unread notification (they're ordered by created_at DESC)
        const unread = data.notifications.find((n) => !n.read);
        setLatestUnread(unread || null);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching latest unread notification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load notification"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLatestUnread();
  }, [googleAccountId]);

  // Get navigation path based on notification type
  const getNotificationPath = (type: string) => {
    switch (type) {
      case "pms":
        return "/pmsStatistics";
      case "task":
        return "/tasks";
      case "agent":
        return "/dashboard";
      default:
        return "/dashboard";
    }
  };

  // Handle notification click
  const handleNotificationClick = async () => {
    if (!latestUnread || !googleAccountId) return;

    setIsMarking(true);
    try {
      // Mark as read
      await markNotificationRead(latestUnread.id, googleAccountId);

      // Navigate to appropriate page
      navigate(getNotificationPath(latestUnread.type));

      // Refresh to show next unread notification
      await fetchLatestUnread();

      // Optional callback
      onNotificationRead?.();
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError(err instanceof Error ? err.message : "Failed to mark as read");
    } finally {
      setIsMarking(false);
    }
  };

  // Handle mark as read button (without navigation)
  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!latestUnread || !googleAccountId) return;

    setIsMarking(true);
    try {
      await markNotificationRead(latestUnread.id, googleAccountId);

      // Refresh to show next unread notification
      await fetchLatestUnread();

      // Optional callback
      onNotificationRead?.();
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError(err instanceof Error ? err.message : "Failed to mark as read");
    } finally {
      setIsMarking(false);
    }
  };

  // Get icon for notification type
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
        color: "text-orange-600",
        bgColor: "bg-orange-100",
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

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50/50 rounded-lg p-3 border border-red-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-gray-900">Error Loading</p>
            <p className="text-xs text-gray-600 mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no unread notifications
  if (!latestUnread) {
    return (
      <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs font-medium text-gray-900">All caught up</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              No unread notifications
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render notification
  const { Icon, color, bgColor } = getNotificationIcon(latestUnread.type);

  return (
    <div
      onClick={handleNotificationClick}
      className="bg-white/60 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-white/80 transition-colors"
    >
      <div className="flex items-start gap-2 mb-2">
        <div className={`${bgColor} rounded p-1.5 flex-shrink-0`}>
          <Icon className={`w-3 h-3 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 mb-1">
            {latestUnread.title}
          </p>
          {latestUnread.message && (
            <p className="text-[11px] text-gray-600 leading-relaxed mb-1.5 line-clamp-2">
              {latestUnread.message}
            </p>
          )}
          <p className="text-[10px] text-gray-500">
            {formatDistanceToNow(new Date(latestUnread.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      <button
        onClick={handleMarkAsRead}
        disabled={isMarking}
        className="text-xs text-gray-600 hover:text-gray-900 py-1.5 px-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isMarking ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Marking as read...</span>
          </>
        ) : (
          <>
            <Check className="w-3 h-3" />
            <span>Mark as read</span>
          </>
        )}
      </button>
    </div>
  );
}
