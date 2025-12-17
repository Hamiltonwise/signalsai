import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NotificationPopover } from "./NotificationPopover";

type UserRole = "admin" | "manager" | "viewer";

interface SidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProfile: any;
  onboardingCompleted: boolean | null;
  disconnect: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedDomain?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userProfile,
  onboardingCompleted,
  disconnect,
  selectedDomain,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("user_role") as UserRole | null;
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    disconnect();
    window.location.href = "/signin";
  };

  const canSeeSettings = userRole !== "viewer";
  const canSeeNotifications = userRole !== "viewer";

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "PMS Statistics", icon: Activity, path: "/pmsStatistics" },
    { label: "Rankings", icon: Trophy, path: "/rankings" },
    { label: "Tasks", icon: CheckSquare, path: "/tasks" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard")
      return true;
    return location.pathname.startsWith(path) && path !== "/dashboard";
  };

  return (
    <aside className="w-72 bg-alloro-navy text-white h-screen fixed left-0 top-0 flex flex-col z-20 border-r border-slate-800 shadow-xl font-body">
      {/* Brand Header */}
      <div className="p-8 border-b border-slate-800/50">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 bg-alloro-cobalt rounded-xl flex items-center justify-center text-2xl font-bold font-heading shadow-lg shadow-blue-900/20">
            {onboardingCompleted
              ? userProfile?.practiceName?.charAt(0)?.toUpperCase() || "A"
              : "A"}
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl leading-tight tracking-tight">
              {onboardingCompleted
                ? userProfile?.practiceName || "Alloro"
                : "Alloro"}
            </h1>
            <p className="text-xs text-slate-400 font-body tracking-wide opacity-80">
              {onboardingCompleted
                ? "Growth you can see."
                : "Setup in progress"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 mb-4">
          Practice Overview
        </div>

        {navItems.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <div
              key={label}
              onClick={() => navigate(path)}
              className={`
                flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 group
                ${
                  active
                    ? "bg-alloro-cobalt text-white shadow-lg shadow-blue-900/20 translate-x-1"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <div className="flex items-center gap-3.5">
                <Icon size={20} />
                <span className="text-[15px] font-medium">{label}</span>
              </div>
              {active && <ChevronRight size={16} className="text-white/80" />}
            </div>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-6 border-t border-slate-800/50 space-y-6 bg-slate-900/30">
        {onboardingCompleted && canSeeNotifications && (
          <div className="flex items-center justify-between text-slate-400 hover:text-white cursor-pointer transition-colors px-2 group">
            <div className="flex items-center gap-3 w-full">
              <NotificationPopover
                googleAccountId={userProfile?.googleAccountId ?? null}
                customTrigger={
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Bell size={18} />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-alloro-navy"></span>
                    </div>
                    <span className="text-[15px] font-medium group-hover:translate-x-1 transition-transform">
                      Notifications
                    </span>
                  </div>
                }
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-white">
              {userProfile?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userProfile?.practiceName || "Practice"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {userProfile?.domainName ||
                  selectedDomain?.domain ||
                  userProfile?.email ||
                  ""}
              </p>
            </div>
            {onboardingCompleted && canSeeSettings && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/settings");
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Settings size={16} />
              </button>
            )}
          </div>

          {/* Custom Logout Button implementation to match design */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors w-full px-2 py-2 rounded-lg hover:bg-white/5 group"
          >
            <LogOut size={18} />
            <span className="text-[15px] font-medium">Log Out</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-red-50 text-red-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-alloro-navy font-heading">
                    Log Out?
                  </h3>
                </div>

                <p className="text-slate-600 mb-6 leading-relaxed">
                  Are you sure you want to log out of your account?
                </p>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
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
  );
};
