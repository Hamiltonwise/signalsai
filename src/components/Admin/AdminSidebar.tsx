import type { ComponentType } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Cpu,
  LineChart,
  FileText,
  Building,
  Database,
  Bot,
  TrendingUp,
  Briefcase,
  Globe,
  FileCode,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

export type AdminNavKey =
  | "action-items"
  | "agent-outputs"
  | "ai-pms-automation"
  | "ai-data-insights"
  | "practice-ranking"
  | "app-logs"
  | "organization-management"
  | "websites"
  | "templates"
  | "settings";

interface NavItem {
  key: AdminNavKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const AGENTS_GROUP_ITEMS: NavItem[] = [
  { key: "agent-outputs", label: "Agent Outputs", icon: Database },
  { key: "ai-pms-automation", label: "AI PMS Automation", icon: Cpu },
  { key: "ai-data-insights", label: "Agent Enhancements", icon: LineChart },
  { key: "practice-ranking", label: "Practice Ranking", icon: TrendingUp },
];

const DONE_FOR_YOU_ITEMS: NavItem[] = [
  { key: "websites", label: "Websites", icon: Globe },
  { key: "templates", label: "Templates", icon: FileCode },
];

const TOP_ITEMS: NavItem[] = [
  { key: "action-items", label: "Action Items Hub", icon: CheckSquare },
];

const BOTTOM_ITEMS: NavItem[] = [
  { key: "app-logs", label: "App Logs", icon: FileText },
  { key: "organization-management", label: "Organizations", icon: Building },
  { key: "settings", label: "Settings", icon: Settings },
];

interface AdminSidebarProps {
  topOffset?: string;
}

export function AdminSidebar({ topOffset }: AdminSidebarProps = {}) {
  const location = useLocation();
  const { collapsed, toggleCollapsed } = useSidebar();

  const isActivePath = (key: AdminNavKey) => {
    const pathParts = location.pathname.split("/");
    return pathParts.includes(key);
  };

  const renderNavLink = (item: NavItem, indented = false) => {
    const isActive = isActivePath(item.key);

    return (
      <Link
        key={item.key}
        to={`/admin/${item.key}`}
        title={collapsed ? item.label : undefined}
        className={`flex w-full items-center rounded-xl py-2.5 text-left text-sm font-semibold transition-all ${
          collapsed ? "justify-center px-2" : indented ? "gap-3 pl-8 pr-3" : "gap-3 px-3"
        } ${
          isActive
            ? "bg-alloro-orange/10 text-alloro-orange border border-alloro-orange/20"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <item.icon
          className={`h-4 w-4 shrink-0 ${isActive ? "text-alloro-orange" : "text-gray-400"}`}
        />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 288 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 z-40 flex flex-col p-2"
      style={{
        top: topOffset || "4rem",
        height: `calc(100vh - ${topOffset || "4rem"})`,
      }}
    >
      <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {TOP_ITEMS.map((item) => renderNavLink(item))}

          {/* Agents Group */}
          <div className="pt-4">
            {!collapsed ? (
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <Bot className="h-3.5 w-3.5" />
                <span>Agents</span>
              </div>
            ) : (
              <div className="flex justify-center py-2">
                <div className="w-6 border-t border-gray-200" />
              </div>
            )}
            <div className="space-y-1 mt-1">
              {AGENTS_GROUP_ITEMS.map((item) => renderNavLink(item, !collapsed))}
            </div>
          </div>

          {/* Done For You Group */}
          <div className="pt-4">
            {!collapsed ? (
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <Briefcase className="h-3.5 w-3.5" />
                <span>Done For You</span>
              </div>
            ) : (
              <div className="flex justify-center py-2">
                <div className="w-6 border-t border-gray-200" />
              </div>
            )}
            <div className="space-y-1 mt-1">
              {DONE_FOR_YOU_ITEMS.map((item) => renderNavLink(item, !collapsed))}
            </div>
          </div>

          {/* Bottom items */}
          <div className="pt-4 space-y-1">
            {BOTTOM_ITEMS.map((item) => renderNavLink(item))}
          </div>
        </nav>

        {/* Footer with collapse toggle */}
        <div className="px-3 py-3 border-t border-gray-100 bg-gray-50/50">
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
            {!collapsed && (
              <p className="text-xs text-gray-400 font-medium pl-1">Admin Panel v1.0</p>
            )}
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
