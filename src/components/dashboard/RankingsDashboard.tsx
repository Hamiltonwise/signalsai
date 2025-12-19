import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Phone,
  Navigation,
  MousePointer,
  AlertTriangle,
  Rocket,
  Stethoscope,
  MapPin,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Building,
  Layers,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

// Tooltip component with animation
function Tooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      {children}
      <button
        className="ml-1 text-slate-400 hover:text-slate-600 transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        <HelpCircle className="h-3 w-3" />
      </button>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 text-xs font-medium text-white bg-slate-800 rounded-lg shadow-lg w-48 text-center"
          >
            {text}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px]">
              <div className="border-4 border-transparent border-b-slate-800" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// TrendIndicator component - shows trend compared to previous analysis
function TrendIndicator({
  currentValue,
  previousValue,
  lowerIsBetter = false,
  format = "percent",
  colorClassName,
}: {
  currentValue: number | null | undefined;
  previousValue: number | null | undefined;
  lowerIsBetter?: boolean;
  format?: "percent" | "points" | "rank";
  colorClassName?: string; // Fallback color when no trend data
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  // If no previous value, show decorative circle
  if (
    previousValue === null ||
    previousValue === undefined ||
    currentValue === null ||
    currentValue === undefined
  ) {
    return (
      <div
        className={`absolute top-0 right-0 w-20 h-20 ${
          colorClassName || "bg-slate-100/50"
        } rounded-full -mr-10 -mt-10`}
      />
    );
  }

  // Calculate change
  const change = currentValue - previousValue;

  // For rank, show absolute change; for others, calculate percentage
  let displayValue: string;
  if (format === "rank") {
    // For rank: negative change is improvement (went from #3 to #2)
    displayValue = change === 0 ? "0" : change > 0 ? `+${change}` : `${change}`;
  } else if (format === "points") {
    displayValue =
      change === 0
        ? "0"
        : change > 0
        ? `+${change.toFixed(0)}`
        : `${change.toFixed(0)}`;
  } else {
    // Percentage change
    const percentChange =
      previousValue !== 0 ? (change / previousValue) * 100 : 0;
    displayValue =
      percentChange === 0
        ? "0%"
        : percentChange > 0
        ? `+${percentChange.toFixed(1)}%`
        : `${percentChange.toFixed(1)}%`;
  }

  // Determine if this is an improvement
  const isImprovement = lowerIsBetter ? change < 0 : change > 0;
  const noChange = change === 0;

  return (
    <div
      className="absolute top-2 right-2 z-10"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all cursor-default ${
          noChange
            ? "bg-slate-100 text-slate-500"
            : isImprovement
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {!noChange &&
          (isImprovement ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          ))}
        <span>{displayValue}</span>
      </div>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 top-full right-0 mt-2 px-3 py-2 text-xs font-medium text-white bg-slate-800 rounded-lg shadow-lg whitespace-nowrap"
          >
            Compared to previous analysis
            <div className="absolute bottom-full right-3 mb-[-1px]">
              <div className="border-4 border-transparent border-b-slate-800" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
      <div className="space-y-8">
        {/* Header - Always Visible */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-alloro-cobalt/10 rounded-xl">
                <BarChart3 className="w-6 h-6 text-alloro-cobalt" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading text-alloro-navy tracking-tight">
                  Performance Dashboard
                </h1>
                <p className="text-slate-500 text-sm mt-0.5 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-alloro-cobalt"></span>
                  Loading rankings data...
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Skeleton Content */}
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-64 items-center justify-center"
      >
        <div className="text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
          <div className="p-3 bg-red-50 rounded-xl w-fit mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-alloro-navy font-heading mb-2">
            Unable to Load Rankings
          </h3>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button
            onClick={fetchLatestRankings}
            className="px-5 py-2.5 bg-alloro-cobalt text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm flex items-center gap-2 mx-auto"
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
        className="flex h-64 items-center justify-center"
      >
        <div className="text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
          <div className="p-3 bg-slate-100 rounded-xl w-fit mx-auto mb-4">
            <Trophy className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-alloro-navy font-heading mb-2">
            No Account Connected
          </h3>
          <p className="text-slate-600 text-sm">
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
        className="flex h-64 items-center justify-center"
      >
        <div className="text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
          <div className="p-3 bg-amber-50 rounded-xl w-fit mx-auto mb-4">
            <Trophy className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-alloro-navy font-heading mb-2">
            No Ranking Data Yet
          </h3>
          <p className="text-slate-600 text-sm">
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
      <PerformanceDashboard
        result={rankings[0]}
        tasks={rankingTasks[rankings[0].id] || []}
      />
    );
  }

  // Multiple locations - show overview with location cards
  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-alloro-cobalt/10 rounded-xl">
              <BarChart3 className="w-6 h-6 text-alloro-cobalt" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-alloro-navy tracking-tight">
                Performance Dashboard
              </h1>
              <p className="text-slate-500 text-sm mt-0.5 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-alloro-cobalt"></span>
                {rankings.length} locations analyzed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg font-medium">
              <Layers className="h-4 w-4" />
              Multi-Location Overview
            </span>
          </div>
        </div>
      </header>

      {/* Location Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rankings.map((ranking, index) => {
          const isSelected =
            (ranking.gbpLocationId || ranking.id.toString()) ===
            selectedLocationId;
          return (
            <motion.div
              key={ranking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <LocationCard
                ranking={ranking}
                isSelected={isSelected}
                onClick={() =>
                  setSelectedLocationId(
                    ranking.gbpLocationId || ranking.id.toString()
                  )
                }
              />
            </motion.div>
          );
        })}
      </div>

      {/* Selected Location Detail */}
      {selectedRanking && (
        <motion.div
          key={selectedLocationId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-slate-200 pt-8"
        >
          <PerformanceDashboard
            result={selectedRanking}
            tasks={rankingTasks[selectedRanking.id] || []}
          />
        </motion.div>
      )}
    </div>
  );
}

// Location Card Component for Multi-Location Overview
function LocationCard({
  ranking,
  isSelected,
  onClick,
}: {
  ranking: RankingResult;
  isSelected: boolean;
  onClick: () => void;
}) {
  const scoreColor = getScoreColor(Number(ranking.rankScore));
  const locationName = ranking.gbpLocationName || ranking.domain;
  const clientRating =
    ranking.rankingFactors?.star_rating?.value ??
    ranking.rawData?.client_gbp?.averageRating ??
    0;
  const clientReviews = ranking.rawData?.client_gbp?.totalReviewCount || 0;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 ${
        isSelected
          ? "border-alloro-cobalt bg-alloro-cobalt/5 shadow-lg shadow-blue-100"
          : "border-slate-200 bg-white hover:border-alloro-cobalt/50 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isSelected ? "bg-alloro-cobalt/10" : "bg-slate-100"
            }`}
          >
            <Building
              className={`h-4 w-4 ${
                isSelected ? "text-alloro-cobalt" : "text-slate-400"
              }`}
            />
          </div>
          <h3 className="font-bold text-alloro-navy truncate max-w-[180px]">
            {locationName}
          </h3>
        </div>
        {isSelected ? (
          <ChevronDown className="h-5 w-5 text-alloro-cobalt" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-400" />
        )}
      </div>

      {ranking.location && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-3 font-medium">
          <MapPin className="h-3 w-3" />
          {ranking.location}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Rank Position */}
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="text-lg font-bold text-alloro-navy tabular-nums">
            #{ranking.rankPosition}
          </div>
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
            Rank
          </div>
        </div>

        {/* Score */}
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className={`text-lg font-bold tabular-nums ${scoreColor}`}>
            {Number(ranking.rankScore).toFixed(0)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
            Score
          </div>
        </div>

        {/* Rating */}
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg font-bold text-alloro-navy tabular-nums">
              {Number(clientRating).toFixed(1)}
            </span>
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {clientReviews} reviews
          </div>
        </div>
      </div>

      {/* Specialty Badge */}
      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full bg-alloro-cobalt/10 px-2.5 py-1 text-xs font-bold text-alloro-cobalt capitalize">
          {ranking.specialty}
        </span>
        <span className="text-xs text-slate-400 font-medium">
          of {ranking.totalCompetitors}
        </span>
      </div>
    </div>
  );
}

// Helper function to get score color
function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* KPI Grid - 4 Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Current Rank Position */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden group"
        >
          <TrendIndicator
            currentValue={result.rankPosition}
            previousValue={result.previousAnalysis?.rankPosition}
            lowerIsBetter={true}
            format="rank"
            colorClassName="bg-alloro-cobalt/5 group-hover:bg-alloro-cobalt/10 transition-colors"
          />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Current Rank
          </h3>
          <div className="mt-3 text-4xl font-bold text-alloro-navy font-heading tabular-nums">
            #{result.rankPosition ?? "-"}
          </div>
          <div className="mt-2 text-sm text-slate-500 font-medium">
            of {result.totalCompetitors ?? "-"} Competitors
          </div>
        </motion.div>

        {/* Patient Satisfaction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden group"
        >
          <TrendIndicator
            currentValue={Number(clientRating)}
            previousValue={
              result.previousAnalysis?.rawData?.client_gbp?.averageRating
            }
            format="points"
            colorClassName="bg-green-500/5 group-hover:bg-green-500/10 transition-colors"
          />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Patient Satisfaction
          </h3>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-4xl font-bold text-alloro-navy font-heading tabular-nums">
              {Number(clientRating).toFixed(1)}
            </span>
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          </div>
          <div className="mt-2 text-sm text-slate-500 font-medium">
            Market Avg: {marketAvgRating.toFixed(1)}
          </div>
        </motion.div>

        {/* Total Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-colors"></div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Reviews
          </h3>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-4xl font-bold text-alloro-navy font-heading tabular-nums">
              {clientReviews}
            </span>
            {reviewGap > 0 && (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div
            className={`mt-2 text-sm font-bold ${
              reviewGap > 0 ? "text-amber-600" : "text-green-600"
            }`}
          >
            {reviewGap > 0 ? (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 rotate-180" />-{reviewGap} behind
                Leader
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Leading position
              </span>
            )}
          </div>
        </motion.div>

        {/* Visibility Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden group"
        >
          <TrendIndicator
            currentValue={Number(result.rankScore)}
            previousValue={
              result.previousAnalysis?.rankScore
                ? Number(result.previousAnalysis.rankScore)
                : undefined
            }
            format="points"
            colorClassName="bg-alloro-cobalt/5 group-hover:bg-alloro-cobalt/10 transition-colors"
          />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Visibility Score
          </h3>
          <div className="mt-3">
            <span
              className={`text-4xl font-bold font-heading tabular-nums ${getScoreColor(
                Number(result.rankScore)
              )}`}
            >
              {Number(result.rankScore).toFixed(0)}
            </span>
            <span className="text-xl text-slate-400 font-medium"> / 100</span>
          </div>
          <div className="mt-2 text-sm text-slate-500 font-medium">
            {Number(result.rankScore) >= 80
              ? "Excellent performance"
              : Number(result.rankScore) >= 60
              ? "Good, room to grow"
              : "Needs improvement"}
          </div>
        </motion.div>
      </div>

      {/* Main Row: Your Summary + Patient Engagement */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* Your Summary - 3 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-3 rounded-2xl border border-alloro-cobalt/20 bg-alloro-cobalt/5 p-6"
        >
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
        </motion.div>

        {/* Patient Engagement - 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
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
        </motion.div>
      </div>

      {/* Bottom Row: Review Gap Table + Action Plan */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* The Review Gap Table - 3 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <h3 className="flex items-center gap-2 text-lg font-bold text-alloro-navy font-heading mb-5">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            Top Competitors
          </h3>
          <div className="overflow-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 font-bold text-slate-400 text-xs"></th>
                  <th className="text-left py-3 px-2 font-bold text-slate-400 text-xs">
                    <Tooltip text="Business name of the competitor">
                      <span>Practice</span>
                    </Tooltip>
                  </th>
                  <th className="text-center py-3 px-2 font-bold text-slate-400 text-xs">
                    <Tooltip text="Position in local search rankings">
                      <span>Rank</span>
                    </Tooltip>
                  </th>
                  <th className="text-center py-3 px-2 font-bold text-slate-400 text-xs">
                    <Tooltip text="Total number of Google reviews">
                      <span>Reviews</span>
                    </Tooltip>
                  </th>
                  <th className="text-center py-3 px-2 font-bold text-slate-400 text-xs">
                    <Tooltip text="New reviews in the last 30 days">
                      <span>Monthly</span>
                    </Tooltip>
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
                      className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                        comp.isClient ? "bg-alloro-cobalt/5" : ""
                      }`}
                    >
                      <td className="py-3 px-2">
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
                      <td className="py-3 px-2">
                        <span
                          className={`font-bold ${
                            comp.isClient
                              ? "text-alloro-cobalt"
                              : "text-alloro-navy"
                          }`}
                        >
                          {comp.name}
                          {comp.isClient && (
                            <span className="ml-1.5 text-[10px] bg-alloro-cobalt text-white px-1.5 py-0.5 rounded font-bold">
                              YOU
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-alloro-navy tabular-nums">
                        #{comp.rankPosition}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-700 tabular-nums">
                        {comp.totalReviews}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-500 tabular-nums">
                        +{comp.reviewsLast30d || 0}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Doctor's Action Plan - 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <h3 className="flex items-center gap-2 text-lg font-bold text-alloro-navy font-heading mb-5">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <Rocket className="h-5 w-5 text-red-600" />
            </div>
            Your Action Plan
          </h3>
          <div className="space-y-3">
            {/* Show approved tasks from tasks table if available */}
            {tasks && tasks.length > 0 ? (
              tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-alloro-cobalt flex items-center justify-center text-xs font-bold text-white">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-alloro-navy text-sm line-clamp-2">
                          {task.title}
                        </h4>
                        {task.metadata?.priority && (
                          <span
                            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              task.metadata.priority === "1" ||
                              task.metadata.priority === "high"
                                ? "bg-red-100 text-red-700"
                                : task.metadata.priority === "2" ||
                                  task.metadata.priority === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            P{task.metadata.priority}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <div className="mb-2">
                          <p
                            ref={(el) => {
                              if (el) {
                                descriptionRefs.current.set(task.id, el);
                              }
                            }}
                            className={`text-xs text-slate-600 leading-relaxed ${
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                          {task.metadata?.impact && (
                            <span>{task.metadata.impact} impact</span>
                          )}
                          {task.metadata?.timeline && (
                            <span>{task.metadata.timeline}</span>
                          )}
                        </div>
                        <a
                          href={`/tasks?taskId=${task.id}`}
                          className="flex items-center gap-1 text-xs font-bold text-alloro-cobalt hover:text-blue-700 transition-colors"
                        >
                          Start task
                          <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : result.llmAnalysis?.top_recommendations &&
              result.llmAnalysis.top_recommendations.length > 0 ? (
              // Fallback: Show recommendations from LLM analysis (not yet approved as tasks)
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Recommendations pending approval
                </div>
                <p className="text-xs text-amber-600">
                  Your action plan recommendations are being reviewed. They will
                  appear here once approved by your administrator.
                </p>
              </div>
            ) : (
              // Fallback to generated recommendations based on gaps
              <>
                {reviewGap > 50 && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-alloro-cobalt flex items-center justify-center text-xs font-bold text-white">
                      1
                    </div>
                    <div className="flex items-start gap-2 pt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 font-medium leading-tight">
                        Launch Aggressive Review Generation Campaign
                      </span>
                    </div>
                  </div>
                )}
                {(result.rawData?.client_gbp?.postsLast90d || 0) < 4 && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-alloro-cobalt flex items-center justify-center text-xs font-bold text-white">
                      {reviewGap > 50 ? 2 : 1}
                    </div>
                    <div className="flex items-start gap-2 pt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 font-medium leading-tight">
                        Establish Weekly GBP Posting Routine
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-alloro-cobalt flex items-center justify-center text-xs font-bold text-white">
                    {(reviewGap > 50 ? 1 : 0) +
                      ((result.rawData?.client_gbp?.postsLast90d || 0) < 4
                        ? 1
                        : 0) +
                      1}
                  </div>
                  <div className="flex items-start gap-2 pt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 font-medium leading-tight">
                      Deploy Local and Review Schema Markup
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Loading Skeleton Component - Only content, header shown separately
function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* KPI Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <div className="h-3 w-20 bg-slate-200 rounded mb-4" />
            <div className="h-10 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-28 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Main Row Skeleton */}
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 bg-slate-200 rounded-lg" />
            <div className="h-5 w-32 bg-slate-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 rounded" />
            <div className="h-4 w-4/6 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-slate-50 p-4 text-center border border-slate-100"
              >
                <div className="h-8 w-8 bg-slate-200 rounded-lg mx-auto mb-2" />
                <div className="h-7 w-12 bg-slate-200 rounded mx-auto mb-1" />
                <div className="h-3 w-14 bg-slate-200 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 bg-slate-200 rounded-lg" />
            <div className="h-5 w-36 bg-slate-200 rounded" />
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-5 w-5 bg-slate-200 rounded" />
                <div className="h-4 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-12 bg-slate-200 rounded ml-auto" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
                <div className="h-4 w-14 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 bg-slate-200 rounded-lg" />
            <div className="h-5 w-32 bg-slate-200 rounded" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-7 w-7 bg-slate-200 rounded-full" />
                <div className="h-4 w-56 bg-slate-200 rounded mt-1.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RankingsDashboard;
