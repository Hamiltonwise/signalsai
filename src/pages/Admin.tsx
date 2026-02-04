import { Routes, Route, Navigate } from "react-router-dom";
import {
  AdminLayout,
  PMSAutomationCards,
  AgentInsights,
} from "../components/Admin";
import { ActionItemsHub } from "@/components/Admin/ActionItemsHub";
import { AdminGuard } from "@/components/Admin/AdminGuard";
import AIDataInsightsList from "./admin/AIDataInsightsList";
import AIDataInsightsDetail from "./admin/AIDataInsightsDetail";
import AppLogs from "./admin/AppLogs";
import { OrganizationManagement } from "./admin/OrganizationManagement";
import AgentOutputsList from "./admin/AgentOutputsList";
import { PracticeRanking } from "./admin/PracticeRanking";

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
  return (
    <AdminGuard>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Navigate to="action-items" replace />} />
          <Route path="ai-pms-automation" element={<PMSAutomationCards />} />
          <Route path="action-items" element={<ActionItemsHub />} />
          <Route path="agent-outputs" element={<AgentOutputsList />} />
          <Route path="ai-data-insight" element={<AgentInsights />} />
          <Route path="ai-data-insights" element={<AIDataInsightsList />} />
          <Route
            path="ai-data-insights/:agentType"
            element={<AIDataInsightsDetail />}
          />
          <Route path="webdev-engine" element={<WebDevEngine />} />
          <Route path="app-logs" element={<AppLogs />} />
          <Route
            path="organization-management"
            element={<OrganizationManagement />}
          />
          <Route path="practice-ranking" element={<PracticeRanking />} />
        </Routes>
      </AdminLayout>
    </AdminGuard>
  );
}
