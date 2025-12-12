import { useState, useEffect } from "react";
import {
  Trophy,
  Star,
  Phone,
  Navigation,
  MousePointer,
  AlertTriangle,
  Rocket,
  Stethoscope,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Type for client GBP data
interface ClientGbpData {
  totalReviewCount?: number;
  averageRating?: number;
  primaryCategory?: string;
  reviewsLast30d?: number;
  postsLast90d?: number;
  photosCount?: number;
  hasWebsite?: boolean;
  hasPhone?: boolean;
  hasHours?: boolean;
  performance?: {
    calls?: number;
    directions?: number;
    clicks?: number;
  };
  _raw?: {
    locations?: Array<{
      displayName?: string;
      data?: {
        performance?: {
          series?: Array<{
            dailyMetricTimeSeries?: Array<{
              dailyMetric: string;
              timeSeries?: {
                datedValues?: Array<{
                  value?: string;
                }>;
              };
            }>;
          }>;
        };
      };
    }>;
  };
}

interface RankingResult {
  id: number;
  domain: string;
  specialty: string;
  location: string | null;
  observedAt: string;
  rankScore: number | string;
  rankPosition: number;
  totalCompetitors: number;
  rankingFactors: {
    category_match: { score: number; weighted: number; weight: number };
    review_count: {
      score: number;
      weighted: number;
      weight: number;
      value?: number;
    };
    star_rating: {
      score: number;
      weighted: number;
      weight: number;
      value?: number;
    };
    keyword_name: { score: number; weighted: number; weight: number };
    review_velocity: {
      score: number;
      weighted: number;
      weight: number;
      value?: number;
    };
    nap_consistency: { score: number; weighted: number; weight: number };
    gbp_activity: {
      score: number;
      weighted: number;
      weight: number;
      value?: number;
    };
    sentiment: { score: number; weighted: number; weight: number };
  } | null;
  rawData: {
    client_gbp: ClientGbpData | null;
    client_gsc: {
      rows?: unknown[];
      topQueries?: unknown[];
      totals?: {
        impressions?: number;
        clicks?: number;
        avgPosition?: number;
      };
    } | null;
    competitors: Array<{
      name: string;
      rankScore: number;
      rankPosition: number;
      totalReviews: number;
      averageRating: number;
      reviewsLast30d?: number;
      primaryCategory?: string;
    }>;
    competitors_discovered?: number;
    competitors_from_cache?: boolean;
  } | null;
  llmAnalysis: {
    gaps: Array<{
      type: string;
      query_class?: string;
      area?: string;
      impact: string;
      reason: string;
    }>;
    drivers: Array<{
      factor: string;
      weight: string | number;
      direction: string;
    }>;
    render_text: string;
    client_summary?: string | null;
    top_recommendations?: Array<{
      priority: number;
      title: string;
    }>;
    verdict: string;
    confidence: number;
  } | null;
}

interface RankingsDashboardProps {
  googleAccountId: number | null;
}

export function RankingsDashboard({ googleAccountId }: RankingsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [latestRanking, setLatestRanking] = useState<RankingResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (googleAccountId) {
      fetchLatestRanking();
    } else {
      setLoading(false);
    }
  }, [googleAccountId]);

  const fetchLatestRanking = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch the latest ranking for this google account
      const response = await fetch(
        `/api/practice-ranking/latest?googleAccountId=${googleAccountId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No ranking found yet
          setLatestRanking(null);
          return;
        }
        throw new Error("Failed to fetch ranking data");
      }

      const data = await response.json();
      setLatestRanking(data.ranking);
    } catch (err) {
      console.error("Error fetching ranking:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load ranking data"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Load Rankings
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchLatestRanking}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!googleAccountId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center max-w-md">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Account Connected
          </h3>
          <p className="text-gray-600">
            Please connect your Google account to view ranking data.
          </p>
        </div>
      </div>
    );
  }

  if (!latestRanking) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center max-w-md">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Ranking Data Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Your practice ranking analysis hasn't been completed yet. Please
            check back later or contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return <PerformanceDashboard result={latestRanking} />;
}

// Helper function to extract performance metrics from raw GBP data
function extractPerformanceMetrics(
  clientGbp: ClientGbpData | null | undefined
) {
  const metrics = { calls: 0, directions: 0, clicks: 0 };

  // First check if we have pre-extracted performance data
  if (clientGbp?.performance) {
    return {
      calls: clientGbp.performance.calls || 0,
      directions: clientGbp.performance.directions || 0,
      clicks: clientGbp.performance.clicks || 0,
    };
  }

  // Otherwise extract from raw time series data
  const rawLocations = clientGbp?._raw?.locations;
  if (!rawLocations || rawLocations.length === 0) return metrics;

  const performanceSeries = rawLocations[0]?.data?.performance?.series;
  if (!performanceSeries || performanceSeries.length === 0) return metrics;

  const dailyMetrics = performanceSeries[0]?.dailyMetricTimeSeries;
  if (!dailyMetrics) return metrics;

  for (const metricData of dailyMetrics) {
    const values = metricData.timeSeries?.datedValues || [];
    const sum = values.reduce((total: number, item: { value?: string }) => {
      return total + (item.value ? parseInt(item.value, 10) : 0);
    }, 0);

    switch (metricData.dailyMetric) {
      case "CALL_CLICKS":
        metrics.calls = sum;
        break;
      case "BUSINESS_DIRECTION_REQUESTS":
        metrics.directions = sum;
        break;
      case "WEBSITE_CLICKS":
        metrics.clicks = sum;
        break;
    }
  }

  return metrics;
}

// Performance Dashboard View Component
function PerformanceDashboard({ result }: { result: RankingResult }) {
  const factors = result.rankingFactors;
  const competitors = result.rawData?.competitors || [];

  // Sort competitors by rankPosition for correct display order
  const sortedCompetitors = [...competitors].sort(
    (a, b) => a.rankPosition - b.rankPosition
  );

  // Calculate market averages from competitors
  const marketAvgRating =
    competitors.length > 0
      ? competitors.reduce((sum, c) => sum + (c.averageRating || 0), 0) /
        competitors.length
      : 4.5;

  // Client metrics
  const clientReviews = result.rawData?.client_gbp?.totalReviewCount || 0;
  const clientRating =
    factors?.star_rating?.value ??
    result.rawData?.client_gbp?.averageRating ??
    0;
  const leaderReviews = sortedCompetitors[0]?.totalReviews || 0;
  const reviewGap = leaderReviews - clientReviews;

  // Performance metrics - extract from raw time series data
  const performance = extractPerformanceMetrics(result.rawData?.client_gbp);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-6 w-6 text-gray-600" />
          <div>
            <h2 className="text-3xl font-thin text-gray-900 mb-1">
              Performance Dashboard
            </h2>
            <p className="text-sm text-gray-500">{result.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {result.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(result.observedAt)}
          </span>
        </div>
      </div>

      {/* KPI Grid - 4 Glass Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Current Rank Position */}
        <div className="rounded-xl border border-white/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm p-4 shadow-lg ring-1 ring-blue-500/20">
          <h3 className="text-sm font-medium text-gray-600">
            Current Rank Position
          </h3>
          <div className="mt-2 text-4xl font-bold text-gray-900">
            #{result.rankPosition ?? "-"}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            of {result.totalCompetitors ?? "-"} Top Competitors
          </div>
        </div>

        {/* Patient Satisfaction */}
        <div className="rounded-xl border border-white/20 bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm p-4 shadow-lg ring-1 ring-green-500/20">
          <h3 className="text-sm font-medium text-gray-600">
            Patient Satisfaction
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {Number(clientRating).toFixed(1)}
            </span>
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Market Avg: {marketAvgRating.toFixed(1)}
          </div>
        </div>

        {/* Total Reviews - Alert Card */}
        <div className="rounded-xl border border-white/20 bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-sm p-4 shadow-lg ring-1 ring-red-500/20">
          <h3 className="text-sm font-medium text-gray-600">Total Reviews</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {clientReviews}
            </span>
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="mt-1 text-sm text-red-600 font-medium">
            Gap: -{reviewGap > 0 ? reviewGap : 0} behind Leader
          </div>
        </div>

        {/* Visibility Score */}
        <div className="rounded-xl border border-white/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm p-4 shadow-lg ring-1 ring-purple-500/20">
          <h3 className="text-sm font-medium text-gray-600">
            Visibility Score
          </h3>
          <div className="mt-2">
            <span className="text-4xl font-bold text-purple-600">
              {Number(result.rankScore).toFixed(0)}
            </span>
            <span className="text-xl text-gray-400"> / 100</span>
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {Number(result.rankScore) >= 80
              ? "Excellent performance"
              : Number(result.rankScore) >= 60
              ? "Good, room to grow"
              : "Needs improvement"}
          </div>
        </div>
      </div>

      {/* Main Row: Your Summary + Patient Engagement */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* Your Summary - 3 columns */}
        <div className="md:col-span-3 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-900 mb-3">
            <Stethoscope className="h-5 w-5" />
            Your Summary
          </h3>
          <div className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
            {result.llmAnalysis?.client_summary ||
              result.llmAnalysis?.render_text ||
              "No summary available."}
          </div>
        </div>

        {/* Patient Engagement - 2 columns */}
        <div className="md:col-span-2 rounded-xl border border-white/20 bg-gradient-to-br from-slate-50 to-white backdrop-blur-sm p-5 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Patient Engagement{" "}
            <span className="text-sm font-normal text-gray-500">(30 Days)</span>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 text-center ring-1 ring-blue-500/10">
              <Phone className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {performance.calls || 0}
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">
                Calls
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4 text-center ring-1 ring-emerald-500/10">
              <Navigation className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {performance.directions || 0}
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">
                Directions
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-4 text-center ring-1 ring-violet-500/10">
              <MousePointer className="h-6 w-6 text-violet-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {performance.clicks || 0}
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">
                Clicks
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Review Gap Table + Action Plan */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* The Review Gap Table - 3 columns */}
        <div className="md:col-span-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Competitors
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-500"></th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">
                    Practice
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">
                    Rank
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">
                    Total Reviews
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">
                    Monthly Pace
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Build display list: top competitors + client
                  const domainBase = result.domain
                    .split(".")[0]
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "");
                  const clientPosition = result.rankPosition;

                  // Filter out the client from competitors using multiple matching strategies
                  const isClientMatch = (name: string) => {
                    const normalizedName = name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "");
                    // Match if domain base is contained in name or vice versa
                    return (
                      normalizedName.includes(domainBase) ||
                      domainBase.includes(normalizedName) ||
                      // Also match if they share significant overlap (e.g., "artful" in both)
                      (domainBase.length > 5 &&
                        normalizedName.includes(domainBase.slice(0, 6)))
                    );
                  };

                  // Get competitors excluding client
                  const filteredCompetitors = sortedCompetitors.filter(
                    (c) => !isClientMatch(c.name)
                  );

                  // Create client entry with business name from GBP if available
                  const clientDisplayName =
                    result.rawData?.client_gbp?._raw?.locations?.[0]
                      ?.displayName || result.domain;
                  const clientEntry = {
                    name: clientDisplayName,
                    rankPosition: clientPosition,
                    totalReviews: clientReviews,
                    reviewsLast30d:
                      result.rawData?.client_gbp?.reviewsLast30d || 0,
                    isClient: true,
                  };

                  // Merge and sort - take top competitors that fit around client position
                  const displayList = [
                    ...filteredCompetitors
                      .slice(0, 5)
                      .map((c) => ({ ...c, isClient: false })),
                    clientEntry,
                  ]
                    .sort((a, b) => a.rankPosition - b.rankPosition)
                    .slice(0, 6); // Show top 6 to include client

                  return displayList.map((comp, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-gray-100 ${
                        comp.isClient ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="py-2 px-2">
                        {comp.rankPosition === 1 && (
                          <span className="text-lg">🥇</span>
                        )}
                        {comp.rankPosition === 2 && (
                          <span className="text-lg">🥈</span>
                        )}
                        {comp.rankPosition === 3 && (
                          <span className="text-lg">🥉</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`font-medium ${
                            comp.isClient ? "text-blue-700" : "text-gray-900"
                          }`}
                        >
                          {comp.name}
                          {comp.isClient && (
                            <span className="ml-1 text-xs text-blue-500">
                              (You)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-medium text-gray-900">
                        #{comp.rankPosition}
                      </td>
                      <td className="py-2 px-2 text-center text-gray-700">
                        {comp.totalReviews}
                      </td>
                      <td className="py-2 px-2 text-center text-gray-700">
                        {comp.reviewsLast30d || 0}/mo
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor's Action Plan - 2 columns */}
        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Rocket className="h-5 w-5 text-red-500" />
            Your Action Plan
          </h3>
          <ol className="space-y-3">
            {result.llmAnalysis?.top_recommendations &&
            result.llmAnalysis.top_recommendations.length > 0 ? (
              result.llmAnalysis.top_recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">
                      {rec.title}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              // Fallback to generated recommendations based on gaps
              <>
                {reviewGap > 50 && (
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                      1
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">
                        Launch Aggressive Review Generation Campaign
                      </span>
                    </div>
                  </li>
                )}
                {(result.rawData?.client_gbp?.postsLast90d || 0) < 4 && (
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                      {reviewGap > 50 ? 2 : 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">
                        Establish Weekly GBP Posting Routine
                      </span>
                    </div>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                    {(reviewGap > 50 ? 1 : 0) +
                      ((result.rawData?.client_gbp?.postsLast90d || 0) < 4
                        ? 1
                        : 0) +
                      1}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">
                      Deploy Local and Review Schema Markup
                    </span>
                  </div>
                </li>
              </>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded bg-gray-200" />
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-40 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-100 to-gray-50 p-4 shadow-sm"
          >
            <div className="h-4 w-28 bg-gray-200 rounded mb-3" />
            <div className="h-10 w-20 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Main Row Skeleton */}
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 rounded" />
            <div className="h-4 w-4/6 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="md:col-span-2 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 p-4 text-center">
                <div className="h-6 w-6 bg-gray-200 rounded mx-auto mb-2" />
                <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-1" />
                <div className="h-3 w-14 bg-gray-200 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3 rounded-xl border border-gray-100 bg-white p-5">
          <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-6 w-6 bg-gray-200 rounded" />
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-12 bg-gray-200 rounded ml-auto" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
                <div className="h-4 w-14 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 rounded-xl border border-gray-100 bg-white p-5">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-6 w-6 bg-gray-200 rounded-full" />
                <div className="h-4 w-56 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RankingsDashboard;
