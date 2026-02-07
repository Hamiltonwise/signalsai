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
} from "lucide-react";

export type AdminNavKey =
  | "action-items"
  | "agent-outputs"
  | "ai-pms-automation"
  | "ai-data-insights"
  | "practice-ranking"
  | "app-logs"
  | "organization-management"
  | "websites"
  | "templates";

// Top-level menu items (not in a group)
interface NavItem {
  key: AdminNavKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

// Items that go in the Agents group
const AGENTS_GROUP_ITEMS: NavItem[] = [
  { key: "agent-outputs", label: "Agent Outputs", icon: Database },
  { key: "ai-pms-automation", label: "AI PMS Automation", icon: Cpu },
  { key: "ai-data-insights", label: "Agent Enhancements", icon: LineChart },
  { key: "practice-ranking", label: "Practice Ranking", icon: TrendingUp },
];

// Items that go in the Done For You group
const DONE_FOR_YOU_ITEMS: NavItem[] = [
  { key: "websites", label: "Websites", icon: Globe },
  { key: "templates", label: "Templates", icon: FileCode },
];

// Top-level items
const TOP_ITEMS: NavItem[] = [
  { key: "action-items", label: "Action Items Hub", icon: CheckSquare },
];

// Bottom items
const BOTTOM_ITEMS: NavItem[] = [
  { key: "app-logs", label: "App Logs", icon: FileText },
  { key: "organization-management", label: "Organizations", icon: Building },
];

export function AdminSidebar() {
  const location = useLocation();

  // Check if any path matches
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
        className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-left text-sm font-semibold transition-all ${
          indented ? "pl-8 pr-3" : "px-3"
        } ${
          isActive
            ? "bg-alloro-orange/10 text-alloro-orange border border-alloro-orange/20"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <item.icon
          className={`h-4 w-4 ${isActive ? "text-alloro-orange" : "text-gray-400"}`}
        />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed left-0 top-16 z-40 flex w-72 flex-col p-4"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* Floating Card Container */}
      <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {/* Top-level items */}
          {TOP_ITEMS.map((item) => renderNavLink(item))}

          {/* Agents Group */}
          <div className="pt-4">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Bot className="h-3.5 w-3.5" />
              <span>Agents</span>
            </div>
            <div className="space-y-1 mt-1">
              {AGENTS_GROUP_ITEMS.map((item) => renderNavLink(item, true))}
            </div>
          </div>

          {/* Done For You Group */}
          <div className="pt-4">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Done For You</span>
            </div>
            <div className="space-y-1 mt-1">
              {DONE_FOR_YOU_ITEMS.map((item) => renderNavLink(item, true))}
            </div>
          </div>

          {/* Bottom items */}
          <div className="pt-4 space-y-1">
            {BOTTOM_ITEMS.map((item) => renderNavLink(item))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400 font-medium">Admin Panel v1.0</p>
        </div>
      </div>
    </motion.aside>
  );
}
