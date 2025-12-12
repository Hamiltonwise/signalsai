import { useState, useEffect } from "react";
import { AlertTriangle, Building2, Settings } from "lucide-react";

// Import auth and integration hooks for domain selection
import { useAuth } from "../hooks/useAuth";
import { useGoogleAuthContext } from "../contexts/googleAuthContext";

// Dashboard Components
import { ConnectionDebugPanel } from "../components/ConnectionDebugPanel";
import { DashboardOverview } from "../components/dashboard/DashboardOverview";
import { ReferralEngineDashboard } from "../components/ReferralEngineDashboard";
import { RankingsDashboard } from "../components/dashboard/RankingsDashboard";

// Integration Modal Components ✅
import { GBPIntegrationModal } from "../components/GBPIntegrationModal";
import { GSCIntegrationModal } from "../components/GSCIntegrationModal";
import { ClarityIntegrationModal } from "../components/ClarityIntegrationModal";
import { GA4IntegrationModal } from "../components/GA4IntegrationModal";
import { PMSUploadModal } from "../components/PMS/PMSUploadModal";
import { PMSVisualPillars } from "../components/PMS/PMSVisualPillars";
import { VitalSignsCards } from "@/components/VitalSignsCards/VitalSignsCards";
import { TasksView } from "../components/tasks/TasksView";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

// Onboarding Components
import { OnboardingContainer } from "../components/onboarding/OnboardingContainer";
import onboarding from "../api/onboarding";
import { Sidebar } from "../components/Sidebar";

export default function Dashboard() {
  // Domain selection and auth hooks
  const { selectedDomain, userProfile, refreshUserProperties } = useAuth();
  const { disconnect } = useGoogleAuthContext();

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

  // Onboarding state
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);
  const [hasProperties, setHasProperties] = useState<boolean>(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

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

  // Check onboarding status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await onboarding.getOnboardingStatus();
        console.log("[Dashboard] Onboarding status response:", response);

        // Backend returns { success: true, onboardingCompleted: boolean, hasPropertyIds: boolean }
        if (response.success || response.successful) {
          setOnboardingCompleted(response.onboardingCompleted === true);

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

          console.log(
            "[Dashboard] Onboarding completed:",
            response.onboardingCompleted,
            "Has properties:",
            hasProps
          );
        } else {
          // If check fails, assume onboarding is needed
          setOnboardingCompleted(false);
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        // Assume onboarding is needed if check fails
        setOnboardingCompleted(false);
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
      setOnboardingCompleted(
        response.onboardingCompleted === true || response.success === true
      );
      // After simplified onboarding, properties are NOT connected yet
      setHasProperties(false);
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
    <div className="min-h-screen p-3 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] flex gap-6">
        {/* Detached Glass Sidebar */}
        <Sidebar
          userProfile={userProfile}
          onboardingCompleted={onboardingCompleted}
          disconnect={disconnect}
          selectedDomain={selectedDomain}
        />

        {/* Main glass content area */}
        <main className="flex-1 glass rounded-3xl overflow-hidden">
          {/* Show loading state while checking onboarding */}
          {!ready || checkingOnboarding ? (
            <div className="h-full flex items-center justify-center bg-gray-50/50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {checkingOnboarding
                    ? "Checking your setup..."
                    : "Loading dashboard..."}
                </p>
              </div>
            </div>
          ) : clientLoading ? (
            <div className="h-full flex items-center justify-center bg-gray-50/50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Resolving client access...</p>
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
            <div className="h-full flex items-center justify-center bg-gray-50/50">
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
            <OnboardingContainer onComplete={handleOnboardingComplete} />
          ) : onboardingCompleted === true ? (
            !hasProperties ? (
              // Empty State
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <Settings className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Connect Your Properties
                </h2>
                <p className="text-gray-600 max-w-md mb-8">
                  Welcome to Alloro! To get started, please connect your Google
                  Analytics, Search Console, and Business Profile in Settings.
                </p>
                <button
                  onClick={() => navigate("/settings")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Go to Settings
                </button>
              </div>
            ) : (
              // Dashboard Content
              <div className="px-4 sm:px-6 lg:px-8 py-6">
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

                      {activeTab === "PMS Statistics" && <PMSVisualPillars />}

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
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#86b4ef] via-[#a8c9f1] to-[#c0d5f4]">
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
        </main>
      </div>
    </div>
  );
}
