import React, { useState, useEffect } from "react";
import {
  Bell,
  Zap,
  AlertCircle,
  Clock,
  Trash2,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Activity,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "../api/notifications";
import { formatDistanceToNow } from "date-fns";

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const googleAccountId = userProfile?.googleAccountId ?? null;

  // Fetch notifications
  useEffect(() => {
    if (!googleAccountId) {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications(googleAccountId);
        setNotifications(data.notifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Poll every 10 seconds
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
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
      case "ranking":
        return "/rankings";
      default:
        return "/dashboard";
    }
  };

  // Get notification type for styling
  const getNotificationType = (notification: Notification) => {
    // Determine type based on content or explicit type
    if (
      notification.type === "pms" ||
      notification.title.toLowerCase().includes("sync") ||
      notification.title.toLowerCase().includes("pms")
    ) {
      return "success";
    }
    if (
      notification.title.toLowerCase().includes("drop") ||
      notification.title.toLowerCase().includes("error") ||
      notification.title.toLowerCase().includes("critical")
    ) {
      return "error";
    }
    if (
      notification.title.toLowerCase().includes("volatility") ||
      notification.title.toLowerCase().includes("below") ||
      notification.title.toLowerCase().includes("warning")
    ) {
      return "warning";
    }
    return "success";
  };

  // Get impact label based on notification
  const getImpactLabel = (notification: Notification) => {
    const type = getNotificationType(notification);
    if (type === "error") return "Critical";
    if (type === "warning") return "High Priority";
    if ((notification.type as string) === "ranking") return "Strategic";
    return "Verified";
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!googleAccountId) return;

    try {
      if (!notification.read) {
        await markNotificationRead(notification.id, googleAccountId);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      }
      navigate(getNotificationPath(notification.type));
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (
    notificationId: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!googleAccountId) return;

    try {
      await markNotificationRead(notificationId, googleAccountId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle clear all / mark all as read
  const handleClearArchive = async () => {
    if (!googleAccountId) return;

    setMarkingAll(true);
    try {
      await markAllNotificationsRead(googleAccountId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-alloro-navy">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 lg:sticky lg:top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-alloro-navy text-white rounded-xl flex items-center justify-center shadow-lg">
              <Bell size={20} />
            </div>
            <div>
              <h1 className="text-[10px] font-black font-heading text-alloro-navy uppercase tracking-[0.2em]">
                Intelligence Signals
              </h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Real-time Practice Alerts
              </p>
            </div>
          </div>
          <button
            onClick={handleClearArchive}
            disabled={markingAll || unreadCount === 0}
            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-alloro-navy uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}{" "}
            Clear Feed
          </button>
        </div>
      </header>

      <main className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12 lg:space-y-16">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
            <div className="divide-y divide-slate-100">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-8 lg:p-10 flex flex-col sm:flex-row gap-8 animate-pulse"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0"></div>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-8 bg-slate-200 rounded-full w-24"></div>
                    </div>
                    <div className="h-5 bg-slate-200 rounded w-full"></div>
                    <div className="flex items-center justify-between pt-4">
                      <div className="h-4 bg-slate-200 rounded w-28"></div>
                      <div className="w-5 h-5 bg-slate-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : notifications.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden"
          >
            <div className="divide-y divide-slate-100">
              {notifications.map((notif) => {
                const type = getNotificationType(notif);
                const impact = getImpactLabel(notif);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="p-8 lg:p-10 hover:bg-slate-50/40 transition-all flex flex-col sm:flex-row gap-8 group cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-alloro-cobalt opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-105 shadow-sm ${
                        type === "success"
                          ? "bg-green-50 text-green-600 border-green-100"
                          : type === "warning"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-red-50 text-red-600 border-red-100"
                      }`}
                    >
                      {type === "success" ? (
                        <CheckCircle2 size={24} />
                      ) : type === "warning" ? (
                        <Zap size={24} />
                      ) : (
                        <AlertCircle size={24} />
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-xl font-black text-alloro-navy font-heading tracking-tight leading-none">
                          {notif.title}
                        </h3>
                        <span
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0 w-fit ${
                            impact === "Critical"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : impact === "High Priority"
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-indigo-50 text-alloro-cobalt border-indigo-100"
                          }`}
                        >
                          {impact}
                        </span>
                      </div>
                      <p className="text-base lg:text-lg text-slate-500 font-medium leading-relaxed tracking-tight max-w-4xl">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-2">
                            <Clock size={16} className="opacity-40" />
                            {formatDistanceToNow(new Date(notif.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                          {!notif.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="text-alloro-cobalt hover:underline"
                            >
                              Acknowledge
                            </button>
                          )}
                        </div>
                        <ChevronRight
                          size={20}
                          className="text-slate-200 group-hover:text-alloro-cobalt transition-all group-hover:translate-x-2"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <div className="p-12 lg:p-16 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner-soft">
              <ShieldCheck size={36} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black font-heading text-alloro-navy tracking-tight">
                Signal Monitoring is Live
              </h4>
              <p className="text-slate-400 font-semibold text-sm max-w-md leading-relaxed tracking-tight">
                Alloro is continuously analyzing practice health signals. New
                actionable insights manifest here automatically.
              </p>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                <Lock size={14} /> SOC2 SECURE
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                <Activity size={14} /> LIVE ANALYTICS
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
