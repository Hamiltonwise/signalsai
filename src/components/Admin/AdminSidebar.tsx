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
  TrendingUp,
  Shield,
} from "lucide-react";

export type AdminNavKey =
  | "action-items"
  | "agent-outputs"
  | "ai-pms-automation"
  | "ai-data-insights"
  | "practice-ranking"
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
  { key: "practice-ranking", label: "Practice Ranking", icon: TrendingUp },
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
        className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-left text-sm font-bold transition-all ${
          indented ? "pl-8 pr-3" : "px-3"
        } ${
          isActive
            ? "bg-alloro-orange text-white shadow-lg shadow-alloro-orange/20"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        <item.icon
          className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`}
        />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-alloro-navy">
      {/* Logo/Brand Section */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="p-2 bg-alloro-orange rounded-xl">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading text-white">
            Alloro Admin
          </h1>
          <p className="text-xs text-slate-400 font-medium">Control Center</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        {/* Top-level items */}
        {TOP_ITEMS.map((item) => renderNavLink(item))}

        {/* Agents Group */}
        <div className="pt-4">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Bot className="h-3.5 w-3.5" />
            <span>Agents</span>
          </div>
          <div className="space-y-1 mt-1">
            {AGENTS_GROUP_ITEMS.map((item) => renderNavLink(item, true))}
          </div>
        </div>

        {/* Bottom items */}
        <div className="pt-4 space-y-1">
          {BOTTOM_ITEMS.map((item) => renderNavLink(item))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-slate-500 font-medium">Admin Panel v1.0</p>
      </div>
    </aside>
  );
}
