import React, { useState, useEffect } from "react";
import { AlertTriangle, Building2, Settings, Lock, ChevronRight, ChevronDown } from "lucide-react";

// Import auth and integration hooks for domain selection
import { useAuth } from "../hooks/useAuth";

// Dashboard Components
import { ConnectionDebugPanel } from "../components/ConnectionDebugPanel";
import { DashboardOverview } from "../components/dashboard/DashboardOverview";
import { ReferralEngineDashboard } from "../components/ReferralEngineDashboard";
import { PMSVisualPillars } from "../components/PMS/PMSVisualPillars";
import { RankingsDashboard } from "../components/dashboard/RankingsDashboard";

// Integration Modal Components ✅
import { GBPIntegrationModal } from "../components/GBPIntegrationModal";
import { GSCIntegrationModal } from "../components/GSCIntegrationModal";
import { ClarityIntegrationModal } from "../components/ClarityIntegrationModal";
import { GA4IntegrationModal } from "../components/GA4IntegrationModal";
import { PMSUploadModal } from "../components/PMS/PMSUploadModal";
import { VitalSignsCards } from "@/components/VitalSignsCards/VitalSignsCards";
import { TasksView } from "../components/tasks/TasksView";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

// Onboarding Components
import { OnboardingContainer } from "../components/onboarding/OnboardingContainer";
import onboarding from "../api/onboarding";
import { getPriorityItem } from "../hooks/useLocalStorage";
import { useIsWizardActive, useRecheckWizardStatus } from "../contexts/OnboardingWizardContext";

export default function Dashboard() {
  // Domain selection and auth hooks
  const { selectedDomain, userProfile, refreshUserProperties } = useAuth();
  const isWizardActive = useIsWizardActive();
  const recheckWizardStatus = useRecheckWizardStatus();

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
    | "Dashboard"
    | "Patient Journey Insights"
    | "PMS Statistics"
    | "Rankings"
    | "Tasks"
    | "Referral Engine"
  >("Dashboard");

  // Onboarding state - initialize from localStorage for instant rendering
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(() => {
    const cached = localStorage.getItem("onboardingCompleted");
    return cached === "true" ? true : cached === "false" ? false : null;
  });
  const [hasProperties, setHasProperties] = useState<boolean>(() => {
    const cached = localStorage.getItem("hasProperties");
    return cached !== "false"; // Default to true unless explicitly false
  });
  const [checkingOnboarding, setCheckingOnboarding] = useState(() => {
    // Skip initial loading screen if we have cached status
    const cached = localStorage.getItem("onboardingCompleted");
    return cached === null;
  });

  // Map between tabs and routes
  const tabFromPath = (path: string): typeof activeTab => {
    if (path.startsWith("/patientJourneyInsights"))
      return "Patient Journey Insights";
    if (path.startsWith("/pmsStatistics")) return "PMS Statistics";
    if (path.startsWith("/rankings")) return "Rankings";
    if (path.startsWith("/tasks")) return "Tasks";
    if (path.startsWith("/referralEngine")) return "Referral Engine";
    return "Dashboard";
  };

  // Initialize/keep activeTab in sync with path
  useEffect(() => {
    setActiveTab(tabFromPath(location.pathname));
  }, [location.pathname]);

  // Ensure userProfile.googleAccountId is loaded from storage if not already set
  // This handles the case where login just completed and userProfile needs refresh
  useEffect(() => {
    const storedGoogleAccountId = getPriorityItem("google_account_id");

    // If storage has googleAccountId but userProfile doesn't, refresh
    if (storedGoogleAccountId && !userProfile?.googleAccountId) {
      console.log(
        "[Dashboard] googleAccountId in localStorage but not in userProfile, refreshing..."
      );
      refreshUserProperties();
    }
  }, [userProfile?.googleAccountId, refreshUserProperties]);

  // Check onboarding status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await onboarding.getOnboardingStatus();
        console.log("[Dashboard] Onboarding status response:", response);

        // Backend returns { success: true, onboardingCompleted: boolean, hasPropertyIds: boolean }
        if (response.success || response.successful) {
          const isCompleted = response.onboardingCompleted === true;
          setOnboardingCompleted(isCompleted);
          localStorage.setItem("onboardingCompleted", String(isCompleted));

          // Check if properties are actually connected (parsing the JSON if needed)
          let hasProps = false;
          if (response.propertyIds) {
            const props =
              typeof response.propertyIds === "string"
                ? JSON.parse(response.propertyIds)
                : response.propertyIds;

            hasProps = !!(
              props.ga4 ||
              props.gsc ||
              (props.gbp && props.gbp.length > 0)
            );
          }
          setHasProperties(hasProps);
          localStorage.setItem("hasProperties", String(hasProps));

          console.log(
            "[Dashboard] Onboarding completed:",
            response.onboardingCompleted,
            "Has properties:",
            hasProps
          );
        } else {
          // If check fails, assume onboarding is needed
          setOnboardingCompleted(false);
          localStorage.setItem("onboardingCompleted", "false");
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        // Only reset to false if we don't have a cached value
        if (localStorage.getItem("onboardingCompleted") === null) {
          setOnboardingCompleted(false);
        }
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkStatus();
  }, []);

  // Handler for when onboarding is completed
  const handleOnboardingComplete = async () => {
    console.log("[Dashboard] Onboarding completed, showing loading screen");
    // Set to null to show loading screen
    setOnboardingCompleted(null);
    setCheckingOnboarding(true);

    // Wait a moment for the backend to fully complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Refresh user properties from database
    try {
      await refreshUserProperties();
      console.log("[Dashboard] User properties refreshed from database");
    } catch (error) {
      console.error("Failed to refresh user properties:", error);
    }

    // Re-check status to get fresh data
    try {
      const response = await onboarding.getOnboardingStatus();
      console.log("[Dashboard] Re-checked status after completion:", response);
      const isCompleted =
        response.onboardingCompleted === true || response.success === true;
      setOnboardingCompleted(isCompleted);
      localStorage.setItem("onboardingCompleted", String(isCompleted));
      // After simplified onboarding, properties are NOT connected yet
      setHasProperties(false);
      localStorage.setItem("hasProperties", "false");

      // Start the 22-step wizard tour immediately after onboarding
      if (isCompleted) {
        console.log("[Dashboard] Starting wizard tour after onboarding");
        await recheckWizardStatus();
      }
    } catch (error) {
      console.error("Failed to re-check status:", error);
      setOnboardingCompleted(true); // Assume success
    } finally {
      setCheckingOnboarding(false);
    }
  };

  // Placeholder data - replace with actual hook data later
  const ready = true;
  const session = { user: { id: "1", email: "user@example.com" } };
  const clientId = "demo-client-123";
  const clientLoading = false;
  const clientError = null;
  // Fast redirect to sign in if not authenticated
  if (!session) {
    window.location.href = "/signin";
    return null;
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen flex flex-col bg-alloro-bg font-body text-alloro-navy">
      {/* Show loading state while checking onboarding */}
      {!ready || checkingOnboarding ? (
        <div className="flex-1 flex items-center justify-center bg-alloro-bg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-alloro-orange/20 border-t-alloro-orange mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">
              {checkingOnboarding
                ? "Setting things up..."
                : "Loading dashboard..."}
            </p>
          </div>
        </div>
      ) : clientLoading ? (
        <div className="h-full flex items-center justify-center bg-alloro-bg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-alloro-orange/20 border-t-alloro-orange mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Resolving client access...</p>
          </div>
        </div>
      ) : clientError ? (
        <div className="h-full flex items-center justify-center bg-gray-50/50">
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
      ) : !clientId ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50/50">
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
      ) : onboardingCompleted === false ? (
        <div className="p-8">
          <OnboardingContainer onComplete={handleOnboardingComplete} />
        </div>
      ) : onboardingCompleted === true ? (
        !hasProperties && !isWizardActive ? (
          // Empty State - Creative 2-step onboarding flow
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl w-full">
              {/* Welcome header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-alloro-orange/10 rounded-full mb-4">
                  <span className="w-2 h-2 bg-alloro-orange rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-alloro-orange uppercase tracking-wider">Getting Started</span>
                </div>
                <h1 className="text-4xl font-black text-alloro-navy font-heading tracking-tight mb-3">
                  Let's Set Up Your Dashboard
                </h1>
                <p className="text-lg text-slate-500 font-medium">
                  Complete these two steps to unlock your practice insights
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {/* Step 1 - Connect Properties */}
                <div
                  onClick={() => navigate("/settings")}
                  className="group relative bg-white rounded-3xl border-2 border-alloro-orange shadow-xl shadow-alloro-orange/10 p-8 cursor-pointer hover:shadow-2xl hover:shadow-alloro-orange/20 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-6">
                    {/* Step number */}
                    <div className="shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-alloro-orange to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-alloro-orange/30 group-hover:scale-110 transition-transform">
                        <span className="text-2xl font-black text-white">1</span>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-alloro-navy tracking-tight">Connect Your Google Properties</h3>
                        <span className="px-2 py-1 bg-alloro-orange/10 text-alloro-orange text-[10px] font-black uppercase tracking-wider rounded-lg">Required</span>
                      </div>
                      <p className="text-slate-500 font-medium leading-relaxed mb-4">
                        Link your Google Analytics, Search Console, and Business Profile to enable tracking and insights.
                      </p>
                      <div className="flex items-center gap-2 text-alloro-orange font-bold text-sm group-hover:gap-3 transition-all">
                        <Settings className="w-4 h-4" />
                        <span>Go to Settings</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  {/* Decorative arrow */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10">
                    <ChevronDown className="w-4 h-4 text-slate-300" />
                  </div>
                </div>

                {/* Step 2 - PMS Data (Locked) */}
                <div className="relative bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-8 opacity-60">
                  <div className="flex items-start gap-6">
                    {/* Step number */}
                    <div className="shrink-0">
                      <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl font-black text-slate-400">2</span>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-slate-400 tracking-tight">Upload Your PMS Data</h3>
                        <span className="px-2 py-1 bg-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Locked
                        </span>
                      </div>
                      <p className="text-slate-400 font-medium leading-relaxed">
                        Once properties are connected, upload your practice management data to see referral analytics and revenue attribution.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Help text */}
              <p className="text-center text-sm text-slate-400 mt-8">
                Need help? <a href="mailto:support@alloro.io" className="text-alloro-orange font-semibold hover:underline">Contact Support</a>
              </p>
            </div>
          </div>
        ) : (
          // Dashboard Content
          <div className="w-full  mx-auto space-y-8 pb-20">
            <div className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {activeTab === "Dashboard" && (
                    <DashboardOverview
                      googleAccountId={userProfile?.googleAccountId ?? null}
                    />
                  )}

                  {activeTab === "Patient Journey Insights" && (
                    <VitalSignsCards
                      selectedDomain={selectedDomain?.domain || ""}
                    />
                  )}

                  {activeTab === "PMS Statistics" && (
                    <React.Suspense
                      fallback={
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className="bg-white rounded-[32px] p-6 h-48 animate-pulse shadow-sm border border-slate-100"
                            >
                              <div className="h-4 bg-slate-100 rounded-full w-2/3 mb-4"></div>
                              <div className="h-8 bg-slate-100 rounded-full w-1/2 mb-2"></div>
                              <div className="h-32 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl"></div>
                            </div>
                          ))}
                        </div>
                      }
                    >
                      {/* Render PMSVisualPillars when domain is available OR during wizard mode (for demo data) */}
                      {selectedDomain?.domain || isWizardActive ? (
                        <PMSVisualPillars
                          domain={selectedDomain?.domain || ""}
                          googleAccountId={userProfile?.googleAccountId ?? null}
                          hasProperties={hasProperties}
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className="bg-white rounded-[32px] p-6 h-48 animate-pulse shadow-sm border border-slate-100"
                            >
                              <div className="h-4 bg-slate-100 rounded-full w-2/3 mb-4"></div>
                              <div className="h-8 bg-slate-100 rounded-full w-1/2 mb-2"></div>
                              <div className="h-32 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl"></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </React.Suspense>
                  )}

                  {activeTab === "Rankings" && (
                    <RankingsDashboard
                      googleAccountId={userProfile?.googleAccountId ?? null}
                    />
                  )}

                  {activeTab === "Tasks" && (
                    <TasksView
                      googleAccountId={userProfile?.googleAccountId ?? null}
                    />
                  )}

                  {activeTab === "Referral Engine" && (
                    <ReferralEngineDashboard
                      googleAccountId={userProfile?.googleAccountId ?? null}
                    />
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
              }}
            />

            <ClarityIntegrationModal
              isOpen={showClarityModal}
              onClose={() => setShowClarityModal(false)}
              clientId={clientId}
              onSuccess={() => {
                console.log("Clarity integration successful!");
              }}
            />

            <PMSUploadModal
              isOpen={showPMSUpload}
              onClose={() => setShowPMSUpload(false)}
              clientId={clientId}
              onSuccess={() => {
                console.log("PMS upload successful!");
              }}
            />

            {/* Connection Debug Panel */}
            <ConnectionDebugPanel
              isVisible={showDebugPanel}
              onClose={() => setShowDebugPanel(false)}
            />
          </div>
        )
      ) : (
        // Loading state while preparing dashboard after onboarding
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#86b4ef] via-[#a8c9f1] to-[#c0d5f4]">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="w-32 h-32 mx-auto overflow-visible">
                <motion.img
                  src="/alloro-running.png"
                  alt="Alloro Running"
                  className="w-full h-full object-contain drop-shadow-2xl"
                  animate={{ x: [0, 20, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
              <h1 className="text-4xl md:text-5xl font-thin text-gray-800">
                Alloro is preparing your dashboard
              </h1>
              <p className="text-gray-800 font-light text-lg">
                Please wait while we fetch your initial data...
              </p>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
