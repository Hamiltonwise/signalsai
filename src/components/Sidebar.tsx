import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Activity,
  CheckSquare,
  Trophy,
  Bell,
  LogOut,
  ChevronRight,
  Settings,
  AlertTriangle,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchClientTasks } from "../api/tasks";
import { fetchNotifications } from "../api/notifications";

type UserRole = "admin" | "manager" | "viewer";

interface SidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProfile: any;
  onboardingCompleted: boolean | null;
  disconnect: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedDomain?: any;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: string;
  hasNotification?: boolean;
}

// NavItem - matches newdesign exactly
const NavItem = ({
  icon,
  label,
  active = false,
  onClick,
  badge,
  hasNotification = false,
}: NavItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 group relative
    ${
      active
        ? "bg-alloro-cobalt text-white shadow-[0_10px_20px_-5px_rgba(36,78,230,0.3)]"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`}
  >
    <div className="flex items-center gap-3.5">
      <div
        className={`transition-transform duration-300 ${
          active
            ? "scale-110"
            : "group-hover:scale-110 opacity-70 group-hover:opacity-100"
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-[13px] font-bold tracking-tight ${
          active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
        }`}
      >
        {label}
      </span>
      {hasNotification && !active && (
        <span className="absolute left-2.5 top-2.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alloro-cobalt opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-alloro-cobalt"></span>
        </span>
      )}
    </div>
    <div className="flex items-center gap-2">
      {badge && (
        <span
          className={`px-1.5 py-0.5 rounded-md text-[9px] font-black leading-none shadow-sm transition-colors
          ${active ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}
        >
          {badge}
        </span>
      )}
      {!badge && active && <ChevronRight size={14} className="opacity-50" />}
    </div>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  userProfile,
  onboardingCompleted,
  disconnect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedDomain,
  isOpen,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userTaskCount, setUserTaskCount] = useState<number>(0);
  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState<number>(0);

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("user_role") as UserRole | null;
    setUserRole(role);
  }, []);

  // Fetch user task count (manual/USER type tasks only)
  const loadTaskCount = useCallback(async () => {
    const googleAccountId = userProfile?.googleAccountId;
    if (!googleAccountId || !onboardingCompleted) return;

    try {
      const response = await fetchClientTasks(googleAccountId);
      if (response?.success && response.tasks) {
        // Count only pending USER tasks
        const pendingUserTasks =
          response.tasks.USER?.filter(
            (task) => task.status !== "complete" && task.status !== "archived"
          ) || [];
        setUserTaskCount(pendingUserTasks.length);
      }
    } catch (err) {
      console.error("Failed to fetch task count for sidebar:", err);
    }
  }, [userProfile?.googleAccountId, onboardingCompleted]);

  // Initial load of task count
  useEffect(() => {
    loadTaskCount();
  }, [loadTaskCount]);

  // Listen for task updates from TasksView
  useEffect(() => {
    const handleTasksUpdated = () => {
      loadTaskCount();
    };

    window.addEventListener("tasks:updated", handleTasksUpdated);
    return () => {
      window.removeEventListener("tasks:updated", handleTasksUpdated);
    };
  }, [loadTaskCount]);

  // Fetch unread notification count
  useEffect(() => {
    const loadNotificationCount = async () => {
      const googleAccountId = userProfile?.googleAccountId;
      if (!googleAccountId || !onboardingCompleted) return;

      try {
        const response = await fetchNotifications(googleAccountId);
        if (response?.success) {
          setUnreadNotificationCount(response.unreadCount || 0);
        }
      } catch (err) {
        console.error("Failed to fetch notification count for sidebar:", err);
      }
    };

    loadNotificationCount();
  }, [userProfile?.googleAccountId, onboardingCompleted]);

  const handleLogout = () => {
    disconnect();
    window.location.href = "/signin";
  };

  const canSeeSettings = userRole !== "viewer";
  const canSeeNotifications = userRole !== "viewer";

  // Main navigation items
  const mainNavItems = [
    {
      label: "Practice Hub",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
      showDuringOnboarding: true,
    },
    {
      label: "Revenue Attribution",
      icon: <Activity size={20} />,
      path: "/pmsStatistics",
      showDuringOnboarding: false,
    },
    {
      label: "Market Rankings",
      icon: <Trophy size={20} />,
      path: "/rankings",
      showDuringOnboarding: false,
    },
  ];

  // Execution & Alerts items - dynamic badges and notifications
  const executionNavItems = useMemo(
    () => [
      {
        label: "Strategic Tasks",
        icon: <CheckSquare size={20} />,
        path: "/tasks",
        showDuringOnboarding: false,
        badge: userTaskCount > 0 ? String(userTaskCount) : undefined,
      },
      {
        label: "Intelligence Signals",
        icon: <Bell size={20} />,
        path: "/notifications",
        showDuringOnboarding: false,
        hasNotification: unreadNotificationCount > 0,
      },
    ],
    [userTaskCount, unreadNotificationCount]
  );

  // Filter nav items based on onboarding status
  const filteredMainNav = onboardingCompleted
    ? mainNavItems
    : mainNavItems.filter((item) => item.showDuringOnboarding);

  const filteredExecutionNav = onboardingCompleted
    ? executionNavItems
    : executionNavItems.filter((item) => item.showDuringOnboarding);

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard")
      return true;
    return location.pathname.startsWith(path) && path !== "/dashboard";
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <>
      {/* Mobile Overlay - matches newdesign exactly */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar - matches newdesign exactly */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-72 bg-alloro-navy text-white flex flex-col z-[80] border-r border-slate-800/50 shadow-2xl
          transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand Header - matches newdesign exactly */}
        <div className="p-8 pb-10 flex items-center justify-between">
          <div
            className="flex items-center gap-4 group cursor-pointer"
            onClick={() => handleNavigate("/dashboard")}
          >
            <div className="w-11 h-11 bg-alloro-cobalt rounded-xl flex items-center justify-center text-xl font-black font-heading shadow-[0_0_20px_rgba(36,78,230,0.4)] transition-transform group-hover:scale-110">
              {onboardingCompleted
                ? userProfile?.practiceName?.charAt(0)?.toUpperCase() || "A"
                : "A"}
            </div>
            <div className="flex flex-col">
              <h1 className="font-heading font-black text-xl tracking-tight leading-none">
                {onboardingCompleted
                  ? userProfile?.practiceName || "Alloro"
                  : "Alloro"}
              </h1>
              <span className="text-[9px] font-black text-alloro-teal uppercase tracking-[0.25em] mt-1.5 opacity-80">
                {onboardingCompleted ? "Intelligence Hub" : "Setup in Progress"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation - matches newdesign exactly */}
        <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-8 scrollbar-thin">
          {/* Main Operating View */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-4">
              Main Operating View
            </div>
            {filteredMainNav.map(({ label, icon, path }) => (
              <NavItem
                key={label}
                icon={icon}
                label={label}
                active={isActive(path)}
                onClick={() => handleNavigate(path)}
              />
            ))}
          </div>

          {/* Execution & Alerts */}
          {onboardingCompleted && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-4">
                Execution & Alerts
              </div>
              {filteredExecutionNav.map(
                ({ label, icon, path, badge, hasNotification }) =>
                  canSeeNotifications || path !== "/notifications" ? (
                    <NavItem
                      key={label}
                      icon={icon}
                      label={label}
                      active={isActive(path)}
                      onClick={() => handleNavigate(path)}
                      badge={badge}
                      hasNotification={hasNotification}
                    />
                  ) : null
              )}
            </div>
          )}

          {/* Configuration - Settings (PRESERVED from original) */}
          {canSeeSettings && onboardingCompleted && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-4">
                Configuration
              </div>
              <NavItem
                icon={<Settings size={20} />}
                label="Settings"
                active={location.pathname === "/settings"}
                onClick={() => handleNavigate("/settings")}
              />
            </div>
          )}
        </nav>

        {/* Footer / Account - matches newdesign exactly */}
        <div className="p-6 mt-auto">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/[0.08]">
            {/* Only show practice info after onboarding is complete */}
            {onboardingCompleted && (
              <div
                className="flex items-center gap-3 mb-4 cursor-pointer group"
                onClick={() => handleNavigate("/settings")}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black border border-white/10 shadow-inner group-hover:border-alloro-cobalt transition-colors">
                  {userProfile?.practiceName?.substring(0, 2).toUpperCase() ||
                    userProfile?.email?.charAt(0).toUpperCase() ||
                    "AP"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-black text-white truncate leading-tight">
                    {userProfile?.practiceName || "Practice"}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-wider mt-1">
                    {userRole === "admin"
                      ? "Admin Access"
                      : userRole === "manager"
                      ? "Manager Access"
                      : "Viewer Access"}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 text-slate-500 hover:text-red-400 transition-all w-full py-2 group"
            >
              <LogOut
                size={16}
                className="group-hover:-translate-x-1 transition-transform"
              />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Disconnect Session
              </span>
            </button>
          </div>
        </div>

        {/* Logout Confirmation Modal (PRESERVED from original) */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-alloro-navy/50 backdrop-blur-sm"
                onClick={() => setShowLogoutConfirm(false)}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-red-50 text-red-600">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-alloro-navy font-heading">
                      Log Out?
                    </h3>
                  </div>

                  <p className="text-slate-600 mb-6 leading-relaxed text-[14px]">
                    Are you sure you want to log out of your account?
                  </p>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </aside>
    </>
  );
};
