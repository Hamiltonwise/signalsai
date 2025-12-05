import type { ComponentType } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CheckSquare,
  Cpu,
  LineChart,
  FileText,
  Building,
  Database,
  Bot,
} from "lucide-react";

export type AdminNavKey =
  | "action-items"
  | "agent-outputs"
  | "ai-pms-automation"
  | "ai-data-insights"
  | "app-logs"
  | "organization-management";

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
        className={`flex w-full items-center gap-3 rounded-lg py-2 text-left text-sm font-medium transition ${
          indented ? "pl-8 pr-3" : "px-3"
        } ${
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <item.icon
          className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-gray-400"}`}
        />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-gray-200 bg-white">
      <div className="px-6 py-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Navigation
      </div>
      <nav className="flex-1 space-y-1 px-4 pb-6 overflow-y-auto">
        {/* Top-level items */}
        {TOP_ITEMS.map((item) => renderNavLink(item))}

        {/* Agents Group */}
        <div className="pt-3">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Bot className="h-3.5 w-3.5" />
            <span>Agents</span>
          </div>
          <div className="space-y-0.5">
            {AGENTS_GROUP_ITEMS.map((item) => renderNavLink(item, true))}
          </div>
        </div>

        {/* Bottom items */}
        <div className="pt-3 space-y-0.5">
          {BOTTOM_ITEMS.map((item) => renderNavLink(item))}
        </div>
      </nav>
    </aside>
  );
}
