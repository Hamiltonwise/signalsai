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
    if (type === "error") return "Critical Intervention";
    if (type === "warning") return "High Priority Alert";
    if ((notification.type as string) === "ranking") return "Strategic Alpha";
    return "Verified Protocol";
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
    <div className="min-h-screen bg-alloro-bg font-body text-alloro-textDark pb-32 selection:bg-alloro-orange selection:text-white">
      {/* Header */}
      <header className="glass-header border-b border-black/5 lg:sticky lg:top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 bg-alloro-navy text-white rounded-xl flex items-center justify-center shadow-lg">
              <Bell size={20} />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-[11px] font-black font-heading text-alloro-textDark uppercase tracking-[0.25em] leading-none">
                Intelligence Signals
              </h1>
              <span className="text-[9px] font-bold text-alloro-textDark/40 uppercase tracking-widest mt-1.5 hidden sm:inline">
                Real-time Practice Surveillance
              </span>
            </div>
          </div>
          <button
            onClick={handleClearArchive}
            disabled={markingAll || unreadCount === 0}
            className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 hover:text-alloro-orange uppercase tracking-[0.2em] transition-all group disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} className="group-hover:rotate-12" />
            )}{" "}
            Clear Feed Matrix
          </button>
        </div>
      </header>

      <main className="w-full max-w-[1100px] mx-auto px-6 lg:px-10 py-10 lg:py-16 space-y-12 lg:space-y-20 text-left">
        {/* Hero Section */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 pt-2">
          <div className="flex items-center gap-4 mb-3">
            <div className="px-3 py-1.5 bg-alloro-orange/5 rounded-lg text-alloro-orange text-[10px] font-black uppercase tracking-widest border border-alloro-orange/10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-alloro-orange animate-pulse"></span>
              Signals Active
            </div>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black font-heading text-alloro-navy tracking-tight leading-none mb-4">
            Practice Pulse.
          </h1>
          <p className="text-xl lg:text-2xl text-slate-500 font-medium tracking-tight leading-relaxed max-w-4xl">
            Live stream of{" "}
            <span className="text-alloro-orange underline underline-offset-8 font-black">
              Clinical & Operational Events
            </span>{" "}
            that require your leadership attention.
          </p>
        </section>

        {loading ? (
          <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-premium overflow-hidden">
            <div className="divide-y divide-black/5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-10 lg:p-14 flex flex-col sm:flex-row gap-10 animate-pulse"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0"></div>
                  <div className="flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-8 bg-slate-200 rounded-full w-32"></div>
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-full"></div>
                    <div className="h-6 bg-slate-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : notifications.length > 0 ? (
          <section className="bg-white rounded-[2.5rem] border border-black/5 shadow-premium overflow-hidden">
            <div className="divide-y divide-black/5">
              {notifications.map((notif) => {
                const type = getNotificationType(notif);
                const impact = getImpactLabel(notif);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="p-10 lg:p-14 hover:bg-slate-50/40 transition-all flex flex-col sm:flex-row gap-10 group cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-alloro-orange opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110 shadow-sm ${
                        type === "success"
                          ? "bg-green-50 text-green-600 border-green-100"
                          : type === "warning"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-red-50 text-red-600 border-red-100"
                      }`}
                    >
                      {type === "success" ? (
                        <CheckCircle2 size={28} />
                      ) : type === "warning" ? (
                        <Zap size={28} />
                      ) : (
                        <AlertCircle size={28} />
                      )}
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <h3 className="text-2xl font-black text-alloro-navy font-heading tracking-tight leading-none group-hover:text-alloro-orange transition-colors">
                          {notif.title}
                        </h3>
                        <span
                          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shrink-0 w-fit shadow-sm ${
                            impact.includes("Critical")
                              ? "bg-red-50 text-red-600 border-red-100"
                              : impact.includes("High")
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-white text-alloro-navy border-black/5"
                          }`}
                        >
                          {impact}
                        </span>
                      </div>
                      <p className="text-lg lg:text-xl text-slate-500 font-medium leading-relaxed tracking-tight max-w-4xl">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between pt-6 border-t border-black/[0.03]">
                        <div className="flex items-center gap-8 text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">
                          <span className="flex items-center gap-2.5">
                            <Clock
                              size={18}
                              className="text-alloro-orange/30"
                            />{" "}
                            {formatDistanceToNow(new Date(notif.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                          {!notif.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="text-alloro-navy hover:text-alloro-orange transition-colors"
                            >
                              Mark as Resolved
                            </button>
                          )}
                        </div>
                        <div className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center text-slate-200 group-hover:text-alloro-orange group-hover:border-alloro-orange/20 transition-all group-hover:translate-x-2">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="p-12 lg:p-20 bg-white border border-black/5 rounded-[2.5rem] shadow-premium flex flex-col items-center text-center space-y-8">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[1.5rem] flex items-center justify-center border border-black/5 shadow-inner">
              <ShieldCheck size={40} />
            </div>
            <div className="space-y-4">
              <h4 className="text-2xl font-black font-heading text-alloro-navy tracking-tight">
                All Clear.
              </h4>
              <p className="text-slate-400 font-bold text-lg max-w-md leading-relaxed tracking-tight">
                No active signals requiring attention. System surveillance is
                active and monitoring 24/7.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Section - Signal Surveillance */}
        <section className="p-12 lg:p-20 bg-alloro-navy rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col items-center text-center space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-80 bg-alloro-orange/5 rounded-full -mr-40 -mt-40 blur-[120px] pointer-events-none group-hover:bg-alloro-orange/10 transition-all duration-700"></div>

          <div className="w-20 h-20 bg-white/10 text-white rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-2xl relative z-10">
            <ShieldCheck size={40} className="text-white/60" />
          </div>
          <div className="space-y-4 relative z-10">
            <h4 className="text-2xl font-black font-heading text-white tracking-tight">
              Signal Surveillance Active
            </h4>
            <p className="text-blue-100/40 font-bold text-lg max-w-lg leading-relaxed tracking-tight">
              Alloro AI is continuously processing clinical health signals
              across your entire digital and practice footprint.
            </p>
          </div>
          <div className="flex items-center gap-12 pt-6 relative z-10">
            <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
              <Lock size={16} /> SOC2 SECURE
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
              <Activity size={16} /> LIVE DATASTREAM
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-10 pb-12 flex flex-col items-center gap-10 text-center">
          <div className="w-16 h-16 bg-alloro-orange text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl">
            A
          </div>
          <p className="text-[11px] text-alloro-textDark/20 font-black tracking-[0.4em] uppercase">
            Alloro Signal Protocol • v2.6.0
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Notifications;
