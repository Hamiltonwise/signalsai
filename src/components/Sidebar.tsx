import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  BarChart3,
  CheckSquare,
  Settings,
  Trophy,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { NotificationPopover } from "./NotificationPopover";
import { LogoutButton } from "./LogoutButton";

type UserRole = "admin" | "manager" | "viewer";

interface SidebarProps {
  userProfile: any;
  onboardingCompleted: boolean | null;
  disconnect: () => void;
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

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("user_role") as UserRole | null;
    setUserRole(role);
  }, []);

  const canSeeSettings = userRole !== "viewer";
  const canSeeNotifications = userRole !== "viewer";

  const navItems = [
    { label: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
    { label: "PMS Statistics", icon: BarChart3, path: "/pmsStatistics" },
    { label: "Rankings", icon: Trophy, path: "/rankings" },
    { label: "Tasks", icon: CheckSquare, path: "/tasks" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard")
      return true;
    return location.pathname.startsWith(path) && path !== "/dashboard";
  };

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-4 glass rounded-3xl p-4 sticky top-6 h-[calc(100vh-3rem)]">
      {/* Brand / Profile quick area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-white/30 flex items-center justify-center">
            <span className="text-blue-700 font-bold">
              {onboardingCompleted
                ? userProfile?.practiceName?.charAt(0)?.toUpperCase() || "S"
                : "A"}
            </span>
          </div>
          {onboardingCompleted ? (
            <div className="leading-tight">
              <p className="text-sm font-semibold">
                {userProfile?.practiceName ||
                  selectedDomain?.displayName ||
                  "Signals AI"}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {userProfile?.domainName || selectedDomain?.domain || ""}
              </p>
            </div>
          ) : (
            <div className="leading-tight">
              <p className="text-sm font-semibold">Alloro</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Setup in progress
              </p>
            </div>
          )}
        </div>
        {onboardingCompleted && canSeeSettings && (
          <button
            onClick={() => navigate("/settings")}
            className={`p-1 rounded-lg transition-colors ${
              location.pathname === "/settings"
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            }`}
          >
            <Settings className="h-5 w-5 cursor-pointer" />
          </button>
        )}
      </div>

      <div className="h-px bg-white/30 dark:bg-white/10 my-2" />

      {/* Primary nav */}
      <nav className="space-y-1">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="relative w-full rounded-xl px-3 py-2 text-sm"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="sidebarActive"
                  className="absolute inset-0 rounded-xl bg-white/70 dark:bg-white/15 border border-white/30 dark:border-white/10"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <Icon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                <span className="truncate">{label}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        {onboardingCompleted && canSeeNotifications && (
          <NotificationPopover
            googleAccountId={userProfile?.googleAccountId ?? null}
          />
        )}

        {/* Logout Button with Animated Confirmation */}
        <LogoutButton
          onLogout={() => {
            disconnect();
            // Force full page reload to clear all state
            window.location.href = "/signin";
          }}
        />

        {onboardingCompleted && (
          <div className="text-[10px] text-gray-500 text-center">
            Logged in as {userProfile?.email || "user"}
          </div>
        )}
      </div>
    </aside>
  );
};
