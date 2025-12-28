import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Phone,
  Navigation,
  MousePointer,
  AlertTriangle,
  Stethoscope,
  MapPin,
  AlertCircle,
  Building2,
  RefreshCw,
  LayoutGrid,
  ArrowUpRight,
  ClipboardList,
  CheckCircle2,
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
  gbpLocationId?: string;
  gbpLocationName?: string;
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
  gbpLocationId?: string | null;
  gbpLocationName?: string | null;
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
      description?: string;
      expected_outcome?: string;
    }>;
    verdict: string;
    confidence: number;
  } | null;
  // Previous analysis data for trend comparison
  previousAnalysis: {
    id: number;
    observedAt: string;
    rankScore: number | string;
    rankPosition: number;
    totalCompetitors: number;
    rawData: {
      client_gbp: ClientGbpData | null;
    } | null;
  } | null;
}

// Ranking Task from the tasks endpoint (approved tasks only)
interface RankingTask {
  id: number;
  title: string;
  description: string;
  status: string;
  category: string;
  agentType: string;
  isApproved: boolean;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  metadata: {
    practiceRankingId: number | null;
    gbpLocationId: string | null;
    gbpLocationName: string | null;
    priority: string | null;
    impact: string | null;
    effort: string | null;
    timeline: string | null;
  };
}

interface RankingsDashboardProps {
  googleAccountId: number | null;
}

// KPICard Component - Matching newdesign
const KPICard = ({
  label,
  value,
  sub,
  trend,
  dir,
  rating,
  suffix,
  warning,
}: {
  label: string;
  value: string | number;
  sub: string;
  trend?: string;
  dir?: "up" | "down";
  rating?: boolean;
  suffix?: string;
  warning?: boolean;
}) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-premium flex flex-col transition-all hover:shadow-xl group">
    <div className="flex justify-between items-start mb-6">
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
        {label}
      </span>
      {trend && (
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded border tabular-nums ${
            dir === "up"
              ? "bg-green-50 text-green-700 border-green-200"
              : dir === "down"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-slate-50 text-slate-600 border-slate-200"
          }`}
        >
          {dir === "up" && "+"}
          {trend}
        </span>
      )}
    </div>

    <div className="flex items-baseline gap-1 mb-2">
      <span className="text-3xl sm:text-4xl font-bold font-heading text-alloro-navy tracking-tighter leading-none tabular-nums">
        {value}
      </span>
      {suffix && (
        <span className="text-sm font-semibold text-slate-300 ml-0.5">
          {suffix}
        </span>
      )}
      {rating && (
        <Star size={18} className="text-amber-500 fill-amber-500 ml-1.5 mb-1" />
      )}
      {warning && (
        <AlertTriangle
          size={18}
          className="text-amber-600 ml-1.5 mb-1 animate-pulse"
        />
      )}
    </div>

    <div className="mt-auto text-[11px] font-semibold text-slate-500 leading-tight tracking-tight">
      {sub}
    </div>
  </div>
);

export function RankingsDashboard({ googleAccountId }: RankingsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<RankingResult[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [rankingTasks, setRankingTasks] = useState<
    Record<number, RankingTask[]>
  >({});

  useEffect(() => {
    if (googleAccountId) {
      fetchLatestRankings();
    } else {
      setLoading(false);
    }
  }, [googleAccountId]);

  const fetchLatestRankings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch the latest rankings for all locations of this google account
      const response = await fetch(
        `/api/practice-ranking/latest?googleAccountId=${googleAccountId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No ranking found yet
          setRankings([]);
          return;
        }
        throw new Error("Failed to fetch ranking data");
      }

      const data = await response.json();
      // Handle both old format (single ranking) and new format (rankings array)
      if (data.rankings && Array.isArray(data.rankings)) {
        setRankings(data.rankings);
        // Auto-select first location if multiple
        if (data.rankings.length > 0) {
          const firstRanking = data.rankings[0];
          setSelectedLocationId(
            firstRanking.gbpLocationId || firstRanking.id.toString()
          );
        }
      } else if (data.ranking) {
        // Legacy single ranking format
        setRankings([data.ranking]);
        setSelectedLocationId(
          data.ranking.gbpLocationId || data.ranking.id.toString()
        );
      }
    } catch (err) {
      console.error("Error fetching rankings:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load ranking data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch approved tasks for a specific ranking
  const fetchRankingTasks = async (practiceRankingId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/practice-ranking/tasks?practiceRankingId=${practiceRankingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch ranking tasks");
        return;
      }

      const data = await response.json();
      setRankingTasks((prev) => ({ ...prev, [practiceRankingId]: data.tasks }));
    } catch (error) {
      console.error("Error fetching ranking tasks:", error);
    }
  };

  // Fetch tasks when rankings are loaded
  useEffect(() => {
    if (rankings.length > 0) {
      // Fetch tasks for all rankings
      rankings.forEach((ranking) => {
        if (!rankingTasks[ranking.id]) {
          fetchRankingTasks(ranking.id);
        }
      });
    }
  }, [rankings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-body text-alloro-navy pb-24 lg:pb-32">
        <div className="max-w-[1400px] mx-auto relative flex flex-col">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 lg:sticky lg:top-0 z-40">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-alloro-navy text-white rounded-xl flex items-center justify-center shadow-lg">
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h1 className="text-[10px] font-bold font-heading text-alloro-navy uppercase tracking-[0.2em]">
                    Market Intelligence
                  </h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Loading rankings data...
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Skeleton Content */}
          <main className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-8 lg:py-12">
            <LoadingSkeleton />
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-[#F8FAFC] font-body flex items-center justify-center py-16"
      >
        <div className="text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-premium p-10">
          <div className="p-4 bg-red-50 rounded-2xl w-fit mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-alloro-navy font-heading mb-2 tracking-tight">
            Unable to Load Rankings
          </h3>
          <p className="text-slate-500 text-sm font-medium mb-6">{error}</p>
          <button
            onClick={fetchLatestRankings}
            className="px-6 py-3 bg-alloro-cobalt text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  if (!googleAccountId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-[#F8FAFC] font-body flex items-center justify-center py-16"
      >
        <div className="text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-premium p-10">
          <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto mb-4">
            <Trophy className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-alloro-navy font-heading mb-2 tracking-tight">
            No Account Connected
          </h3>
          <p className="text-slate-500 text-sm font-medium">
            Please connect your Google account to view ranking data.
          </p>
        </div>
      </motion.div>
    );
  }

  if (rankings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-[#F8FAFC] font-body flex items-center justify-center py-16"
      >
        <div className="text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-premium p-10">
          <div className="p-4 bg-amber-50 rounded-2xl w-fit mx-auto mb-4">
            <Trophy className="h-10 w-10 text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-alloro-navy font-heading mb-2 tracking-tight">
            No Ranking Data Yet
          </h3>
          <p className="text-slate-500 text-sm font-medium">
            Your practice ranking analysis hasn't been completed yet. Please
            check back later or contact your administrator.
          </p>
        </div>
      </motion.div>
    );
  }

  // Get selected ranking
  const selectedRanking =
    rankings.find(
      (r) => (r.gbpLocationId || r.id.toString()) === selectedLocationId
    ) || rankings[0];

  // If only one location, show the full dashboard directly
  if (rankings.length === 1) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-body text-alloro-navy pb-24 lg:pb-32">
        <div className="max-w-[1400px] mx-auto relative flex flex-col">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 lg:sticky lg:top-0 z-40">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-alloro-navy text-white rounded-xl flex items-center justify-center shadow-lg">
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h1 className="text-[10px] font-bold font-heading text-alloro-navy uppercase tracking-[0.2em]">
                    Market Intelligence
                  </h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Real-time Performance
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Location:
                </span>
                <span className="text-[10px] font-bold text-alloro-navy">
                  {rankings[0].gbpLocationName || rankings[0].domain}
                </span>
              </div>
            </div>
          </header>

          <main className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-12 lg:space-y-16">
            <PerformanceDashboard
              result={rankings[0]}
              tasks={rankingTasks[rankings[0].id] || []}
            />
          </main>
        </div>
      </div>
    );
  }

  // Multiple locations - show overview with location cards
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-alloro-navy pb-24 lg:pb-32">
      <div className="max-w-[1400px] mx-auto relative flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 lg:sticky lg:top-0 z-40">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-alloro-navy text-white rounded-xl flex items-center justify-center shadow-lg">
                <LayoutGrid size={20} />
              </div>
              <div>
                <h1 className="text-[10px] font-bold font-heading text-alloro-navy uppercase tracking-[0.2em]">
                  Market Intelligence
                </h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Real-time Performance
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Locations:
              </span>
              <span className="text-[10px] font-bold text-alloro-navy">
                {rankings.length} Active
              </span>
            </div>
          </div>
        </header>

        <main className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-12 lg:space-y-16">
          {/* 1. LOCATION SELECTION - PARALLEL CARDS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rankings.map((ranking, index) => {
              const isSelected =
                (ranking.gbpLocationId || ranking.id.toString()) ===
                selectedLocationId;
              const locationName = ranking.gbpLocationName || ranking.domain;
              const clientRating =
                ranking.rankingFactors?.star_rating?.value ??
                ranking.rawData?.client_gbp?.averageRating ??
                0;

              return (
                <motion.div
                  key={ranking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() =>
                    setSelectedLocationId(
                      ranking.gbpLocationId || ranking.id.toString()
                    )
                  }
                  className={`p-6 lg:p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                    isSelected
                      ? "bg-white border-alloro-cobalt shadow-premium"
                      : "bg-white/60 border-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-alloro-cobalt text-white shadow-lg"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-heading text-alloro-navy tracking-tight mb-1">
                          {locationName}
                        </h3>
                        {ranking.location && (
                          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[9px] uppercase tracking-widest">
                            <MapPin size={10} /> {ranking.location}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2
                        className="text-alloro-cobalt shrink-0"
                        size={24}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-slate-50/50 rounded-2xl p-3 sm:p-4 text-center border border-slate-100">
                      <p className="text-lg sm:text-xl font-bold font-heading text-alloro-navy leading-none mb-1">
                        #{ranking.rankPosition}
                      </p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                        Rank
                      </p>
                    </div>
                    <div className="bg-slate-50/50 rounded-2xl p-3 sm:p-4 text-center border border-slate-100">
                      <p className="text-lg sm:text-xl font-bold font-heading text-alloro-navy leading-none mb-1">
                        {Number(ranking.rankScore).toFixed(0)}
                      </p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                        Score
                      </p>
                    </div>
                    <div className="bg-slate-50/50 rounded-2xl p-3 sm:p-4 text-center border border-slate-100">
                      <p className="text-lg sm:text-xl font-bold font-heading text-alloro-navy leading-none mb-1">
                        {Number(clientRating).toFixed(1)}
                      </p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                        Rating
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </section>

          {/* Selected Location Detail */}
          {selectedRanking && (
            <PerformanceDashboard
              result={selectedRanking}
              tasks={rankingTasks[selectedRanking.id] || []}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// Helper function to get score color - temporarily unused
// function getScoreColor(score: number): string {
//   if (score >= 80) return "text-green-600";
//   if (score >= 60) return "text-amber-600";
//   return "text-red-600";
// }

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
function PerformanceDashboard({
  result,
  tasks,
}: {
  result: RankingResult;
  tasks: RankingTask[];
}) {
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [clampedTasks, setClampedTasks] = useState<Set<number>>(new Set());
  const descriptionRefs = useRef<Map<number, HTMLParagraphElement>>(new Map());

  // Check which descriptions are clamped after tasks load
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const checkClamped = () => {
      const newClampedTasks = new Set<number>();
      descriptionRefs.current.forEach((element, taskId) => {
        if (element && element.scrollHeight > element.clientHeight) {
          newClampedTasks.add(taskId);
        }
      });
      setClampedTasks(newClampedTasks);
    };

    // Small delay to ensure DOM is rendered
    setTimeout(checkClamped, 100);
  }, [tasks]);

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

  // Calculate trend directions
  const getRankTrend = () => {
    if (!result.previousAnalysis) return undefined;
    const change = result.rankPosition - result.previousAnalysis.rankPosition;
    if (change === 0) return undefined;
    return {
      value: Math.abs(change).toString(),
      dir: change < 0 ? "up" : ("down" as "up" | "down"),
    };
  };

  const getScoreTrend = () => {
    if (!result.previousAnalysis) return undefined;
    const prev = Number(result.previousAnalysis.rankScore);
    const curr = Number(result.rankScore);
    const change = curr - prev;
    if (change === 0) return undefined;
    return {
      value: Math.abs(change).toFixed(0),
      dir: change > 0 ? "up" : ("down" as "up" | "down"),
    };
  };

  const rankTrend = getRankTrend();
  const scoreTrend = getScoreTrend();

  return (
    <div className="space-y-12 lg:space-y-16">
      {/* 2. MARKET VITALS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard
          label="Current Rank"
          value={`#${result.rankPosition}`}
          sub={`of ${result.totalCompetitors} Competitors`}
          trend={rankTrend?.value}
          dir={rankTrend?.dir}
        />
        <KPICard
          label="Satisfaction"
          value={Number(clientRating).toFixed(1)}
          rating
          sub={`Market Avg: ${marketAvgRating.toFixed(1)}`}
        />
        <KPICard
          label="Reviews"
          value={clientReviews.toString()}
          warning={reviewGap > 0}
          sub={
            reviewGap > 0 ? `${reviewGap} behind leader` : "Leading position"
          }
        />
        <KPICard
          label="Visibility"
          value={Number(result.rankScore).toFixed(0)}
          suffix="/100"
          sub={
            Number(result.rankScore) >= 80
              ? "Excellent performance"
              : Number(result.rankScore) >= 60
              ? "Good, room to grow"
              : "Needs improvement"
          }
          trend={scoreTrend?.value}
          dir={scoreTrend?.dir}
        />
      </section>

      {/* 3. COMPETITIVE MATRIX */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
        <div className="px-6 sm:px-10 py-8 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold font-heading text-alloro-navy tracking-tight">
            Competitive Matrix
          </h2>
          <div className="hidden sm:block text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            Active Benchmarking
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-10 py-5">Practice Name</th>
                <th className="px-4 py-5 text-center">Rank</th>
                <th className="px-4 py-5 text-center">Reviews</th>
                <th className="px-10 py-5 text-right">Mthly Pace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                  result.gbpLocationName ||
                  result.rawData?.client_gbp?._raw?.locations?.[0]
                    ?.displayName ||
                  result.domain;
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
                    className={`${
                      comp.isClient
                        ? "bg-alloro-cobalt/[0.03]"
                        : "hover:bg-slate-50/30"
                    } transition-all group`}
                  >
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span
                          className={`text-[15px] font-bold tracking-tight ${
                            comp.isClient
                              ? "text-alloro-cobalt"
                              : "text-alloro-navy"
                          }`}
                        >
                          {comp.name}
                        </span>
                        {comp.isClient ? (
                          <span className="text-[8px] font-bold bg-alloro-cobalt text-white px-1.5 py-0.5 rounded uppercase tracking-widest w-fit mt-1">
                            Identity
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest w-fit mt-1">
                            Benchmark
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span
                        className={`text-lg font-bold font-heading ${
                          comp.rankPosition <= 3
                            ? "text-alloro-cobalt"
                            : "text-slate-400"
                        }`}
                      >
                        #{comp.rankPosition}
                      </span>
                    </td>
                    <td className="px-4 py-6 text-center font-bold text-alloro-navy tabular-nums">
                      {comp.totalReviews.toLocaleString()}
                    </td>
                    <td className="px-10 py-6 text-right font-bold text-green-600 tabular-nums">
                      +{comp.reviewsLast30d || 0}
                      <ArrowUpRight
                        size={14}
                        className="inline ml-1 mb-1 opacity-40"
                      />
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. ACTION PLAN */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
        <div className="px-6 sm:px-10 py-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold font-heading text-alloro-navy tracking-tight leading-none mb-1">
              Action Plan
            </h3>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Tactical rank improvement steps
            </p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-alloro-cobalt rounded-xl flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
        </div>
        <div className="p-6 sm:p-8 space-y-4">
          {/* Show approved tasks from tasks table if available */}
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <div
                key={task.id}
                className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 hover:bg-white hover:border-alloro-cobalt/20 transition-all"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-alloro-navy text-[15px] tracking-tight">
                    {task.title}
                  </h4>
                  {task.description && (
                    <div>
                      <p
                        ref={(el) => {
                          if (el) {
                            descriptionRefs.current.set(task.id, el);
                          }
                        }}
                        className={`text-[13px] text-slate-500 font-medium tracking-tight leading-relaxed ${
                          expandedTaskId === task.id ? "" : "line-clamp-2"
                        }`}
                      >
                        {task.description}
                      </p>
                      {clampedTasks.has(task.id) && (
                        <button
                          onClick={() =>
                            setExpandedTaskId(
                              expandedTaskId === task.id ? null : task.id
                            )
                          }
                          className="text-xs text-alloro-cobalt hover:text-blue-700 font-bold mt-1"
                        >
                          {expandedTaskId === task.id
                            ? "Show less"
                            : "Read more"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {task.metadata?.priority && (
                    <span
                      className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                        task.metadata.priority === "1" ||
                        task.metadata.priority === "high"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                      }`}
                    >
                      {task.metadata.priority === "1" ||
                      task.metadata.priority === "high"
                        ? "High"
                        : "Medium"}
                    </span>
                  )}
                  {task.metadata?.effort && (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      {task.metadata.effort}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : result.llmAnalysis?.top_recommendations &&
            result.llmAnalysis.top_recommendations.length > 0 ? (
            // Fallback: Show recommendations from LLM analysis (not yet approved as tasks)
            result.llmAnalysis.top_recommendations
              .slice(0, 4)
              .map((rec, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 hover:bg-white hover:border-alloro-cobalt/20 transition-all"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-alloro-navy text-[15px] tracking-tight">
                      {rec.title}
                    </h4>
                    {rec.description && (
                      <p className="text-[13px] text-slate-500 font-medium tracking-tight leading-relaxed">
                        {rec.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                        rec.priority === 1
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                      }`}
                    >
                      {rec.priority === 1 ? "High" : "Medium"}
                    </span>
                  </div>
                </div>
              ))
          ) : (
            // Fallback to generated recommendations based on gaps
            <>
              {reviewGap > 50 && (
                <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 hover:bg-white hover:border-alloro-cobalt/20 transition-all">
                  <div className="space-y-1">
                    <h4 className="font-bold text-alloro-navy text-[15px] tracking-tight">
                      Launch Aggressive Review Generation Campaign
                    </h4>
                    <p className="text-[13px] text-slate-500 font-medium tracking-tight leading-relaxed">
                      You're {reviewGap} reviews behind the leader. Implement an
                      automated review request system.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border bg-red-50 text-red-600 border-red-100">
                      High
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      2-4 weeks
                    </span>
                  </div>
                </div>
              )}
              {(result.rawData?.client_gbp?.postsLast90d || 0) < 4 && (
                <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 hover:bg-white hover:border-alloro-cobalt/20 transition-all">
                  <div className="space-y-1">
                    <h4 className="font-bold text-alloro-navy text-[15px] tracking-tight">
                      Establish Weekly GBP Posting Routine
                    </h4>
                    <p className="text-[13px] text-slate-500 font-medium tracking-tight leading-relaxed">
                      Regular posts improve GBP activity signals and engagement.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border bg-blue-50 text-blue-600 border-blue-100">
                      Medium
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      Ongoing
                    </span>
                  </div>
                </div>
              )}
              <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 hover:bg-white hover:border-alloro-cobalt/20 transition-all">
                <div className="space-y-1">
                  <h4 className="font-bold text-alloro-navy text-[15px] tracking-tight">
                    Deploy Local and Review Schema Markup
                  </h4>
                  <p className="text-[13px] text-slate-500 font-medium tracking-tight leading-relaxed">
                    Structured data helps search engines understand your
                    business better.
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border bg-blue-50 text-blue-600 border-blue-100">
                    Medium
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    1 week
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Patient Engagement & Summary Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Your Summary */}
        <section className="rounded-2xl border border-alloro-cobalt/20 bg-alloro-cobalt/5 p-6 lg:p-8">
          <h3 className="flex items-center gap-2 text-lg font-bold text-alloro-navy font-heading mb-4">
            <div className="p-1.5 bg-alloro-cobalt/10 rounded-lg">
              <Stethoscope className="h-5 w-5 text-alloro-cobalt" />
            </div>
            Your Summary
          </h3>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {result.llmAnalysis?.client_summary ||
              result.llmAnalysis?.render_text ||
              "No summary available."}
          </div>
        </section>

        {/* Patient Engagement */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-premium">
          <h3 className="text-lg font-bold text-alloro-navy font-heading mb-4">
            Patient Engagement{" "}
            <span className="text-sm font-medium text-slate-500">
              (30 Days)
            </span>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-alloro-cobalt/5 p-4 text-center border border-alloro-cobalt/10">
              <div className="p-2 bg-alloro-cobalt/10 rounded-lg w-fit mx-auto mb-2">
                <Phone className="h-5 w-5 text-alloro-cobalt" />
              </div>
              <div className="text-2xl font-bold text-alloro-navy tabular-nums">
                {performance.calls || 0}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                Calls
              </div>
            </div>
            <div className="rounded-xl bg-alloro-teal/5 p-4 text-center border border-alloro-teal/10">
              <div className="p-2 bg-alloro-teal/10 rounded-lg w-fit mx-auto mb-2">
                <Navigation className="h-5 w-5 text-alloro-teal" />
              </div>
              <div className="text-2xl font-bold text-alloro-navy tabular-nums">
                {performance.directions || 0}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                Directions
              </div>
            </div>
            <div className="rounded-xl bg-purple-50 p-4 text-center border border-purple-100">
              <div className="p-2 bg-purple-100 rounded-lg w-fit mx-auto mb-2">
                <MousePointer className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-alloro-navy tabular-nums">
                {performance.clicks || 0}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                Clicks
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      {/* Location Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="p-6 lg:p-8 rounded-2xl border-2 border-slate-100 bg-white"
          >
            <div className="flex gap-4 mb-6">
              <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
              <div>
                <div className="h-5 w-32 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="bg-slate-50 rounded-2xl p-4">
                  <div className="h-6 w-12 bg-slate-200 rounded mx-auto mb-2" />
                  <div className="h-3 w-10 bg-slate-200 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8"
          >
            <div className="h-3 w-20 bg-slate-200 rounded mb-6" />
            <div className="h-10 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-28 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-100">
          <div className="h-6 w-48 bg-slate-200 rounded" />
        </div>
        <div className="p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4">
              <div className="h-4 w-48 bg-slate-200 rounded" />
              <div className="h-4 w-12 bg-slate-200 rounded ml-auto" />
              <div className="h-4 w-16 bg-slate-200 rounded" />
              <div className="h-4 w-14 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RankingsDashboard;
