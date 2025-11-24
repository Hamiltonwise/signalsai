import type { ComponentType } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckSquare, Cpu, LineChart, Globe, FileText, Building } from "lucide-react";

export type AdminNavKey =
  | "action-items"
  | "ai-pms-automation"
  | "ai-data-insights"
  | "webdev-engine"
  | "app-logs"
  | "organization-management";

const NAV_ITEMS: Array<{
  key: AdminNavKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "action-items", label: "Action Items Hub", icon: CheckSquare },
  { key: "ai-pms-automation", label: "AI PMS Automation", icon: Cpu },
  {
    key: "ai-data-insights",
    label: "AI Data Insights Dashboard",
    icon: LineChart,
  },
  { key: "webdev-engine", label: "Alloro WebDev Engine", icon: Globe },
  { key: "app-logs", label: "App Logs", icon: FileText },
  {
    key: "organization-management",
    label: "Organization Management",
    icon: Building,
  },
];

export function AdminSidebar() {
  const location = useLocation();

  // Extract the current page from the pathname
  const currentPath = location.pathname.split("/").pop() || "ai-pms-automation";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="px-6 py-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Navigation
      </div>
      <nav className="flex-1 space-y-1 px-4 pb-6">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = key === currentPath;

          return (
            <Link
              key={key}
              to={`/admin/${key}`}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
