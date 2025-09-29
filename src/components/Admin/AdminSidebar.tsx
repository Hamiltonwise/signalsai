import type { ComponentType } from "react";
import { Briefcase, Cpu, LineChart, Globe } from "lucide-react";

export type AdminNavKey =
  | "job-dashboards"
  | "ai-pms-automation"
  | "ai-data-insight"
  | "webdev-engine";

export interface AdminSidebarProps {
  activeKey: AdminNavKey;
  onSelect?: (key: AdminNavKey) => void;
}

const NAV_ITEMS: Array<{
  key: AdminNavKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "job-dashboards", label: "Job Dashboards", icon: Briefcase },
  { key: "ai-pms-automation", label: "AI PMS Automation", icon: Cpu },
  { key: "ai-data-insight", label: "AI Data Insight", icon: LineChart },
  { key: "webdev-engine", label: "Alloro WebDev Engine", icon: Globe },
];

export function AdminSidebar({ activeKey, onSelect }: AdminSidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="px-6 py-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Navigation
      </div>
      <nav className="flex-1 space-y-1 px-4 pb-6">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = key === activeKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect?.(key)}
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
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export { NAV_ITEMS as ADMIN_NAV_ITEMS };
