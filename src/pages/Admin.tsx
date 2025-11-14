import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  AdminLayout,
  PMSAutomationCards,
  AgentInsights,
} from "../components/Admin";
import { ActionItemsHub } from "@/components/Admin/ActionItemsHub";
import AIDataInsightsList from "./admin/AIDataInsightsList";
import AIDataInsightsDetail from "./admin/AIDataInsightsDetail";
import AppLogs from "./admin/AppLogs";

// Map route paths to titles
const ROUTE_TITLES: Record<string, string> = {
  "ai-pms-automation": "AI PMS Automation",
  "action-items": "Action Items Hub",
  "ai-data-insight": "AI Data Insight",
  "ai-data-insights": "AI Data Insights Dashboard",
  "webdev-engine": "Alloro WebDev Engine",
  "app-logs": "App Logs",
};

function WebDevEngine() {
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
}

export default function Admin() {
  const location = useLocation();

  // Extract the current page from the pathname
  const currentPath = location.pathname.split("/").pop() || "action-items";
  const pageTitle = ROUTE_TITLES[currentPath] || "Control Center";

  return (
    <AdminLayout
      actionBar={
        <div className="flex flex-col">
          <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Control Center
          </span>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="action-items" replace />} />
        <Route path="ai-pms-automation" element={<PMSAutomationCards />} />
        <Route path="action-items" element={<ActionItemsHub />} />
        <Route path="ai-data-insight" element={<AgentInsights />} />
        <Route path="ai-data-insights" element={<AIDataInsightsList />} />
        <Route
          path="ai-data-insights/:agentType"
          element={<AIDataInsightsDetail />}
        />
        <Route path="webdev-engine" element={<WebDevEngine />} />
        <Route path="app-logs" element={<AppLogs />} />
      </Routes>
    </AdminLayout>
  );
}
