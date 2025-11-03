import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAgentData } from "../../hooks/useAgentData";
import { useAuth } from "../../hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { fetchPmsKeyData, type PmsKeyDataResponse } from "../../api/pms";

interface DashboardOverviewProps {
  googleAccountId?: number | null;
}

export function DashboardOverview({ googleAccountId }: DashboardOverviewProps) {
  const { userProfile } = useAuth();
  const { data, loading, error, refetch } = useAgentData(
    googleAccountId || null
  );

  // PMS data state
  const [pmsData, setPmsData] = useState<PmsKeyDataResponse["data"] | null>(
    null
  );
  const [pmsLoading, setPmsLoading] = useState(true);
  const [pmsError, setPmsError] = useState<string | null>(null);

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
        {/* Fresh Insight Card - Proofline Data */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 shadow-sm">
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
                  <span className="text-xs text-blue-600">
                    Confidence:{" "}
                    {((prooflineData.confidence || 0) * 100).toFixed(0)}%
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

              <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium py-2.5 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2">
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
          <span className="text-sm text-green-600 font-medium">
            All sections trending positively
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Awareness */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">+8%</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                Growing
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Awareness
            </h3>
            <p className="text-xs text-gray-600">How patients discover you</p>
          </div>

          {/* Research */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">-3%</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                Declining
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Research
            </h3>
            <p className="text-xs text-gray-600">
              Website engagement & content
            </p>
          </div>

          {/* Consideration */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">+15%</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                Growing
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Consideration
            </h3>
            <p className="text-xs text-gray-600">Reviews & local reputation</p>
          </div>

          {/* Decision */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">-8%</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                Declining
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Decision
            </h3>
            <p className="text-xs text-gray-600">Booking & conversion</p>
          </div>

          {/* Loyalty */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">+5%</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                Growing
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
                  Monthly Summary —{" "}
                  {data?.agents?.summary?.dateStart
                    ? new Date(
                        data.agents.summary.dateStart
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })
                    : "Latest"}
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

            {/* Next Steps Section */}
            {opportunityData?.opportunities &&
              opportunityData.opportunities.length > 0 && (
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
                    {opportunityData.opportunities.map(
                      (
                        opp: {
                          title: string;
                          urgency: string;
                          category: string;
                          explanation: string;
                        },
                        index: number
                      ) => (
                        <div
                          key={index}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {opp.title}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                opp.urgency === "Immediate"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {opp.urgency}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {opp.explanation}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Category: {opp.category}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Attribution Footer */}
            {summaryData?.citations && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Confidence:</span>
                    <span className="ml-2">
                      {((summaryData.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Citations:</span>
                    <span className="ml-2">
                      {summaryData.citations.length} sources
                    </span>
                  </div>
                </div>
              </div>
            )}
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
