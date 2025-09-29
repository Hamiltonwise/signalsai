import { useState } from "react";
import {
  AdminLayout,
  type AdminNavKey,
  PMSAutomationCards,
} from "../components/Admin";

function renderContent(activeNav: AdminNavKey) {
  switch (activeNav) {
    case "ai-pms-automation":
      return <PMSAutomationCards />;
    case "job-dashboards":
      return (
        <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
          <p className="text-lg font-semibold text-gray-700">Job Dashboards</p>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Metrics and pipeline views for open roles will appear here.
          </p>
        </div>
      );
    case "ai-data-insight":
      return (
        <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
          <p className="text-lg font-semibold text-gray-700">AI Data Insight</p>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Configure AI insights and reporting automations from this panel soon.
          </p>
        </div>
      );
    case "webdev-engine":
      return (
        <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
          <p className="text-lg font-semibold text-gray-700">
            Alloro WebDev Engine
          </p>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Websites, landing pages, and deployment automations will live in this
            workspace.
          </p>
        </div>
      );
    default:
      return null;
  }
}

export default function Admin() {
  const [activeNav, setActiveNav] = useState<AdminNavKey>("ai-pms-automation");

  return (
    <AdminLayout
      activeNav={activeNav}
      onNavChange={setActiveNav}
      actionBar={
        <div className="flex flex-col">
          <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Control Center
          </span>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeNav === "ai-pms-automation"
              ? "AI PMS Automation"
              : activeNav === "job-dashboards"
              ? "Job Dashboards"
              : activeNav === "ai-data-insight"
              ? "AI Data Insight"
              : "Alloro WebDev Engine"}
          </h1>
        </div>
      }
    >
      {renderContent(activeNav)}
    </AdminLayout>
  );
}
