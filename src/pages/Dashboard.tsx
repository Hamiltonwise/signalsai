import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Building2,
  Activity,
  BarChart3,
  LayoutGrid,
  CheckSquare,
  Bell,
  Settings,
} from "lucide-react";

// Import auth and integration hooks for domain selection
import { useAuth } from "../hooks/useAuth";
import { useGSC } from "../hooks/useGSC";
import { useGA4 } from "../hooks/useGA4";
import { useGBP } from "../hooks/useGBP";
import { useClarity } from "../hooks/useClarity";

// Dashboard Components
import { KPIPillars } from "../components/KPIPillars";
import { ConnectionDebugPanel } from "../components/ConnectionDebugPanel";

// Integration Modal Components ✅
import { GBPIntegrationModal } from "../components/GBPIntegrationModal";
import { GSCIntegrationModal } from "../components/GSCIntegrationModal";
import { ClarityIntegrationModal } from "../components/ClarityIntegrationModal";
import { GA4IntegrationModal } from "../components/GA4IntegrationModal";
import { PMSUploadModal } from "../components/PMS/PMSUploadModal";
import { PMSVisualPillars } from "../components/PMS/PMSVisualPillars";
import { VitalSignsCards } from "@/components/VitalSignsCards/VitalSignsCards";
import { MondayTasks } from "../components/Monday/MondayTasks";
import { AnimatePresence, motion } from "framer-motion";
import OrbitVizD3 from "../components/OrbitViz/OrbitVizD3";
import { useLocation, useNavigate } from "react-router-dom";

export default function Dashboard() {
  // Domain selection and GSC data hooks
  const { selectedDomain } = useAuth();

  const { gscData, isLoading: gscLoading, error: gscError } = useGSC();
  const { ga4Data, isLoading: ga4Loading, error: ga4Error } = useGA4();
  const { gbpData, isLoading: gbpLoading, error: gbpError } = useGBP();
  const {
    clarityData,
    isLoading: clarityLoading,
    error: clarityError,
  } = useClarity();

  // Removed unused fetchAllIntegrationData and fetchAllAIReadyData helpers

  // Modal state management
  const [showGA4Modal, setShowGA4Modal] = useState(false);
  const [showGBPModal, setShowGBPModal] = useState(false);
  const [showGSCModal, setShowGSCModal] = useState(false);
  const [showClarityModal, setShowClarityModal] = useState(false);
  const [showPMSUpload, setShowPMSUpload] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "Dashboard" | "Patient Journey Insights" | "PMS Statistics" | "Tasks"
  >("Dashboard");

  // Map between tabs and routes
  const pathForTab = (tab: typeof activeTab) => {
    switch (tab) {
      case "Patient Journey Insights":
        return "/patientJourneyInsights";
      case "PMS Statistics":
        return "/pmsStatistics";
      case "Tasks":
        return "/tasks";
      default:
        return "/dashboard";
    }
  };
  const tabFromPath = (path: string): typeof activeTab => {
    if (path.startsWith("/patientJourneyInsights"))
      return "Patient Journey Insights";
    if (path.startsWith("/pmsStatistics")) return "PMS Statistics";
    if (path.startsWith("/tasks")) return "Tasks";
    return "Dashboard";
  };

  // Initialize/keep activeTab in sync with path
  useEffect(() => {
    setActiveTab(tabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (
    tab: "Dashboard" | "Patient Journey Insights" | "PMS Statistics" | "Tasks"
  ) => {
    setActiveTab(tab);
    const path = pathForTab(tab);
    if (location.pathname !== path) navigate(path, { replace: false });
  };

  // Placeholder data - replace with actual hook data later
  const ready = true;
  const session = { user: { id: "1", email: "user@example.com" } };
  const clientId = "demo-client-123";
  const clientLoading = false;
  const clientError = null;

  // Real integration data from hooks
  const ga4Integration = {
    isConnected: !!selectedDomain?.ga4_propertyId && !ga4Error,
    isLoading: ga4Loading,
    error: ga4Error,
    metrics: {
      // Convert GA4 data structure to match component expectations
      totalUsers: ga4Data.activeUsers.currMonth,
      newUsers: Math.round(ga4Data.activeUsers.currMonth * 0.6), // Estimate 60% new users
      engagementRate: ga4Data.engagementRate.currMonth * 100, // Convert to percentage
      conversions: ga4Data.conversions.currMonth,
      avgSessionDuration: 245, // Placeholder for now
      calculatedScore: Math.min(
        100,
        Math.round(
          ga4Data.activeUsers.currMonth / 100 +
            ga4Data.engagementRate.currMonth * 50 +
            ga4Data.conversions.currMonth / 5
        )
      ),
    },
  };

  const gscIntegration = {
    isConnected: !!selectedDomain?.gsc_domainkey && !gscError,
    isLoading: gscLoading,
    error: gscError,
    metrics: {
      // Convert GSC data structure to match component expectations
      totalImpressions: gscData.impressions.currMonth,
      totalClicks: gscData.clicks.currMonth,
      averageCTR:
        (gscData.clicks.currMonth / gscData.impressions.currMonth) * 100,
      averagePosition: gscData.avgPosition.currMonth,
      calculatedScore: gscData.trendScore,
    },
  };

  // Real GBP integration data from hooks
  const gbpIntegration = {
    isConnected:
      !!(selectedDomain?.gbp_accountId && selectedDomain?.gbp_locationId) &&
      !gbpError,
    isLoading: gbpLoading,
    error: gbpError,
    metrics: {
      // Convert GBP data structure to match component expectations
      totalViews: 15420, // Placeholder - not in current GBP data structure
      phoneCallsTotal: gbpData.callClicks.currMonth,
      websiteClicksTotal: 234, // Placeholder - not in current GBP data structure
      averageRating: gbpData.avgRating.currMonth,
      totalReviews: gbpData.newReviews.currMonth,
      calculatedScore: gbpData.trendScore,
    },
  };

  // Real Clarity integration data from hooks
  const clarityIntegration = {
    isConnected: !clarityError, // Consider connected if no error
    isLoading: clarityLoading,
    error: clarityError,
    metrics: {
      // Convert Clarity data structure to match component expectations
      totalSessions: clarityData.sessions.currMonth,
      bounceRate: clarityData.bounceRate.currMonth * 100, // Convert to percentage
      deadClicks: clarityData.deadClicks.currMonth,
      calculatedScore: Math.min(100, Math.max(0, 100 + clarityData.trendScore)), // Convert trend to score
    },
  };

  // Removed local PMS demo data; PMS visuals remain via dedicated components

  // Removed unused vitalSignsAI mock
  // Fast loading - only show spinner for auth, not initial load
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Fast redirect to sign in if not authenticated
  if (!session) {
    window.location.href = "/signin";
    return null;
  }

  // Show client loading state
  if (clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Resolving client access...</p>
        </div>
      </div>
    );
  }

  // Show client error state
  if (clientError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Client Access Error
            </h2>
            <p className="text-gray-600 mb-6">{clientError}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show no client access state
  if (!clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No Client Access
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have access to any client accounts. Please contact
              support.
            </p>
            <button
              onClick={() => (window.location.href = "/signout")}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] flex gap-6">
        {/* Detached Glass Sidebar */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-4 glass rounded-3xl p-4 sticky top-6 h-[calc(100vh-3rem)]">
          {/* Brand / Profile quick area */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-white/30 flex items-center justify-center">
                <span className="text-blue-700 font-bold">S</span>
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">
                  {selectedDomain?.displayName || "Signals AI"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {selectedDomain?.domain || ""}
                </p>
              </div>
            </div>
            <Settings className="h-5 w-5 text-gray-500" />
          </div>

          <div className="h-px bg-white/30 dark:bg-white/10 my-2" />

          {/* Primary nav */}
          <nav className="space-y-1">
            {[
              { label: "Dashboard", icon: LayoutGrid },
              { label: "Patient Journey Insights", icon: Activity },
              { label: "PMS Statistics", icon: BarChart3 },
              { label: "Tasks", icon: CheckSquare },
            ].map(({ label, icon: Icon }) => {
              const isActive = activeTab === (label as typeof activeTab);
              return (
                <button
                  key={label}
                  onClick={() => handleTabChange(label as typeof activeTab)}
                  className="relative w-full rounded-xl px-3 py-2 text-sm"
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
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
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </div>
            <div className="text-[10px] text-gray-500">
              {selectedDomain?.domain}
            </div>
          </div>
        </aside>

        {/* Main glass content area */}
        <main className="flex-1 glass rounded-3xl overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Domain Selector Section */}
            {/* <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <label
              htmlFor="dashboard-domain-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Selected Domain:
            </label>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <select
                  id="dashboard-domain-select"
                  value={selectedDomain?.domain || ""}
                  onChange={handleDomainChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={domains.length === 0}
                >
                  {domains.length === 0 ? (
                    <option value="">No domains available</option>
                  ) : (
                    domains.map((mapping) => (
                      <option key={mapping.domain} value={mapping.domain}>
                        {mapping.displayName}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchAllIntegrationData}
                  disabled={
                    !selectedDomain ||
                    ga4Loading ||
                    gscLoading ||
                    gbpLoading ||
                    clarityLoading
                  }
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  {ga4Loading || gscLoading || gbpLoading || clarityLoading
                    ? "Loading..."
                    : "Refresh Dashboard"}
                </button>
                <button
                  onClick={fetchAllAIReadyData}
                  disabled={
                    !selectedDomain ||
                    aiDataLoading ||
                    ga4AiDataLoading ||
                    gbpAiDataLoading ||
                    clarityAiDataLoading
                  }
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-md shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  {aiDataLoading ||
                  ga4AiDataLoading ||
                  gbpAiDataLoading ||
                  clarityAiDataLoading
                    ? "Loading AI..."
                    : "Get AI Ready Data"}
                </button>
                <button
                  onClick={() => setShowPMSUpload(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  PMS Data
                </button>
              </div>
            </div>
            {(aiError ||
              ga4AiError ||
              gbpAiError ||
              clarityAiError ||
              ga4Error ||
              gscError ||
              gbpError ||
              clarityError) && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                {aiError ||
                  ga4AiError ||
                  gbpAiError ||
                  clarityAiError ||
                  ga4Error ||
                  gscError ||
                  gbpError ||
                  clarityError}
              </div>
            )}
            {aiData !== null &&
              ga4AiData !== null &&
              gbpAiData !== null &&
              clarityAiData !== null &&
              !aiDataLoading &&
              !ga4AiDataLoading &&
              !gbpAiDataLoading &&
              !clarityAiDataLoading && (
                <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                  ✅ AI Ready data fetched successfully! GSC, GA4, GBP, and
                  Clarity AI data loaded
                </div>
              )}
            {ga4Data &&
              gscData &&
              clarityData &&
              !ga4Loading &&
              !gscLoading &&
              !gbpLoading &&
              !clarityLoading && (
                <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                  ✅ Dashboard data refreshed! GSC: {gscData.clicks.currMonth}{" "}
                  clicks, GA4: {ga4Data.activeUsers.currMonth} users, GBP:{" "}
                  {gbpData.callClicks.currMonth} calls, Clarity:{" "}
                  {clarityData.sessions.currMonth} sessions
                </div>
              )}
          </div>
        </div> */}

            {activeTab === "Dashboard" && (
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-thin text-gray-900 mb-1">
                    Good{" "}
                    {new Date().getHours() < 12
                      ? "morning"
                      : new Date().getHours() < 18
                      ? "afternoon"
                      : "evening"}
                    , Dr. Pawlak
                  </h1>
                  <p className="text-sm font-light text-slate-600">
                    Artful Orthodontics at a glance.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-8 ">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {activeTab === "Dashboard" && (
                    <>
                      <div className="-mt-[80px] -ml-[80px]">
                        <OrbitVizD3
                          className="mb-6 md:mb-8 min-h-[560px] md:min-h-[640px] lg:min-h-[720px]"
                          onNavigate={(tab) => handleTabChange(tab)}
                        />
                      </div>
                      <KPIPillars
                        ga4Data={ga4Integration.metrics}
                        gbpData={gbpIntegration.metrics}
                        gscData={gscIntegration.metrics}
                        clarityData={clarityIntegration.metrics}
                        connectionStatus={{
                          ga4: ga4Integration.isConnected,
                          gbp: gbpIntegration.isConnected,
                          gsc: gscIntegration.isConnected,
                          clarity: clarityIntegration.isConnected,
                        }}
                      />
                    </>
                  )}

                  {activeTab === "Patient Journey Insights" && (
                    <VitalSignsCards
                      selectedDomain={selectedDomain?.domain || ""}
                    />
                  )}

                  {activeTab === "PMS Statistics" && <PMSVisualPillars />}

                  {activeTab === "Tasks" && (
                    <div className="mb-8">
                      <MondayTasks />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Integration Modal Components ✅ */}
            <GA4IntegrationModal
              isOpen={showGA4Modal}
              onClose={() => setShowGA4Modal(false)}
              onSuccess={() => {
                console.log("GA4 integration successful!");
                // Refresh data or show success message
              }}
            />

            <GBPIntegrationModal
              isOpen={showGBPModal}
              onClose={() => setShowGBPModal(false)}
              clientId={clientId}
              ready={ready}
              session={session}
              onSuccess={() => {
                console.log("GBP integration successful!");
                // Refresh data or show success message
              }}
            />

            <GSCIntegrationModal
              isOpen={showGSCModal}
              onClose={() => setShowGSCModal(false)}
              clientId={clientId}
              ready={ready}
              session={session}
              onSuccess={() => {
                console.log("GSC integration successful!");
                // Refresh data or show success message
              }}
            />

            <ClarityIntegrationModal
              isOpen={showClarityModal}
              onClose={() => setShowClarityModal(false)}
              clientId={clientId}
              onSuccess={() => {
                console.log("Clarity integration successful!");
                // Refresh data or show success message
              }}
            />

            <PMSUploadModal
              isOpen={showPMSUpload}
              onClose={() => setShowPMSUpload(false)}
              clientId={clientId}
              onSuccess={() => {
                console.log("PMS upload successful!");
                // Refresh data or show success message
              }}
            />

            {/* Connection Debug Panel */}
            <ConnectionDebugPanel
              isVisible={showDebugPanel}
              onClose={() => setShowDebugPanel(false)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
