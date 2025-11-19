import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgentData } from "../../hooks/useAgentData";
import { useAuth } from "../../hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { fetchPmsKeyData, type PmsKeyDataResponse } from "../../api/pms";
import { fetchClientTasks } from "../../api/tasks";
import type { ActionItem } from "../../types/tasks";
import { useGSC } from "../../hooks/useGSC";
import { useGA4 } from "../../hooks/useGA4";
import { useClarity } from "../../hooks/useClarity";
import { useGBP } from "../../hooks/useGBP";
import { NotificationWidget } from "./NotificationWidget";

interface DashboardOverviewProps {
  googleAccountId?: number | null;
}

export function DashboardOverview({ googleAccountId }: DashboardOverviewProps) {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { data, loading, error, refetch } = useAgentData(
    googleAccountId || null
  );

  // Analytics hooks for Patient Journey data
  const { gscData, isLoading: gscLoading } = useGSC();
  const { ga4Data, isLoading: ga4Loading } = useGA4();
  const { clarityData, isLoading: clarityLoading } = useClarity();
  const { gbpData, isLoading: gbpLoading } = useGBP();

  // PMS data state
  const [pmsData, setPmsData] = useState<PmsKeyDataResponse["data"] | null>(
    null
  );
  const [pmsLoading, setPmsLoading] = useState(true);
  const [pmsError, setPmsError] = useState<string | null>(null);

  // Tasks data state
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [allUserTasks, setAllUserTasks] = useState<ActionItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // Fetch PMS data
  useEffect(() => {
    const loadPmsData = async () => {
      const domain = userProfile?.domainName;
      if (!domain) {
        setPmsLoading(false);
        return;
      }

      setPmsLoading(true);
      setPmsError(null);

      try {
        const response = await fetchPmsKeyData(domain);
        if (response?.success && response.data) {
          setPmsData(response.data);
        } else {
          setPmsError(
            response?.error || response?.message || "Failed to load PMS data"
          );
        }
      } catch (err) {
        setPmsError(
          err instanceof Error ? err.message : "Failed to load PMS data"
        );
      } finally {
        setPmsLoading(false);
      }
    };

    loadPmsData();
  }, [userProfile?.domainName]);

  // Fetch tasks data
  useEffect(() => {
    const loadTasks = async () => {
      if (!googleAccountId) {
        setTasksLoading(false);
        return;
      }

      setTasksLoading(true);
      setTasksError(null);

      try {
        const response = await fetchClientTasks(googleAccountId);
        if (response?.success && response.tasks) {
          // Combine ALLORO and USER tasks, filter for OPPORTUNITY agent type
          const allTasks = [...response.tasks.ALLORO, ...response.tasks.USER];
          const opportunityTasks = allTasks.filter(
            (task) => task.agent_type === "OPPORTUNITY"
          );
          setTasks(opportunityTasks);

          // Store all tasks for count calculation
          setAllUserTasks(response.tasks.USER);
        } else {
          setTasksError("Failed to load tasks");
        }
      } catch (err) {
        setTasksError(
          err instanceof Error ? err.message : "Failed to load tasks"
        );
      } finally {
        setTasksLoading(false);
      }
    };

    loadTasks();
  }, [googleAccountId]);

  // Calculate PMS metrics from latest month
  const calculatePmsMetrics = () => {
    if (!pmsData?.months || pmsData.months.length === 0) {
      return null;
    }

    const latestMonth = pmsData.months[pmsData.months.length - 1];
    const previousMonth =
      pmsData.months.length > 1
        ? pmsData.months[pmsData.months.length - 2]
        : null;

    const calculatePercentChange = (
      current: number,
      previous: number | undefined
    ) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const totalReferrals = latestMonth.totalReferrals || 0;
    const selfReferrals = latestMonth.selfReferrals || 0;
    const doctorReferrals = latestMonth.doctorReferrals || 0;
    const production = latestMonth.productionTotal || 0;

    return {
      totalReferrals,
      selfReferrals,
      doctorReferrals,
      production,
      month: latestMonth.month,
      referralChange: calculatePercentChange(
        totalReferrals,
        previousMonth?.totalReferrals
      ),
      selfReferralChange: calculatePercentChange(
        selfReferrals,
        previousMonth?.selfReferrals
      ),
      doctorReferralChange: calculatePercentChange(
        doctorReferrals,
        previousMonth?.doctorReferrals
      ),
      productionChange: calculatePercentChange(
        production,
        previousMonth?.productionTotal
      ),
    };
  };

  const pmsMetrics = calculatePmsMetrics();

  // Format month label
  const formatMonthLabel = (monthStr: string) => {
    try {
      const date = new Date(`${monthStr}-01`);
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return monthStr;
    }
  };

  // Calculate percentage change helper
  const calculatePercentChange = (currMonth: number, prevMonth: number) => {
    if (!prevMonth || prevMonth === 0) return 0;
    return ((currMonth - prevMonth) / prevMonth) * 100;
  };

  // Calculate Patient Journey Health metrics
  const calculateJourneyMetrics = () => {
    // Awareness - GSC clicks and impressions
    const awarenessChange = gscData?.clicks
      ? calculatePercentChange(
          gscData.clicks.currMonth,
          gscData.clicks.prevMonth
        )
      : 0;

    // Research - Clarity bounce rate (lower is better, so invert)
    const researchChange = clarityData?.bounceRate
      ? -calculatePercentChange(
          clarityData.bounceRate.currMonth,
          clarityData.bounceRate.prevMonth
        )
      : 0;

    // Consideration - GBP reviews
    const considerationChange = gbpData?.newReviews
      ? calculatePercentChange(
          gbpData.newReviews.currMonth,
          gbpData.newReviews.prevMonth
        )
      : 0;

    // Decision - GBP call clicks
    const decisionChange = gbpData?.callClicks
      ? calculatePercentChange(
          gbpData.callClicks.currMonth,
          gbpData.callClicks.prevMonth
        )
      : 0;

    // Loyalty - GA4 engagement rate
    const loyaltyChange = ga4Data?.engagementRate
      ? calculatePercentChange(
          ga4Data.engagementRate.currMonth,
          ga4Data.engagementRate.prevMonth
        )
      : 0;

    return {
      awareness: awarenessChange,
      research: researchChange,
      consideration: considerationChange,
      decision: decisionChange,
      loyalty: loyaltyChange,
    };
  };

  const journeyMetrics = calculateJourneyMetrics();

  // Check if any data is still loading
  const analyticsLoading =
    gscLoading || ga4Loading || clarityLoading || gbpLoading;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded-2xl"></div>
            <div className="h-48 bg-gray-200 rounded-2xl"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-700 mb-4">Failed to load agent data: {error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // Extract agent data with type guards
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prooflineData = data?.agents?.proofline?.results?.[0] as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summaryData = data?.agents?.summary?.results?.[0] as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opportunityData = data?.agents?.opportunity?.results?.[0] as any;

  // Format time ago
  const formatTimeAgo = (dateString: string | undefined) => {
    if (!dateString) return "Unknown";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-normal text-gray-900">
            Hi Dr. {userProfile?.lastName || "Smith"}
          </h1>
          <button
            onClick={refetch}
            disabled={loading}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        <p className="text-base text-gray-600">
          Your practice runs itself. Focus on patients.
        </p>
      </div>

      {/* Top Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fresh Insight Card - Notification Widget + Proofline Data */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 shadow-sm">
          {/* Notification Widget - Above Proofline */}
          <div className="mb-4">
            <NotificationWidget googleAccountId={googleAccountId ?? null} />
          </div>

          {prooflineData ? (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {prooflineData.title}
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {prooflineData.explanation}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-blue-700 font-medium">
                    Updated{" "}
                    {formatTimeAgo(data?.agents?.proofline?.lastUpdated)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No proofline data available yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Data will appear after the first agent run completes.
              </p>
            </div>
          )}
        </div>

        {/* PMS Upload Data Card - Dynamic */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Latest Practice Data
                <span className="ml-2 text-sm font-normal text-pink-600">
                  PMS DATA
                </span>
              </h3>
              <p className="text-sm text-gray-600">
                Monthly summary from your practice management system
              </p>
            </div>
          </div>

          {pmsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading practice data...</p>
            </div>
          ) : pmsError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600 mb-1">
                Failed to load PMS data
              </p>
              <p className="text-xs text-gray-500">{pmsError}</p>
            </div>
          ) : pmsMetrics ? (
            <div className="space-y-3">
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-2">
                  Monthly Summary - {formatMonthLabel(pmsMetrics.month)}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-gray-900">
                        {pmsMetrics.totalReferrals.toLocaleString()}
                      </span>
                      {pmsMetrics.referralChange !== 0 && (
                        <span
                          className={`text-xs font-medium ${
                            pmsMetrics.referralChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {pmsMetrics.referralChange >= 0 ? "+" : ""}
                          {pmsMetrics.referralChange.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">Total Referrals</p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-gray-900">
                        {pmsMetrics.selfReferrals.toLocaleString()}
                      </span>
                      {pmsMetrics.selfReferralChange !== 0 && (
                        <span
                          className={`text-xs font-medium ${
                            pmsMetrics.selfReferralChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {pmsMetrics.selfReferralChange >= 0 ? "+" : ""}
                          {pmsMetrics.selfReferralChange.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">Self Referrals</p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-gray-900">
                        ${(pmsMetrics.production / 1000).toFixed(0)}K
                      </span>
                      {pmsMetrics.productionChange !== 0 && (
                        <span
                          className={`text-xs font-medium ${
                            pmsMetrics.productionChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {pmsMetrics.productionChange >= 0 ? "+" : ""}
                          {pmsMetrics.productionChange.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">Production</p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-gray-900">
                        {pmsMetrics.doctorReferrals.toLocaleString()}
                      </span>
                      {pmsMetrics.doctorReferralChange !== 0 && (
                        <span
                          className={`text-xs font-medium ${
                            pmsMetrics.doctorReferralChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {pmsMetrics.doctorReferralChange >= 0 ? "+" : ""}
                          {pmsMetrics.doctorReferralChange.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">Doctor Referrals</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-purple-600">
                  {pmsData?.stats?.latestJobTimestamp
                    ? `Updated ${new Date(
                        pmsData.stats.latestJobTimestamp
                      ).toLocaleDateString()}`
                    : "Data available"}
                </span>
              </div>

              <button
                onClick={() => navigate("/pmsStatistics")}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium py-2.5 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              >
                View Full PMS Report
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No practice data available yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Upload PMS data to see your practice metrics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Patient Journey Health Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Patient Journey Health
          </h2>
          {analyticsLoading ? (
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading metrics...
            </span>
          ) : (
            <></>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Awareness - GSC Clicks */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${
                    journeyMetrics.awareness >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {journeyMetrics.awareness >= 0 ? "+" : ""}
                  {journeyMetrics.awareness.toFixed(0)}%
                </span>
                {journeyMetrics.awareness >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                {journeyMetrics.awareness >= 0 ? "Growing" : "Declining"}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Awareness
            </h3>
            <p className="text-xs text-gray-600">How patients discover you</p>
          </div>

          {/* Research - Clarity Bounce Rate (inverted) */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${
                    journeyMetrics.research >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {journeyMetrics.research >= 0 ? "+" : ""}
                  {journeyMetrics.research.toFixed(0)}%
                </span>
                {journeyMetrics.research >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                {journeyMetrics.research >= 0 ? "Growing" : "Declining"}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Research
            </h3>
            <p className="text-xs text-gray-600">
              Website engagement & content
            </p>
          </div>

          {/* Consideration - GBP Reviews */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${
                    journeyMetrics.consideration >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {journeyMetrics.consideration >= 0 ? "+" : ""}
                  {journeyMetrics.consideration.toFixed(0)}%
                </span>
                {journeyMetrics.consideration >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                {journeyMetrics.consideration >= 0 ? "Growing" : "Declining"}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Consideration
            </h3>
            <p className="text-xs text-gray-600">Reviews & local reputation</p>
          </div>

          {/* Decision - GBP Call Clicks */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${
                    journeyMetrics.decision >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {journeyMetrics.decision >= 0 ? "+" : ""}
                  {journeyMetrics.decision.toFixed(0)}%
                </span>
                {journeyMetrics.decision >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                {journeyMetrics.decision >= 0 ? "Growing" : "Declining"}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Decision
            </h3>
            <p className="text-xs text-gray-600">Booking & conversion</p>
          </div>

          {/* Loyalty - GA4 Engagement Rate */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${
                    journeyMetrics.loyalty >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {journeyMetrics.loyalty >= 0 ? "+" : ""}
                  {journeyMetrics.loyalty.toFixed(0)}%
                </span>
                {journeyMetrics.loyalty >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                {journeyMetrics.loyalty >= 0 ? "Growing" : "Declining"}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Loyalty
            </h3>
            <p className="text-xs text-gray-600">Retention & referrals</p>
          </div>
        </div>
      </div>

      {/* Monthly Summary Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        {summaryData || opportunityData ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Monthly Summary
                </h2>
                <p className="text-sm text-gray-600">
                  15-second snapshot of key changes
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Generated</p>
                <p className="text-sm font-medium text-purple-600">
                  {formatTimeAgo(data?.agents?.summary?.lastUpdated)}
                </p>
              </div>
            </div>

            {/* Wins Section */}
            {summaryData?.wins && summaryData.wins.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Wins:
                  </h3>
                </div>
                <div className="space-y-2">
                  {summaryData.wins.map((win: string, index: number) => (
                    <div
                      key={index}
                      className="bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                      <p className="text-sm text-gray-700">{win}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks Section */}
            {summaryData?.risks && summaryData.risks.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 text-sm">!</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Risks:
                  </h3>
                </div>
                <div className="space-y-2">
                  {summaryData.risks.map((risk: string, index: number) => (
                    <div
                      key={index}
                      className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                    >
                      <p className="text-sm text-gray-700">{risk}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps Section - Now using approved tasks from database */}
            {tasksLoading ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm">→</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Next Steps:
                  </h3>
                </div>
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading tasks...</p>
                </div>
              </div>
            ) : tasksError ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm">→</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Next Steps:
                  </h3>
                </div>
                <div className="text-center py-4">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-600">{tasksError}</p>
                </div>
              </div>
            ) : tasks.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm">→</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Next Steps:
                  </h3>
                </div>
                <div className="space-y-2">
                  {tasks.map((task) => {
                    // Parse metadata to get urgency
                    let urgency = "Normal";
                    try {
                      const metadata =
                        typeof task.metadata === "string"
                          ? JSON.parse(task.metadata)
                          : task.metadata;
                      urgency = metadata?.urgency || "Normal";
                    } catch {
                      // If parsing fails, use default
                    }

                    return (
                      <div
                        key={task.id}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {task.title}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              urgency === "Immediate"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {urgency}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-700">
                            {task.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Category: {task.category}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* View all action items link */}
                {allUserTasks.length > 0 && (
                  <button
                    onClick={() => navigate("/tasks")}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 hover:gap-2 transition-all"
                  >
                    <span>
                      View {allUserTasks.length} action item
                      {allUserTasks.length !== 1 ? "s" : ""}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No summary data available yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Monthly summaries will appear after the first monthly agent run.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
