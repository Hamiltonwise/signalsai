import { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Brain,
  Target,
  Lightbulb,
  Building2,
  Users,
  Eye,
  MousePointer,
  Globe,
  Activity,
  BarChart3,
} from "lucide-react";

// Import auth and integration hooks for domain selection
import { useAuth } from "../hooks/useAuth";
import { useGSC } from "../hooks/useGSC";
import { useGA4 } from "../hooks/useGA4";
import { useGBP } from "../hooks/useGBP";
import { useClarity } from "../hooks/useClarity";

// Dashboard Components
import { KPIPillars } from "../components/KPIPillars";
import { NextBestAction } from "../components/NextBestAction";
import { ConnectionDebugPanel } from "../components/ConnectionDebugPanel";
import { GrowthFocusedKPICard } from "../components/GrowthFocusedKPICard";
import { EnhancedMetricCard } from "../components/EnhancedMetricCard";
import { VitalSignsScore } from "../components/VitalSignsScore";

// Integration Modal Components ✅
import { GBPIntegrationModal } from "../components/GBPIntegrationModal";
import { GSCIntegrationModal } from "../components/GSCIntegrationModal";
import { ClarityIntegrationModal } from "../components/ClarityIntegrationModal";
import { GA4IntegrationModal } from "../components/GA4IntegrationModal";
import { PMSUploadModal } from "../components/PMSUploadModal";
import { VitalSignsCards } from "@/components/VitalSignsCards/VitalSignsCards";
import { MondayTasks } from "../components/Monday/MondayTasks";
import { GoogleConnectButton } from "../components/GoogleConnectButton";
import { GoogleAccountStatus } from "../components/GoogleAccountStatus";

export default function Dashboard() {
  // Domain selection and GSC data hooks
  const { domains, selectedDomain, handleDomainChange } = useAuth();

  const {
    gscData,
    fetchGscData,
    fetchAIReadyGscData,
    aiDataLoading,
    aiError,
    aiData,
    isLoading: gscLoading,
    error: gscError,
  } = useGSC();
  const {
    ga4Data,
    fetchGA4Data,
    fetchAIReadyData: fetchAIReadyGA4Data,
    aiDataLoading: ga4AiDataLoading,
    aiData: ga4AiData,
    aiError: ga4AiError,
    isLoading: ga4Loading,
    error: ga4Error,
  } = useGA4();
  const {
    gbpData,
    fetchGBPData,
    fetchAIReadyData: fetchAIReadyGBPData,
    aiDataLoading: gbpAiDataLoading,
    aiData: gbpAiData,
    aiError: gbpAiError,
    isLoading: gbpLoading,
    error: gbpError,
  } = useGBP();
  const {
    clarityData,
    fetchClarityData,
    fetchAIReadyClarityData,
    aiDataLoading: clarityAiDataLoading,
    aiData: clarityAiData,
    aiError: clarityAiError,
    isLoading: clarityLoading,
    error: clarityError,
  } = useClarity();

  // Fetch all integration data for GSC, GA4, GBP, and Clarity
  const fetchAllIntegrationData = async () => {
    console.log("Refreshing dashboard data for:", selectedDomain);
    if (selectedDomain) {
      // Fetch GSC, GA4, GBP, and Clarity data in parallel
      const promises = [fetchGscData(), fetchClarityData()];

      if (selectedDomain.ga4_propertyId) {
        promises.push(fetchGA4Data(selectedDomain.ga4_propertyId));
      }

      if (selectedDomain.gbp_accountId && selectedDomain.gbp_locationId) {
        promises.push(
          fetchGBPData(
            selectedDomain.gbp_accountId,
            selectedDomain.gbp_locationId
          )
        );
      }

      await Promise.all(promises);
    }
  };

  // Fetch AI Ready Data for GSC, GA4, GBP, and Clarity
  const fetchAllAIReadyData = async () => {
    console.log("Fetching AI Ready Data for:", selectedDomain);
    if (selectedDomain) {
      const promises = [
        fetchAIReadyGscData(),
        fetchAIReadyGA4Data(),
        fetchAIReadyClarityData(),
      ];

      if (selectedDomain.gbp_accountId && selectedDomain.gbp_locationId) {
        promises.push(
          fetchAIReadyGBPData(
            selectedDomain.gbp_accountId,
            selectedDomain.gbp_locationId
          )
        );
      }

      await Promise.all(promises);
    }
  };

  // Modal state management
  const [showGA4Modal, setShowGA4Modal] = useState(false);
  const [showGBPModal, setShowGBPModal] = useState(false);
  const [showGSCModal, setShowGSCModal] = useState(false);
  const [showClarityModal, setShowClarityModal] = useState(false);
  const [showPMSUpload, setShowPMSUpload] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

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

  const pmsData = {
    isLoading: false,
    metrics: {
      totalPatients: 1247,
      selfReferred: 423,
      drReferred: 824,
      totalProduction: 2847500,
      averageProductionPerPatient: 2284,
      monthlyData: [
        { month: "Jan", patients: 98, production: 224000 },
        { month: "Feb", patients: 112, production: 256000 },
        { month: "Mar", patients: 105, production: 238000 },
      ],
      trend: "up" as const,
      changePercent: "+12.5%",
    },
  };

  const vitalSignsAI = {
    isLoading: false,
    analysis: {
      grade: "B+",
      priorityOpportunities: [
        {
          title: "Improve Website Conversion Rate",
          description: "Current conversion rate is below industry average",
          estimatedImpact: "15-20% revenue increase",
          timeframe: "2-3 months",
        },
        {
          title: "Optimize Google Business Profile",
          description: "Increase review response rate and photo uploads",
          estimatedImpact: "10-15% more calls",
          timeframe: "1 month",
        },
      ],
      recentWins: [
        {
          title: "Increased Organic Traffic",
          description: "SEO improvements led to 25% more organic visitors",
          improvement: "+25% organic traffic",
          timeframe: "Last 30 days",
        },
      ],
      recommendations: [
        {
          title: "Add Online Booking System",
          description:
            "Reduce phone call volume and improve patient experience",
          estimatedImpact: "20% more bookings",
          difficulty: "medium" as const,
        },
        {
          title: "Implement Live Chat",
          description: "Capture more leads from website visitors",
          estimatedImpact: "10% more leads",
          difficulty: "easy" as const,
        },
      ],
    },
    refreshAnalysis: () => console.log("Refreshing AI analysis..."),
    getAnalysisAge: () => "2 hours ago",
  };
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
    <div className="h-screen bg-gradient-to-br from-gray-50 to-slate-100 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-full">
        {/* Domain Selector Section */}
        <div className="mb-6">
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
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedDomain?.displayName} Dashboard
              </h1>
              <p className="text-gray-600">
                {vitalSignsAI.analysis
                  ? `AI Analysis: Grade ${vitalSignsAI.analysis.grade} • ${
                      vitalSignsAI.analysis.priorityOpportunities?.length || 0
                    } opportunities identified`
                  : "Comprehensive practice analytics and AI-powered insights"}
              </p>
            </div>
            {vitalSignsAI.analysis && (
              <div className="text-right">
                <button
                  onClick={vitalSignsAI.refreshAnalysis}
                  disabled={vitalSignsAI.isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Brain
                    className={`w-4 h-4 ${
                      vitalSignsAI.isLoading ? "animate-pulse" : ""
                    }`}
                  />
                  {vitalSignsAI.isLoading
                    ? "Analyzing..."
                    : "Refresh AI Analysis"}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {vitalSignsAI.getAnalysisAge()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Vital Signs Card with Patient Journey */}
          {/* <VitalSignsCard
            ga4Data={ga4Integration.metrics}
            gbpData={gbpIntegration.metrics}
            gscData={gscIntegration.metrics}
            clarityData={clarityIntegration.metrics}
            pmsData={pmsData.metrics}
            connectionStatus={{
              ga4: ga4Integration.isConnected,
              gbp: gbpIntegration.isConnected,
              gsc: gscIntegration.isConnected,
              clarity: clarityIntegration.isConnected,
            }}
            aiAnalysis={vitalSignsAI.analysis}
            isLoadingAI={vitalSignsAI.isLoading}
          /> */}

          <VitalSignsCards selectedDomain={selectedDomain?.domain || ""} />

          {/* KPI Pillars */}
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

          {/* Next Best Action */}
          <NextBestAction
            ga4Data={ga4Integration.metrics}
            gbpData={gbpIntegration.metrics}
            gscData={gscIntegration.metrics}
            clarityData={clarityIntegration.metrics}
            pmsData={pmsData.metrics}
            connectionStatus={{
              ga4: ga4Integration.isConnected,
              gbp: gbpIntegration.isConnected,
              gsc: gscIntegration.isConnected,
              clarity: clarityIntegration.isConnected,
            }}
          />

          {/* Monday.com Support Tasks - Moved outside space-y-8 to prevent modal overlay spacing issues */}
          <div className="mb-8">
            <MondayTasks />
          </div>

          {/* Enhanced Metrics Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Key Performance Metrics
              </h2>
              <p className="text-sm text-gray-600">
                Detailed analytics with growth insights
              </p>
            </div>

            {/* Vital Signs Score - Overall Practice Health */}
            <VitalSignsScore
              score={82}
              monthlyChange={8.5}
              trend="up"
              lastMonthData={{
                month: "November",
                score: 76,
                breakdown: {
                  ga4Score: ga4Integration.metrics.calculatedScore,
                  gbpScore: gbpIntegration.metrics.calculatedScore,
                  gscScore: gscIntegration.metrics.calculatedScore,
                  clarityScore: clarityIntegration.metrics.calculatedScore,
                  pmsScore: 88,
                },
              }}
            />

            {/* Growth-Focused KPI Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GrowthFocusedKPICard
                title="Website Traffic"
                description="Total users visiting your website"
                value={ga4Integration.metrics.totalUsers.toLocaleString()}
                trend="up"
                changePercent={15.2}
                icon={Users}
                isConnected={ga4Integration.isConnected}
                color="bg-blue-500"
                last12MonthsData={[
                  2100, 2250, 2400, 2300, 2500, 2650, 2800, 2750, 2900, 2850,
                  2847, 3000,
                ]}
              />

              <GrowthFocusedKPICard
                title="Google Business Views"
                description="Profile views on Google Business"
                value={gbpIntegration.metrics.totalViews.toLocaleString()}
                trend="up"
                changePercent={8.7}
                icon={Eye}
                isConnected={gbpIntegration.isConnected}
                color="bg-green-500"
                last12MonthsData={[
                  12000, 12500, 13200, 13800, 14100, 14600, 14900, 15100, 15200,
                  15300, 15420, 15800,
                ]}
              />
            </div>

            {/* Enhanced Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <EnhancedMetricCard
                title="Website Conversions"
                value={ga4Integration.metrics.conversions.toString()}
                change="+12.3%"
                trend="up"
                icon={MousePointer}
                color="bg-indigo-500"
                dataSource="GA4"
                description="Goal completions this month"
                showSubMetrics={true}
                subMetrics={[
                  {
                    label: "Conversion Rate",
                    value: "4.98%",
                    previousValue: "4.44%",
                    change: 12.2,
                  },
                  {
                    label: "Avg. Session Duration",
                    value: "4:05",
                    description: "Time spent on site",
                  },
                ]}
              />

              <EnhancedMetricCard
                title="Search Impressions"
                value={
                  (gscIntegration.metrics.totalImpressions / 1000).toFixed(1) +
                  "K"
                }
                change="+5.8%"
                trend="up"
                icon={Globe}
                color="bg-red-500"
                dataSource="GSC"
                description="Times your site appeared in search"
                showSubMetrics={true}
                subMetrics={[
                  {
                    label: "Click-through Rate",
                    value: gscIntegration.metrics.averageCTR.toFixed(1) + "%",
                    change: 2.1,
                  },
                  {
                    label: "Avg. Position",
                    value: gscIntegration.metrics.averagePosition.toFixed(1),
                    description: "Average ranking position",
                  },
                ]}
              />

              <EnhancedMetricCard
                title="User Sessions"
                value={clarityIntegration.metrics.totalSessions.toLocaleString()}
                change="+18.5%"
                trend="up"
                icon={Activity}
                color="bg-purple-500"
                dataSource="Clarity"
                description="User behavior sessions tracked"
                showSubMetrics={true}
                subMetrics={[
                  {
                    label: "Bounce Rate",
                    value:
                      clarityIntegration.metrics.bounceRate.toFixed(1) + "%",
                    change: -3.2,
                  },
                  {
                    label: "Dead Clicks",
                    value: clarityIntegration.metrics.deadClicks.toString(),
                    description: "Non-functional clicks detected",
                  },
                ]}
              />

              <EnhancedMetricCard
                title="Patient Production"
                value={
                  "$" +
                  (pmsData.metrics.totalProduction / 1000).toFixed(0) +
                  "K"
                }
                change={pmsData.metrics.changePercent}
                trend="up"
                icon={BarChart3}
                color="bg-emerald-500"
                description="Total practice revenue"
                showSubMetrics={true}
                subMetrics={[
                  {
                    label: "Total Patients",
                    value: pmsData.metrics.totalPatients.toLocaleString(),
                    change: 8.3,
                  },
                  {
                    label: "Avg. per Patient",
                    value:
                      "$" +
                      pmsData.metrics.averageProductionPerPatient.toLocaleString(),
                    description: "Revenue per patient",
                  },
                ]}
              />
            </div>
          </div>

          {/* Integration Modals Test Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">
              Integration Management
            </h3>
            <p className="text-gray-600 mb-4">
              Connect and manage your practice integrations
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <button
                onClick={() => setShowGA4Modal(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Globe className="w-4 h-4" />
                GA4 Setup
              </button>
              <button
                onClick={() => setShowGBPModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Building2 className="w-4 h-4" />
                GBP Setup
              </button>
              <button
                onClick={() => setShowGSCModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                GSC Setup
              </button>
              <button
                onClick={() => setShowClarityModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <MousePointer className="w-4 h-4" />
                Clarity Setup
              </button>
              <button
                onClick={() => setShowPMSUpload(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                PMS Upload
              </button>
            </div>

            {/* Google OAuth Testing Section */}
            <div className="mt-6 space-y-4">
              <h4 className="text-md font-semibold text-gray-900">
                Google OAuth (Testing)
              </h4>
              <GoogleAccountStatus />
              <GoogleConnectButton
                variant="outline"
                size="md"
                className="w-full max-w-xs"
              />
            </div>
          </div>

          {/* PMS Data Visuals - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TODO: Replace with PMSMetricsChart component */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">
                PMS Metrics Chart (Placeholder)
              </h3>
              <p className="text-gray-600 mb-4">
                PMSMetricsChart component will display patient metrics here
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Patients:</span>
                  <span className="font-medium">
                    {pmsData.metrics.totalPatients.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Total Production:
                  </span>
                  <span className="font-medium">
                    ${pmsData.metrics.totalProduction.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Trend:</span>
                  <span className="font-medium text-green-600">
                    {pmsData.metrics.changePercent}
                  </span>
                </div>
              </div>
            </div>

            {/* TODO: Replace with ReferralSourcesMatrix component */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">
                Referral Sources Matrix (Placeholder)
              </h3>
              <p className="text-gray-600 mb-4">
                ReferralSourcesMatrix component will display referral data here
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Self Referred:</span>
                  <span className="font-medium">
                    {pmsData.metrics.selfReferred.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Doctor Referred:
                  </span>
                  <span className="font-medium">
                    {pmsData.metrics.drReferred.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Summary */}
          {vitalSignsAI.analysis && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Brain className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    AI Practice Insights
                    {vitalSignsAI.isLoading && (
                      <span className="ml-2 text-sm text-blue-600">
                        Updating...
                      </span>
                    )}
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Overall Grade:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {vitalSignsAI.analysis.grade}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Priority Opportunities */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-600" />
                    Priority Opportunities (
                    {(vitalSignsAI.analysis.priorityOpportunities || []).length}
                    )
                  </h3>
                  <div className="space-y-3">
                    {(vitalSignsAI.analysis.priorityOpportunities || []).map(
                      (opportunity, index) => (
                        <div
                          key={index}
                          className="bg-red-50 border border-red-200 rounded-lg p-4"
                        >
                          <h4 className="font-medium text-red-900 mb-1">
                            {opportunity.title}
                          </h4>
                          <p className="text-sm text-red-800 mb-2">
                            {opportunity.description}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-red-700 font-medium">
                              {opportunity.estimatedImpact}
                            </span>
                            <span className="text-red-600">
                              {opportunity.timeframe}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                    {(vitalSignsAI.analysis.priorityOpportunities || [])
                      .length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">
                          No priority opportunities identified
                        </p>
                        <p className="text-xs">
                          AI analysis may still be processing
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Wins */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Recent Wins (
                    {(vitalSignsAI.analysis.recentWins || []).length})
                  </h3>
                  <div className="space-y-3">
                    {(vitalSignsAI.analysis.recentWins || []).map(
                      (win, index) => (
                        <div
                          key={index}
                          className="bg-green-50 border border-green-200 rounded-lg p-4"
                        >
                          <h4 className="font-medium text-green-900 mb-1">
                            {win.title}
                          </h4>
                          <p className="text-sm text-green-800 mb-2">
                            {win.description}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-green-700 font-medium">
                              {win.improvement}
                            </span>
                            <span className="text-green-600">
                              {win.timeframe}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                    {(vitalSignsAI.analysis.recentWins || []).length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No recent wins identified</p>
                        <p className="text-xs">
                          Connect more integrations for insights
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    AI Recommendations (
                    {(vitalSignsAI.analysis.recommendations || []).length})
                  </h3>
                  <div className="space-y-3">
                    {(vitalSignsAI.analysis.recommendations || []).map(
                      (rec, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                        >
                          <h4 className="font-medium text-blue-900 mb-1">
                            {rec.title}
                          </h4>
                          <p className="text-sm text-blue-800 mb-2">
                            {rec.description}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-blue-700 font-medium">
                              {rec.estimatedImpact}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full ${
                                rec.difficulty === "easy"
                                  ? "bg-green-100 text-green-700"
                                  : rec.difficulty === "medium"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {rec.difficulty}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                    {(vitalSignsAI.analysis.recommendations || []).length ===
                      0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No recommendations available</p>
                        <p className="text-xs">AI is analyzing your data</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
    </div>
  );
}
