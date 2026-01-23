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
  AlertTriangle,
  X,
  HelpCircle,
  Lock,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchClientTasks } from "../api/tasks";
import { fetchNotifications } from "../api/notifications";
import { useIsWizardActive } from "../contexts/OnboardingWizardContext";

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
  isLocked?: boolean;
}

// NavItem Component - MATCHES newdesign exactly
const NavItem = ({
  icon,
  label,
  active = false,
  onClick,
  badge,
  hasNotification = false,
  isLocked = false,
}: NavItemProps) => (
  <button
    onClick={onClick}
    disabled={isLocked}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group relative
    ${
      isLocked
        ? "opacity-40 cursor-not-allowed"
        : active
        ? "bg-alloro-sidehover text-white shadow-sm border border-white/5"
        : "text-white/40 hover:text-white hover:bg-alloro-sidehover"
    }`}
  >
    <div className="flex items-center gap-3.5">
      <div
        className={`transition-transform duration-300 ${
          active
            ? "scale-110 text-alloro-orange"
            : "opacity-40 group-hover:opacity-100"
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-[13px] font-semibold tracking-tight ${
          active ? "text-white" : "group-hover:text-white/80"
        }`}
      >
        {label}
      </span>
      {hasNotification && !active && !isLocked && (
        <span className="absolute left-2.5 top-2.5 flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alloro-orange opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-alloro-orange"></span>
        </span>
      )}
    </div>
    <div className="flex items-center gap-2">
      {isLocked && <Lock size={12} className="text-white/30" />}
      {badge && !isLocked && (
        <span
          className={`px-2 py-0.5 rounded-md text-[9px] font-black leading-none
          ${
            active ? "bg-alloro-orange text-white" : "bg-white/10 text-white/40"
          }`}
        >
          {badge}
        </span>
      )}
      {!badge && !isLocked && active && <ChevronRight size={14} className="opacity-20" />}
    </div>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  userProfile,
  onboardingCompleted,
  disconnect,
  isOpen,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isWizardActive = useIsWizardActive();
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
  const loadNotificationCount = useCallback(async () => {
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
  }, [userProfile?.googleAccountId, onboardingCompleted]);

  // Initial load and periodic refresh of notification count
  useEffect(() => {
    loadNotificationCount();

    // Poll every 3 seconds for real-time notification updates
    const interval = setInterval(loadNotificationCount, 3000);
    return () => clearInterval(interval);
  }, [loadNotificationCount]);

  // Listen for notification updates (when user marks all as read or deletes)
  useEffect(() => {
    const handleNotificationsUpdated = () => {
      loadNotificationCount();
    };

    window.addEventListener(
      "notifications:updated",
      handleNotificationsUpdated
    );
    return () => {
      window.removeEventListener(
        "notifications:updated",
        handleNotificationsUpdated
      );
    };
  }, [loadNotificationCount]);

  const handleLogout = () => {
    disconnect();
    window.location.href = "/signin";
  };

  const canSeeNotifications = userRole !== "viewer";

  // Main navigation items
  const mainNavItems = [
    {
      label: "Practice Hub",
      icon: <LayoutDashboard size={18} />,
      path: "/dashboard",
      showDuringOnboarding: true,
    },
    {
      label: "Referrals Hub",
      icon: <Activity size={18} />,
      path: "/pmsStatistics",
      showDuringOnboarding: false,
    },
    {
      label: "Local Rankings",
      icon: <Trophy size={18} />,
      path: "/rankings",
      showDuringOnboarding: false,
    },
  ];

  // Execution & Alerts items - dynamic badges and notifications
  const executionNavItems = useMemo(
    () => [
      {
        label: "To-Do List",
        icon: <CheckSquare size={18} />,
        path: "/tasks",
        showDuringOnboarding: false,
        badge: userTaskCount > 0 ? String(userTaskCount) : undefined,
      },
      {
        label: "Notifications",
        icon: <Bell size={18} />,
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
    // Block navigation during wizard - the wizard controls navigation
    if (isWizardActive) {
      return;
    }
    navigate(path);
    onClose?.();
  };

  return (
    <>
      {/* Mobile Overlay - matches newdesign exactly */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-alloro-navy/40 backdrop-blur-sm z-[70] lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Logout Confirmation Modal - positioned outside sidebar for full viewport coverage */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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

      {/* Sidebar - matches newdesign exactly */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-72 bg-alloro-sidebg text-white flex flex-col z-[80] border-r border-white/5 shadow-2xl
          transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand Header - matches newdesign exactly */}
        <div className="p-10 pb-12 flex items-center justify-between">
          <div
            className="flex items-center gap-4 group cursor-pointer"
            onClick={() => handleNavigate("/dashboard")}
          >
            <img
              src="/logo.png"
              alt="Alloro"
              className="w-10 h-10 rounded-xl shadow-soft-glow transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <h1 className="font-heading font-black text-xl tracking-tight leading-none">
                Alloro
              </h1>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] mt-1.5 leading-none">
                Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation - matches newdesign exactly */}
        <nav className="flex-1 overflow-y-auto px-6 space-y-10 scrollbar-thin">
          {/* Main Operating View */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-4 mb-4">
              Operations
              {isWizardActive && (
                <span className="ml-2 text-alloro-orange">(Tour Active)</span>
              )}
            </div>
            {filteredMainNav.map(({ label, icon, path }) => (
              <NavItem
                key={label}
                icon={icon}
                label={label}
                active={isActive(path)}
                onClick={() => handleNavigate(path)}
                isLocked={isWizardActive}
              />
            ))}
          </div>

          {/* Execution & Alerts */}
          {onboardingCompleted && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-4 mb-4">
                Execution
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
                      isLocked={isWizardActive}
                    />
                  ) : null
              )}
            </div>
          )}

          {/* Support Section */}
          {onboardingCompleted && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-4 mb-4">
                Support
              </div>
              <NavItem
                icon={<HelpCircle size={18} />}
                label="Help Center"
                active={location.pathname === "/help"}
                onClick={() => handleNavigate("/help")}
                isLocked={isWizardActive}
              />
            </div>
          )}
        </nav>

        {/* Footer / Account - matches newdesign exactly */}
        <div className="p-8 mt-auto">
          <div
            className="bg-white/5 border border-white/5 rounded-2xl p-5 transition-all hover:bg-alloro-sidehover cursor-pointer group"
            onClick={() => handleNavigate("/settings")}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[10px] font-black border border-white/10 group-hover:border-alloro-orange transition-colors">
                {userProfile?.practiceName?.substring(0, 2).toUpperCase() ||
                  "AP"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white truncate">
                  {userProfile?.practiceName || "Practice"}
                </p>
                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-0.5">
                  {userRole === "admin"
                    ? "Administrator"
                    : userRole === "manager"
                    ? "Manager"
                    : "Viewer"}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLogoutConfirm(true);
              }}
              className="flex items-center gap-2 text-white/20 hover:text-red-400 transition-all w-full text-[9px] font-black uppercase tracking-widest"
            >
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
